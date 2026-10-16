const keys = ['api_user', 'api_secret'];
chrome.storage.local.get(keys).then((v) => keys.forEach((k) => (document.getElementById(k).value = v[k] || '')));
document.getElementById('save').onclick = async () => {
  await chrome.storage.local.set(Object.fromEntries(keys.map((k) => [k, document.getElementById(k).value.trim()])));
  document.getElementById('msg').textContent = '已儲存';
};
