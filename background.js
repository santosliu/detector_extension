chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'detect', title: '偵測 AI 圖片', contexts: ['image'] });
});

let creating; // 去重並行的建立請求
async function ensureOffscreen() {
  const existing = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (existing.length) return;
  creating ??= chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['WORKERS'],
    justification: '執行 ONNX 模型推論',
  }).finally(() => { creating = null; });
  await creating;
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const frameId = info.frameId ?? 0;
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [frameId] }, files: ['content.js'] });
  } catch (e) {
    // chrome://、Web Store、PDF 檢視器等無法注入，也就無法顯示浮層
    console.warn('無法注入 content script：', e.message || e);
    return;
  }
  const show = (msg) => chrome.tabs.sendMessage(tab.id, { src: info.srcUrl, ...msg }, { frameId }).catch(() => {});

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
