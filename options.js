const keys = ['api_user', 'api_secret'];
const $ = (id) => document.getElementById(id);
const flash = (text) => {
  $('msg').textContent = text;
  setTimeout(() => ($('msg').textContent = ''), 2000);
};

chrome.storage.local.get(keys).then((v) => keys.forEach((k) => ($(k).value = v[k] || '')));

$('save').onclick = async () => {
  await chrome.storage.local.set(Object.fromEntries(keys.map((k) => [k, $(k).value.trim()])));
  flash('已儲存');
};

$('clear').onclick = async () => {
  await chrome.storage.local.remove(keys);
  keys.forEach((k) => ($(k).value = ''));
  flash('已清除');
};

$('toggle').onclick = () => {
  const hidden = $('api_secret').type === 'password';
  $('api_secret').type = hidden ? 'text' : 'password';
  $('toggle').textContent = hidden ? '隱藏' : '顯示';
};
