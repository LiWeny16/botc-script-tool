import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

// Keep URLs and dimensions unchanged. Replace a PNG only when every decoded
// RGBA pixel matches and the result is actually smaller.
const webp = process.argv.includes('--webp');
const files = process.argv.slice(2).filter(value => value !== '--webp');
if (!files.length) throw new Error('Pass one or more PNG paths');
let before = 0, after = 0;
for (const file of files) {
  const input = await readFile(file);
  const output = webp
    ? await sharp(input).webp({ lossless: true, exact: true, effort: 5 }).toBuffer()
    : await sharp(input).png({ compressionLevel: 9, effort: 8, palette: false }).toBuffer();
  const originalPixels = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const outputPixels = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (originalPixels.info.width !== outputPixels.info.width || originalPixels.info.height !== outputPixels.info.height ||
      !originalPixels.data.equals(outputPixels.data)) throw new Error(`Pixel mismatch: ${file}`);
  before += input.length;
  if (output.length < input.length) {
    const target = webp ? file.replace(/\.png$/i, '.webp') : file;
    if (webp && target === file) throw new Error(`Expected a PNG: ${file}`);
    await writeFile(target, output);
    after += output.length;
    console.log(`${file}: ${input.length} -> ${output.length}`);
  } else {
    after += input.length;
    console.log(`${file}: already smaller`);
  }
}
console.log(`Total: ${before} -> ${after} bytes`);
