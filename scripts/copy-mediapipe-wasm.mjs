// Copies MediaPipe's WebAssembly files (the body-tracking engine) into public/,
// so the app serves them itself instead of loading them from someone else's
// server. Runs automatically after `npm install`.
//
// The package ships two versions of the engine; FilesetResolver only loads the
// non-"module" one, so we copy just that (it's 14 MB, so this halves the upload).
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';

const from = 'node_modules/@mediapipe/tasks-vision/wasm';
const to = 'public/mediapipe/wasm';

rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
for (const file of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm']) {
  copyFileSync(`${from}/${file}`, `${to}/${file}`);
}
console.log(`Copied MediaPipe wasm files to ${to}`);
