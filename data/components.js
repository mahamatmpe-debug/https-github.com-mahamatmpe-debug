const fs = require('fs');
const path = require('path');

const IMG_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
const VID_EXT = ['.mp4', '.webm', '.mov', '.m4v'];

function sniffType(full, ext) {
  if (IMG_EXT.includes(ext)) return 'image';
  if (VID_EXT.includes(ext)) return 'video';
  try {
    const fd = fs.openSync(full, 'r');
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    if (buf[0] === 0xff && buf[1] === 0xd8) return 'image';
    if (buf.slice(4, 8).toString('ascii') === 'ftyp') return 'video';
    if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'video';
  } catch (e) { /* ignore */ }
  return null;
}

function loadPrices() {
  const file = path.join(__dirname, 'prices.json');
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return data;
  } catch (e) {
    return { _default: 5000 };
  }
}

function loadComponents() {
  const dir = path.join(__dirname, '..', 'public', 'components');
  if (!fs.existsSync(dir)) return [];
  const prices = loadPrices();
  const def = typeof prices._default === 'number' ? prices._default : 5000;

  const items = [];
  fs.readdirSync(dir).forEach((f) => {
    const full = path.join(dir, f);
    if (!fs.statSync(full).isFile()) return;
    const ext = path.extname(f).toLowerCase();
    const type = sniffType(full, ext);
    if (!type) return;
    const name = ext ? f.replace(/\.[^.]+$/, '') : f;

    let price = def;
    if (typeof prices[f] === 'number') price = prices[f];
    else if (name.toLowerCase().includes('pub')) price = 2500;

    items.push({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      name: name,
      file: '/components/' + f,
      type: type,
      price: price,
      stock: 999,
      category: 'General'
    });
  });
  items.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return items;
}

module.exports = { loadComponents };
