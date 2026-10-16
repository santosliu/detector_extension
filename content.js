// 可能被重複注入，只註冊一次
if (!window.__aiDetect) {
  window.__aiDetect = true;
  const boxes = new Map();

  const COLORS = { ai: '#d32f2f', unsure: '#f9a825', real: '#2e7d32' };
  function verdict(score) {
    const pct = Math.round(score * 100);
    if (score >= 0.7) return [`可能是 AI ${pct}%`, COLORS.ai];
    if (score >= 0.3) return [`不確定 ${pct}%`, COLORS.unsure];
    return [`可能是真圖 ${pct}%`, COLORS.real];
  }

  function makeBox(src) {
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'closed' });
    root.innerHTML = `<style>
      .b{font:13px/1.4 system-ui,sans-serif;background:#fff;color:#222;border-radius:6px;
         box-shadow:0 2px 8px #0005;padding:6px 26px 6px 8px;position:relative;max-width:320px}
      .x{position:absolute;top:2px;right:6px;cursor:pointer;border:0;background:none;font-size:16px}
      .u{font-size:11px;color:#666;word-break:break-all}
    </style><div class="b"><button class="x">×</button><div class="c"></div></div>`;
    const content = root.querySelector('.c');
    root.querySelector('.x').onclick = () => { host.remove(); boxes.delete(src); };

    const img = [...document.images].find((i) => i.currentSrc === src || i.src === src);
    host.style.all = 'initial'; // 先重設，避免頁面 CSS 滲入；之後的屬性仍會生效
    Object.assign(host.style, { zIndex: 2147483647, transform: 'translateX(-100%)' });
    if (img) {
      const r = img.getBoundingClientRect();
      Object.assign(host.style, { position: 'absolute', top: `${r.top + scrollY + 4}px`, left: `${r.right + scrollX - 4}px` });
    } else {
      Object.assign(host.style, { position: 'fixed', top: '8px', left: 'calc(100% - 8px)' });
    }
    document.documentElement.appendChild(host);

    function line(text, color, cls) {
      const d = document.createElement('div');
      d.textContent = text;
      if (color) d.style.color = color;
      if (cls) d.className = cls;
      content.appendChild(d);
    }

    return {
      render(msg) {
        content.replaceChildren();
        if (!img) line(src, null, 'u');
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

  chrome.runtime.onMessage.addListener((msg) => {
    if (!boxes.has(msg.src)) boxes.set(msg.src, makeBox(msg.src));
    boxes.get(msg.src).render(msg);
  });
}
