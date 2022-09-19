let showLocalWeatherBtn = document.querySelector('.weather__local-weather');
let updateDatetimeBtn = document.querySelector('.weather__update');
let weatherStatus = document.querySelector('.weather__status__datetime');
let searchInp = document.querySelector('.weather__search');
let city = document.querySelector('.weather__city');
let day = document.querySelector('.weather__day');
let humidity = document.querySelector('.weather__indicator--humidity>.value');
let wind = document.querySelector('.weather__indicator--wind>.value');
let pressure = document.querySelector('.weather__indicator--pressure>.value');
let picture = document.querySelector('.weather__picture');
let temperature = document.querySelector('.weather__temperature>.value');
let forecastBlock = document.querySelector('.weather__forecast');
let weatherAPIKey = 'API_KEY';
let weatherBaseEndpoint = 'https://api.openweathermap.org/data/2.5/weather?units=metric&appid=' + weatherAPIKey;
let forecastBaseEndpoint = 'https://api.openweathermap.org/data/2.5/forecast?units=metric&appid=' + weatherAPIKey;
let geocodingBaseEndpoint = 'http://api.openweathermap.org/geo/1.0/direct?&limit=5&appid='+weatherAPIKey+'&q=';
let datalist = document.getElementById('suggestions');
let state = {
    city: '',
    lat: 0,
    lon: 0
}

let weatherImages = [
    {
        url: 'images/clear-sky',
        ids: [800]
    },
    {
        url: 'images/broken-clouds',
        ids: [803, 804]
    },
    {
        url: 'images/few-clouds',
        ids: [801]
    },
    {
        url: 'images/mist',
        ids: [701, 711, 721, 731, 741, 751, 761, 762, 771, 781]
    },
    {
        url: 'images/rain',
        ids: [500, 501, 502, 503, 504]
    },
    {
        url: 'images/scattered-clouds',
        ids: [802]
    },
    {
        url: 'images/shower-rain',
        ids: [520, 521, 522, 531, 300, 301, 302, 310, 311, 312, 313, 314, 321]
    },
    {
        url: 'images/snow',
        ids: [511, 600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622]
    },
    {
        url: 'images/thnderstorm',
        ids: [200, 201, 202, 210, 211, 212, 221, 230, 231, 232]
    }
]

window.addEventListener('load', async () => {
    if(navigator.serviceWorker) {
        await navigator.serviceWorker.register('sw.js');
    }
});

let getLocalData = () => {
    let localCity = localStorage.getItem('city');
    let localLat = localStorage.getItem('lat');
    let localLon = localStorage.getItem('lon');
    if(localCity) {
        state.city = localCity;
        state.lat = 0;
        state.lon = 0;
    } else if(localLat && localLon) {
        state.city = '';
        state.lat = localLat;
        state.lon = localLon;
    } else {
        state.city = '';
        state.lat = 0;
        state.lon = 0;
    }
}

let updateLocalData = (city, lat, lon) => {
    localStorage.setItem('city', city || '');
    localStorage.setItem('lat', lat || 0);
    localStorage.setItem('lon', lon || 0);
    state = {
        city: city || '',
        lat: lat || 0,
        lon: lon || 0
    }
}

let getWeatherByCityName = async (city) => {
    let endpoint = weatherBaseEndpoint + '&q=' + city;
    try {
        let response = await fetch(endpoint);
        let weather = await response.json();
        return weather;
    } catch(e) {
        console.log('Failed to fetch weather by city name');
        return null;
    }
}

let getWeatherByCoordinates = async (lat, lon) => {
    let endpoint = `${weatherBaseEndpoint}&lat=${lat}&lon=${lon}`;
    try {
        let response = await fetch(endpoint);
        let weather = await response.json();
        return weather;
    } catch(e) {
        console.log('Failed to fetch weather by coordinates');
        return null;
    }
}

let getForecastByCityID = async (id) => {
    let endpoint = forecastBaseEndpoint + '&id=' + id;
    try {
        let result = await fetch(endpoint);
        let forecast = await result.json();
        let forecastList = forecast.list;
        let daily = [];

        forecastList.forEach(day => {
            let date = new Date(day.dt_txt.replace(' ', 'T'));
            let hours = date.getHours();
            if(hours === 12) {
                daily.push(day);
            }
        })
        return daily;
    } catch(e) {
        console.log('Failed to fetch forecast by city id');
        return [];
    }   
}

let getForecastByCoordinates = async (lat, lon) => {
    let endpoint = `${forecastBaseEndpoint}&lat=${lat}&lon=${lon}`;
    try {
        let result = await fetch(endpoint);
        let forecast = await result.json();
        let forecastList = forecast.list;
        let daily = [];
        forecastList.forEach(day => {
            let date = new Date(day.dt_txt.replace(' ', 'T'));
            let hours = date.getHours();
            if(hours === 12) {
                daily.push(day);
            }
        })
        return daily;
    } catch(e) {
        console.log('Failed to fetch forecast by coordinates');
        return [];
    }
}
let weatherForCity = async (city) => {
    let weather = await getWeatherByCityName(city);
    if(weather.cod === '404') {
        return;
    }
    updateLocalData(city, 0, 0);
    updateDatetimeStatus();
    let cityID = weather.id;
    updateCurrentWeather(weather);
    let forecast = await getForecastByCityID(cityID);
    updateForecast(forecast);
}

