# AI 圖片偵測

Chrome 擴充功能：在網頁圖片上按右鍵 →「偵測 AI 圖片」，用本機模型估計該圖為 AI 生成的機率。可選填 Sightengine API 金鑰取得第二意見。

- 本機推論：[Detectra](https://huggingface.co/Vontra/detectra-v1)（ViT-S/16，輸入 384×384，MIT）＋ [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) WASM。
- 雲端（選用）：[Sightengine](https://sightengine.com) `genai` 模型。
- 支援在圖片上覆蓋透明圖層的網站（如 Instagram）。

結果僅供參考：圖片經壓縮、縮放，或來自模型未見過的新生成器時，準確率會下降。

## 開發

```sh
sh setup.sh                    # 下載 ONNX Runtime 與模型（不進 git）
node test/preprocess.test.js   # 前處理測試
```

Chrome → `chrome://extensions` → 開發人員模式 → 載入未封裝項目 → 選本資料夾。

## 打包

```sh
python scripts/pack.py         # 輸出 dist/ai-image-detector-<version>.zip
```

## 隱私

見 [PRIVACY.md](PRIVACY.md)。

## 授權

MIT。第三方元件見 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
