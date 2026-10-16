#!/bin/sh
# 下載 ONNX Runtime Web 與 Detectra 模型（不進 git）
set -e
cd "$(dirname "$0")"
mkdir -p lib/ort models
ORT=https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist
for f in ort.wasm.min.js ort-wasm-simd-threaded.wasm ort-wasm-simd-threaded.mjs; do
  curl -fL "$ORT/$f" -o "lib/ort/$f"
done
curl -fL https://huggingface.co/Vontra/detectra-v1/resolve/main/model.onnx -o models/detectra.onnx
ls -l lib/ort models
