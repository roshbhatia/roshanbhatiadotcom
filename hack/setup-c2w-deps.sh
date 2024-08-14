#!/bin/bash

cp -R ./container2wasm/examples/wasi-browser/index.html ./src/index.html
cp -R ./container2wasm/examples/wasi-browser/stack-worker.js ./src/stack-worker.js
cp -R ./container2wasm/examples/wasi-browser/stack.js ./src/stack.js
cp -R ./container2wasm/examples/wasi-browser/wasi-util.js ./src/wasi-util.js
cp -R ./container2wasm/examples/wasi-browser/worker-util.js ./src/worker-util.js
cp -R ./container2wasm/examples/wasi-browser/worker.js ./src/worker.js
cp -R ./container2wasm/examples/wasi-browser/ws-delegate.js ./src/ws-delegate.js

docker buildx build -f ./container2wasm/Dockerfile --output type=local,dest=./src/ ./container2wasm