let weatherForCoordinates = async (lat, lon) => {
    updateLocalData('', lat, lon);
    updateDatetimeStatus();
    let weather = await getWeatherByCoordinates(lat, lon);
    updateCurrentWeather(weather);
    let forecast = await getForecastByCoordinates(lat, lon);
    updateForecast(forecast);
}

let loadData = async () => {
    getLocalData();
    if(state.city === '' && state.lat === 0 && state.lon === 0) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            weatherForCoordinates(position.coords.latitude, position.coords.longitude);
        }, async () => {
            await weatherForCity('Kyiv')
        })
    } else if(state.city !== '') {
        weatherForCity(state.city);
    } else {
        weatherForCoordinates(state.lat, state.lon);
    }
    updateDatetimeStatus();
}

searchInp.addEventListener('keydown', async (e) => {
    if(e.keyCode === 13) {
        weatherForCity(searchInp.value);
    }
})
searchInp.addEventListener('input', async () => {
    if(searchInp.value.length <= 2) {
        return;
    }
    let endpoint = geocodingBaseEndpoint + searchInp.value;
    let result = [];
    try {
        result = await (await fetch(endpoint)).json();
    } catch(e) {
        console.log('Failed to fetch geocoding by input');
        result = [];
    }
    if(!(result instanceof Array)) return;
    datalist.innerHTML = '';
    result.forEach((city) => {
        let option = document.createElement('option');
        option.value = `${city.name}${city.state ? ', ' + city.state : ''}, ${city.country}`;
        datalist.appendChild(option);
    })
})

let updateCurrentWeather = (data) => {
    if(!data) return;
    city.textContent = data.name + ', ' + data.sys.country;
    day.textContent = dayOfWeek();
    humidity.textContent = data.main.humidity;
    pressure.textContent = data.main.pressure;
    let windDirection;
    let deg = data.wind.deg;
    if(deg > 45 && deg <= 135) {
        windDirection = 'East';
    } else if(deg > 135 && deg <= 225) {
        windDirection = 'South';
    } else if(deg > 225 && deg <= 315) {
        windDirection = 'West';
    } else {
        windDirection = 'North';
    }
    wind.textContent = windDirection + ', ' + data.wind.speed;
    temperature.textContent = data.main.temp > 0 ? 
                                '+' + Math.round(data.main.temp) : 
                                Math.round(data.main.temp);
    let imgID = data.weather[0].id;
    weatherImages.forEach(obj => {
        if(obj.ids.includes(imgID)) {
            picture.innerHTML = `
                <source srcset="${obj.url}.webp" type="image/webp">
                <source srcset="${obj.url}.png" type="image/png">
                <img src="${obj.url}.png" alt="${data.weather[0].description}" class="weather__image">
            `;
        }
    })
}

let updateForecast = (forecast) => {
    forecastBlock.innerHTML = '';
    forecast.forEach(day => {
        let iconUrl = 'https://openweathermap.org/img/wn/' + day.weather[0].icon + '@2x.png';
        let dayName = dayOfWeek(day.dt * 1000);
        let temperature = day.main.temp > 0 ? 
                    '+' + Math.round(day.main.temp) : 
                    Math.round(day.main.temp);
        let forecatItem = `
            <article class="weather__forecast__item">
                <img src="${iconUrl}" alt="${day.weather[0].description}" width="100" height="100" class="weather__forecast__icon">
                <h3 class="weather__forecast__day">${dayName}</h3>
                <p class="weather__forecast__temperature"><span class="value">${temperature}</span> &deg;C</p>
            </article>
        `;
        forecastBlock.insertAdjacentHTML('beforeend', forecatItem);
    })
}

let dayOfWeek = (dt = new Date().getTime()) => {
    return new Date(dt).toLocaleDateString('en-EN', {'weekday': 'long'});
}

let getLocation = (next) => {
    navigator.geolocation.getCurrentPosition((position) => {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        next(lat, lon);
    }, () => {
        next(0, 0);
    })
}

showLocalWeatherBtn.addEventListener('click', async () => {
    getLocation(async (lat, lon) => {
        if(lat !== 0 && lon !== 0) {
            weatherForCoordinates(lat, lon);
        } else {
            alert('Could not get your location');
        }
    })
});

const updateDatetimeStatus = () => {
    weatherStatus.textContent = new Date().toLocaleString();
}

updateDatetimeBtn.addEventListener('click', loadData);

let init = () => {
    loadData();
    document.body.style.filter = 'blur(0)';
}
init();