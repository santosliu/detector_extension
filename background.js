chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'detect', title: '偵測 AI 圖片', contexts: ['all'] });
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
  const send = (msg) => chrome.tabs.sendMessage(tab.id, msg, { frameId });
  // 有覆蓋層的網站（如 IG）右鍵點不到 <img>，改問 content script 游標下的圖片
  const src = info.srcUrl || (await send({ type: 'lastImage' }).catch(() => {
    console.warn('無法連線 content script，請重新整理頁面');
    return null;
  }));
  const show = (msg) => send({ src, ...msg }).catch(() => {});
  if (!src) return show({ type: 'result', error: '游標下找不到圖片' });

  show({ type: 'pending' });
  try {
    await ensureOffscreen();
    const { api_user, api_secret } = await chrome.storage.local.get(['api_user', 'api_secret']);
    const result = await chrome.runtime.sendMessage({ target: 'offscreen', src, api_user, api_secret });
    show({ type: 'result', ...result });
  } catch (e) {
    show({ type: 'result', error: String(e.message || e) });
  }
});
