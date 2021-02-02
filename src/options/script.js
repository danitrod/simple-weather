const form = document.getElementsByTagName('form')[0];

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const credentials = {};
  credentials.name = document.getElementById('name').value;
  credentials.apiKey = document.getElementById('api-key').value;

  browser.storage.local.set({ credentials });

  alert('Settings saved!');
});
