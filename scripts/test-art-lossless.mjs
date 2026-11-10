import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const assets = [
  'public/imgs/images/sources/special-rule-header-v3',
  'public/imgs/images/sources/night-legend-cloud-v1',
  'public/imgs/images/sources/pattern',
  'public/imgs/images/sources/back_4',
  'public/imgs/images/background/back_tower',
  'public/imgs/images/background/back_tower2',
  'public/imgs/images/background/back_town',
];
let originalBytes = 0, compressedBytes = 0;
for (const asset of assets) {
  const png = await readFile(`${asset}.png`), webp = await readFile(`${asset}.webp`);
  const original = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const result = await sharp(webp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual([result.info.width, result.info.height], [original.info.width, original.info.height], `${asset}: dimensions`);
  assert.ok(result.data.equals(original.data), `${asset}: decoded RGBA pixels`);
  assert.ok(webp.length < png.length, `${asset}: WebP size`);
  originalBytes += png.length; compressedBytes += webp.length;
}
console.log(`Lossless artwork: ${originalBytes} -> ${compressedBytes} bytes (${Math.round((1 - compressedBytes / originalBytes) * 100)}% smaller).`);
