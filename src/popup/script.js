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
  'Overcast clouds': 'cloud.svg',
  'Shower rain': 'cloud-drizzle.svg',
  'Light rain': 'cloud-drizzle.svg',
  'Moderate rain': 'cloud-drizzle.svg',
  Rain: 'cloud-rain.svg',
  Thunderstorm: 'cloud-lightning.svg',
  Snow: 'cloud-snow.svg',
  Mist: 'cloud.svg'
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
  icon.setAttribute('src', `../../assets/icons/${ERROR_ICON}`);

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
    return {
      err: true,
      msg: 'Request failed. Check if your internet connection is stable.'
    };
  }

  try {
    response = await response.json();
  } catch {
    return { err: true, msg: 'Invalid request' };
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
        const timeOfDay =
          nowTime < sunriseTime
            ? 'evening'
            : now.getHours() < 12
            ? 'morning'
            : nowTime < sunsetTime
            ? 'afternoon'
            : 'evening';
        const greetingText = settings.name
          ? `Good ${timeOfDay}, ${settings.name}!`
          : `Good ${timeOfDay}!`;
        const greetingH1 = document.getElementById('greeting');
        greetingH1.textContent = greetingText;

        // Show the time
        document.getElementById('time').textContent = formatTime(now);

        // Show the location
        document.getElementById('location').textContent =
          response.data.name + ' - ' + response.data.sys.country;

        // Set the icon accordingly
        if (isTimeInRange(nowTime, sunriseTime)) {
          icon.setAttribute('src', '../../assets/icons/sunrise.svg');
        } else if (isTimeInRange(nowTime, sunsetTime)) {
          icon.setAttribute('src', '../../assets/icons/sunset.svg');
        } else if (description == 'Clear sky') {
          if (nowTime > sunsetTime || nowTime < sunriseTime) {
            icon.setAttribute('src', '../../assets/icons/moon.svg');
          } else {
            icon.setAttribute('src', '../../assets/icons/sun.svg');
          }
        } else {
          let iconName = openWeatherDescriptionsToIconNamesMap[description];
          if (!iconName) {
            iconName = ERROR_ICON;
          }
          icon.setAttribute('src', `../../assets/icons/${iconName}`);
        }
      }
    },
    (err) => {
      error(err);
    }
  );
};

const launchOptIn = () => {
  document.getElementById('button-continue').addEventListener('click', () => {
    document.getElementById('button-cancel').textContent = 'foi';
    browser.storage.local.set({ 'opt-in': true });
    window.location.reload();
  });
  document.getElementById('button-cancel').addEventListener('click', () => {
    window.close();
  });
};

// Check if used opted in before launching app
browser.storage.local.get('opt-in').then((result) => {
  if (!result || Object.keys(result).length < 1 || !result['opt-in']) {
    launchOptIn();
  } else {
    // Remove opt-in and show app
    document.getElementsByClassName('opt-in')[0].remove();
    document.getElementsByClassName('container')[0].style.visibility =
      'visible';

    // Get user settings
    browser.storage.local
      .get('credentials')
      .then((result) => {
        if (!result || Object.keys(result).length < 1) {
          error(
            'To get started, please create an API key on OpenWeatherMap and save it in the add-on settings.'
          );
        } else {
          fetchWeatherData(result.credentials);
        }
      })
      .catch((err) => {
        error('Error accessing add-on storage');
        console.error('Error accessing addon storage:', err);
      });
  }
});
