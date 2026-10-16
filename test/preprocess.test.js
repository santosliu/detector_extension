const assert = require('assert');
const { resizeDims, toCHW, SIZE } = require('../preprocess.js');

// 短邊縮到 440，長邊等比
assert.deepStrictEqual(resizeDims(880, 1000), [440, 500]);
assert.deepStrictEqual(resizeDims(300, 200), [660, 440]);
assert.strictEqual(SIZE, 384);

// 2x2 RGBA → CHW，ImageNet normalize
const rgba = new Uint8ClampedArray([
  255, 0, 0, 255,   0, 255, 0, 255,
  0, 0, 255, 255,   0, 0, 0, 255,
]);
const out = toCHW(rgba, 2);
assert.strictEqual(out.length, 12);
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-4, `${a} != ${b}`);
close(out[0], (1 - 0.485) / 0.229);  // R 平面第 1 像素
close(out[1], (0 - 0.485) / 0.229);  // R 平面第 2 像素
close(out[4 + 1], (1 - 0.456) / 0.224); // G 平面第 2 像素
close(out[8 + 2], (1 - 0.406) / 0.225); // B 平面第 3 像素
console.log('PASS');
