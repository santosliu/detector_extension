chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'detect', title: '偵測 AI 圖片', contexts: ['image'] });
});

async function ensureOffscreen() {
  const existing = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (existing.length) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['WORKERS'],
    justification: '執行 ONNX 模型推論',
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const frameId = info.frameId ?? 0;
  await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [frameId] }, files: ['content.js'] });
  const show = (msg) => chrome.tabs.sendMessage(tab.id, { src: info.srcUrl, ...msg }, { frameId });

  show({ type: 'pending' });
  try {
    await ensureOffscreen();
    const { api_user, api_secret } = await chrome.storage.local.get(['api_user', 'api_secret']);
    const result = await chrome.runtime.sendMessage({ target: 'offscreen', src: info.srcUrl, api_user, api_secret });
    show({ type: 'result', ...result });
  } catch (e) {
    show({ type: 'result', error: String(e.message || e) });
  }
});
