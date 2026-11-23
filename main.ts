// Entry for the make.fun news-image-20261123 bounty.
// Copies the finished front page (entry.png, next to this file) to the
// output directory as entry.png. Node 22, standard library only, no network.
import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
const srcPath = join(here, 'entry.png');
const outPath = join(outDir, 'entry.png');
copyFileSync(srcPath, outPath);

// Verify what was written before reporting success: the file must exist,
// be a whole image (PNG signature + IEND trailer, or JPEG SOI + EOI marker),
// match the source byte for byte, and stay within the 1 MiB gate cap.
const MAX_BYTES = 1048576;
function fail(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}
let outStat;
try {
  outStat = statSync(outPath);
} catch {
  fail(`output file missing: ${outPath}`);
}
if (outStat.size > MAX_BYTES) fail(`output is ${outStat.size} bytes, over the ${MAX_BYTES} byte cap`);
const srcBytes = readFileSync(srcPath);
const outBytes = readFileSync(outPath);
if (outBytes.length !== srcBytes.length || !outBytes.equals(srcBytes)) {
  fail('output does not match the source image byte for byte');
}
const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const pngEnd = Buffer.from('IEND');
const isPng = outBytes.subarray(0, 8).equals(pngSig) && outBytes.subarray(outBytes.length - 8, outBytes.length - 4).equals(pngEnd);
const isJpeg = outBytes[0] === 0xff && outBytes[1] === 0xd8 && outBytes[outBytes.length - 2] === 0xff && outBytes[outBytes.length - 1] === 0xd9;
if (!isPng && !isJpeg) fail('output is neither a whole PNG nor a whole JPEG');
console.log(`wrote ${outPath} (${outStat.size} bytes, ${isPng ? 'PNG' : 'JPEG'})`);
