// Run in a Node container with @resvg/resvg-js installed in /tmp/logo-render.
// Keeps all PNG and ICO identities derived from the editable brand-mark.svg.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire('/tmp/logo-render/package.json');
const { Resvg } = require('@resvg/resvg-js');
const directory = '/app/apps/web/public';
const svg = readFileSync(`${directory}/brand-mark.svg`);
function png(size) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
}
for (const [name, size] of [['logo192.png', 192], ['logo512.png', 512], ['apple-touch-icon.png', 180]]) {
  writeFileSync(`${directory}/${name}`, png(size));
}
const sizes = [16, 32, 64];
const images = sizes.map(png);
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, index) => {
  const entry = 6 + index * 16;
  header[entry] = size;
  header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[index].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[index].length;
});
writeFileSync(`${directory}/favicon.ico`, Buffer.concat([header, ...images]));
