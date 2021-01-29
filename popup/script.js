// Firefox minimum version: 52

// OpenWeather API credentials
const API_KEY = '326751156c800d44177a8ca66ba21f4d';

// Configuration variables
const SUN_MOTION_MINUTE_RANGE = 15;
const openWeatherDescriptionsToIconNames = {
  'few clouds': 'cloud.svg',
  'scattered clouds': 'cloud.svg',
  'broken clouds': 'cloud.svg',
  'shower rain': 'cloud-drizzle.svg',
  rain: 'cloud-rain.svg',
  thunderstorm: 'cloud-lightning.svg',
  snow: 'cloud-snow.svg',
  mist: 'cloud.svg',
  other: 'unknown.svg'
};

// Util functions
const formatTime = (date) => {
  return (
    date.getHours().tString().padStart(2, '0') +
    ':' +
    date.getMinutes().toString().padStart(2, '0')
  );
};

const isTimeInRange = (time, motion) => {
  return (
    time > motion - SUN_MOTION_MINUTE_RANGE * 60 * 1000 &&
    time < motion + SUN_MOTION_MINUTE_RANGE * 60 * 1000
  );
};

const jsonHttpRequest = async (url) => {
  let response;
  try {
    response = await fetch(url);
  } catch {
    return { err: true };
  }

  try {
    response = await response.json();
  } catch {
    return { err: true };
  }

  return { err: false, response };
};

// Setup screen
const iconContainer = document.getElementsByClassName('icon').item(0);

const icon = document.createElement('img');
icon.setAttribute('src', '../icons/weather/sun.svg');
iconContainer.appendChild(icon);

const temperatureContainer = document
  .getElementsByClassName('temperature')
  .item(0);

const temperature = document.createElement('h2');
temperatureContainer.appendChild(temperature);

navigator.geolocation.getCurrentPosition(
  (pos) => {
    const { latitude, longitude } = pos.coords;
    console.log('location:', latitude, longitude);
    // temperature.textContent = `Lat: ${latitude}, Long: ${longitude}`;
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
    )
      .then((res) => {
        res
          .json()
          .then((jsonRes) => {
            temperature.textContent = jsonRes.main.temp + 'º';
            const sunriseTime = jsonRes.sys.sunrise * 1000;
            const sunsetTime = jsonRes.sys.sunset * 1000;
            const now = new Date();
            const weather = jsonRes.weather[0];
            if (weather.description == 'clear sky') {
              const time = now.getTime();
              if (isTimeInRange(time, sunriseTime)) {
                icon.setAttribute('src', '../icons/weather/sunrise.svg');
              } else if (isTimeInRange(time, sunsetTime)) {
                icon.setAttribute('src', '../icons/weather/sunset.svg');
              } else {
                icon.setAttribute('src', '../icons/weather/sun.svg');
              }
            } else {
              let iconName =
                openWeatherDescriptionsToIconNames[weather.description];
              if (!iconName) {
                // temperature.textContent = JSON.stringify(weather);
                iconName = 'other';
              }
              // temperature.textContent = iconName;
              icon.setAttribute('src', `../icons/weather/${iconName}`);
            }
          })
          .catch((err) => {
            temperature.textContent = err;
          });
      })
      .catch((err) => {
        temperature.textContent = err;
      });
  },
  (err) => {
    console.error('Error: Could not get geolocation\nDetail:', err);
    // temperature.textContent = 'Error!';
  },
  {
    timeout: 30000
  }
);
