ort.env.wasm.wasmPaths = chrome.runtime.getURL('lib/ort/');
ort.env.wasm.numThreads = 1; // extension 頁面沒有 cross-origin isolation，無法多執行緒

let sessionPromise;
const getSession = () =>
  (sessionPromise ??= ort.InferenceSession.create(chrome.runtime.getURL('models/detectra.onnx'))
    .catch((e) => { sessionPromise = null; throw e; })); // 失敗不快取，下次可重試

async function localScore(blob) {
  const data = preprocess(await createImageBitmap(blob, { colorSpaceConversion: 'none' }));
  const session = await getSession();
  const out = await session.run({ pixel_values: new ort.Tensor('float32', data, [1, 3, SIZE, SIZE]) });
  // 校準後 P(AI) = sigmoid(a·logit + b)，係數取自 Detectra extension/static/models.json
  return 1 / (1 + Math.exp(-(1.121656 * out.logit.data[0] + 0.506874)));
}

async function sightengine(blob, user, secret) {
  const fd = new FormData();
  fd.append('media', blob, `image.${blob.type.split('/')[1] || 'jpg'}`);
  fd.append('models', 'genai');
  fd.append('api_user', user);
  fd.append('api_secret', secret);
  const r = await fetch('https://api.sightengine.com/1.0/check.json', { method: 'POST', body: fd });
  const j = await r.json().catch(() => { throw new Error(`HTTP ${r.status}`); });
  if (j.status !== 'success') throw new Error(j.error?.message || `HTTP ${r.status}`);
  return j.type.ai_generated;
}

const settle = (p) =>
  p.status === 'fulfilled' ? { score: p.value } : { error: String(p.reason?.message || p.reason) };

async function detect({ src, api_user, api_secret }) {
  let blob;
  try {
    const r = await fetch(src);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    blob = await r.blob();
  } catch (e) {
    return { error: `圖片讀取失敗：${e.message}` };
  }
  const [local, remote] = await Promise.allSettled([
    localScore(blob),
    api_user && api_secret ? sightengine(blob, api_user, api_secret) : Promise.resolve(null),
  ]);
  return { local: settle(local), remote: settle(remote) };
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.target !== 'offscreen') return;
  detect(msg).then(reply);
  return true; // 非同步回應
});
