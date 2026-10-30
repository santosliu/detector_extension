// 可能被重複注入，只註冊一次
if (!window.__aiDetect) {
  window.__aiDetect = true;
  const boxes = new Map();

  // 記錄游標下的圖片（覆蓋層網站右鍵點到的是 div）
  let lastImg = null;
  addEventListener('contextmenu', (e) => {
    lastImg = document.elementsFromPoint(e.clientX, e.clientY).find((el) => el.tagName === 'IMG') || null;
  }, true);

  const COLORS = { ai: '#d32f2f', unsure: '#f9a825', real: '#2e7d32' };
  function verdict(score) {
    const pct = Math.round(score * 100);
    if (score >= 0.7) return [`可能是 AI（AI 機率 ${pct}%）`, COLORS.ai];
    if (score >= 0.3) return [`不確定（AI 機率 ${pct}%）`, COLORS.unsure];
    return [`可能是真圖（AI 機率 ${pct}%）`, COLORS.real];
  }

  // 用原生 <dialog> 置中彈出：showModal() 進 top layer，自帶背景遮罩與 Esc 關閉
  function makeBox(src) {
    const host = document.createElement('div');
    host.style.all = 'initial'; // 避免頁面 CSS 滲入
    const root = host.attachShadow({ mode: 'closed' });
    root.innerHTML = `<style>
      dialog{font:16px/1.5 system-ui,sans-serif;background:#fff;color:#222;border:0;border-radius:10px;
         box-shadow:0 8px 32px #0008;padding:20px 24px;min-width:280px;max-width:min(420px,90vw);text-align:center}
      dialog::backdrop{background:#0006}
      .x{position:absolute;top:6px;right:10px;cursor:pointer;border:0;background:none;font-size:22px;color:#666}
      img{max-width:100%;max-height:200px;border-radius:6px;margin-bottom:12px}
      .c div{font-weight:600;margin:4px 0}
    </style><dialog><button class="x" aria-label="關閉">×</button><img alt=""><div class="c"></div></dialog>`;
    const dialog = root.querySelector('dialog');
    const content = root.querySelector('.c');
    if (src) root.querySelector('img').src = src;
    else root.querySelector('img').remove();
    dialog.onclose = () => { host.remove(); boxes.delete(src); };
    root.querySelector('.x').onclick = () => dialog.close();
    dialog.onclick = (e) => { // 點遮罩關閉（padding 的 target 也是 dialog，需比座標）
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    };
    document.documentElement.appendChild(host);
    dialog.showModal();

    function line(text, color) {
      const d = document.createElement('div');
      d.textContent = text;
      if (color) d.style.color = color;
      content.appendChild(d);
    }

    return {
      render(msg) {
        content.replaceChildren();
        if (msg.type === 'pending') return line('偵測中…');
        if (msg.error) return line(msg.error, COLORS.ai);
        const show = (name, r) => {
          if (r.error) line(`${name}：${r.error}`, COLORS.ai);
          else if (r.score != null) line(`${name}：${verdict(r.score)[0]}`, verdict(r.score)[1]);
        };
        show('本機', msg.local);
        show('Sightengine', msg.remote);
      },
    };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'lastImage') {
      sendResponse(lastImg ? lastImg.currentSrc || lastImg.src : null);
      return;
    }
    if (!boxes.has(msg.src)) boxes.set(msg.src, makeBox(msg.src));
    boxes.get(msg.src).render(msg);
  });
}
