// Add options panel listener
document.getElementById('options').addEventListener('click', () => {
  browser.runtime.openOptionsPage();
});

// Configuration variables
const SUN_MOTION_MINUTE_RANGE = 15;
const ERROR_ICON = 'unknown.svg';
const openWeatherDescriptionsToIconNamesMap = {
  'Few clouds': 'cloud.svg',
  'Scattered clouds': 'cloud.svg',
  'Broken clouds': 'cloud.svg',
  'Shower rain': 'cloud-drizzle.svg',
  Rain: 'cloud-rain.svg',
  Thunderstorm: 'cloud-lightning.svg',
  Snow: 'cloud-snow.svg',
  Mist: 'cloud.svg',
  other: ERROR_ICON
};

// Util functions
const formatTime = (date) => {
  return (
    date.getHours().toString().padStart(2, '0') +
    ':' +
    date.getMinutes().toString().padStart(2, '0')
  );
};

const error = (details) => {
  const icon = document.getElementById('icon');
  icon.setAttribute('src', `../assets/icons/${ERROR_ICON}`);

  document.getElementById('location').textContent = details;
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

// Fetch weather data
const fetchWeatherData = (settings) => {
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;

      const response = await jsonHttpRequest(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${settings.apiKey}&units=metric`
      );

      const temperature = document.getElementById('temperature');
      if (response.err) {
        error(response.msg);
        temperature.textContent = 'Error: Could not fetch weather data';
      } else {
        // Set the temperature text
        let description = response.data.weather[0].description;
        description =
          description.charAt(0).toUpperCase() + description.slice(1); // Upper case first letter
        temperature.textContent =
          description + ', ' + response.data.main.temp.toFixed() + 'ºC';

        // Get sunrise, sunset and current time
        const sunriseTime = response.data.sys.sunrise * 1000;
        const sunsetTime = response.data.sys.sunset * 1000;
        const now = new Date();
        const nowTime = now.getTime();

        // Generate greeting based on the sun position
        const greetingText =
          nowTime < sunriseTime
            ? `Good evening, ${settings.name}!`
            : now.getHours() < 12
            ? `Good morning, ${settings.name}!`
            : nowTime < sunsetTime
            ? `Good afternoon, ${settings.name}!`
            : `Good evening, ${settings.name}!`;
        const greetingH1 = document.getElementById('greeting');
        greetingH1.textContent = greetingText;

        // Show the time
        document.getElementById('time').textContent = formatTime(now);

        // Show the location
        document.getElementById('location').textContent =
          response.data.name + ' - ' + response.data.sys.country;

        // Set the icon accordingly
        if (description == 'Clear sky') {
          if (isTimeInRange(nowTime, sunriseTime)) {
            icon.setAttribute('src', '../assets/icons/sunrise.svg');
          } else if (isTimeInRange(nowTime, sunsetTime)) {
            icon.setAttribute('src', '../assets/icons/sunset.svg');
          } else if (nowTime > sunsetTime || nowTime < sunriseTime) {
            icon.setAttribute('src', '../assets/icons/moon.svg');
          } else {
            icon.setAttribute('src', '../assets/icons/sun.svg');
          }
        } else {
          let iconName = openWeatherDescriptionsToIconNamesMap[description];
          if (!iconName) {
            iconName = 'other';
          }
          icon.setAttribute('src', `../assets/icons/${iconName}`);
        }
      }
    },
    (err) => {
      error(err);
    }
  );
};

// Settings
browser.storage.local
  .get('credentials')
  .then((result) => {
    if (!result || Object.keys(result) < 1) {
      error(
        'Greetings! To start using Simple Weather, please create an API key on OpenWeatherMap and save it in the options page.'
      );
    } else {
      fetchWeatherData(result.credentials);
    }
  })
  .catch((err) => {
    console.error('Error accessing addon storage:', err);
    document.getElementById('greeting').textContent = 'ERR:' + err;
  });
