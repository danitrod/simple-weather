// Firefox minimum version: 52

// OpenWeather API credentials
const API_KEY = '326751156c800d44177a8ca66ba21f4d';

// Configuration variables
const SUN_MOTION_MINUTE_RANGE = 15;
const ERROR_ICON = 'unknown.svg';
const openWeatherDescriptionsToIconNamesMap = {
  'few clouds': 'cloud.svg',
  'scattered clouds': 'cloud.svg',
  'broken clouds': 'cloud.svg',
  'shower rain': 'cloud-drizzle.svg',
  rain: 'cloud-rain.svg',
  thunderstorm: 'cloud-lightning.svg',
  snow: 'cloud-snow.svg',
  mist: 'cloud.svg',
  other: ERROR_ICON
};

// Util functions
const formatTime = (date) => {
  return (
    date.getHours().tString().padStart(2, '0') +
    ':' +
    date.getMinutes().toString().padStart(2, '0')
  );
};

const error = (iconAttribute, details) => {
  iconAttribute.setAttribute('src', `../assets/icons/${ERROR_ICON}`);
  const detail = details ? '\nDetail: ' + details : '';
  console.error('Error: Could not get geolocation' + detail);
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

  return { err: false, data: response };
};

// Setup popup page
const iconContainer = document.getElementsByClassName('icon').item(0);

const icon = document.createElement('img');
icon.setAttribute('src', '../assets/spinner.svg');
iconContainer.appendChild(icon);

const temperatureContainer = document
  .getElementsByClassName('temperature')
  .item(0);

const temperature = document.createElement('h2');
temperatureContainer.appendChild(temperature);

const greetingH1 = document.getElementById('greeting');

// Fetch weather data
navigator.geolocation.getCurrentPosition(
  async (pos) => {
    const { latitude, longitude } = pos.coords;

    const response = await jsonHttpRequest(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
    );

    if (response.err) {
      error(icon, response.msg);
      temperature.textContent = 'Error: Could not fetch weather data';
    } else {
      // Set the temperature text
      temperature.textContent = response.data.main.temp.toFixed() + 'º';

      // Get sunrise, sunset and current time
      const sunriseTime = response.data.sys.sunrise * 1000;
      const sunsetTime = response.data.sys.sunset * 1000;
      const now = new Date();
      const nowTime = now.getTime();

      // Generate greeting based on the sun
      const greetingText =
        nowTime < sunriseTime
          ? 'Good evening!'
          : now.getHours() < 12
          ? 'Good morning!'
          : nowTime < sunsetTime
          ? 'Good afternoon!'
          : 'Good evening!';
      greetingH1.textContent = greetingText;

      // Set the icon accordingly
      const weather = response.data.weather[0];
      if (weather.description == 'clear sky') {
        if (isTimeInRange(nowTime, sunriseTime)) {
          icon.setAttribute('src', '../assets/icons/sunrise.svg');
        } else if (isTimeInRange(nowTime, sunsetTime)) {
          icon.setAttribute('src', '../assets/icons/sunset.svg');
        } else {
          icon.setAttribute('src', '../assets/icons/sun.svg');
        }
      } else {
        let iconName =
          openWeatherDescriptionsToIconNamesMap[weather.description];
        if (!iconName) {
          // temperature.textContent = JSON.stringify(weather);
          iconName = 'other';
        }
        // temperature.textContent = iconName;
        icon.setAttribute('src', `../assets/icons/${iconName}`);
      }
    }
  },
  (err) => {
    error(icon, err);
    // temperature.textContent = 'Error!';
  }
);
