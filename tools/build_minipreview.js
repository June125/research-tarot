/**
 * 生成「小程序界面预览」单文件 HTML
 * 数据源：miniprogram/utils/cards.js（与小程序打包内容完全一致）
 * 图片：miniprogram/assets/cards/*.jpg → base64 内嵌
 * 产物：科研灵感卡-小程序预览.html（根目录，可直接发朋友）+ docs/mini-preview.html（上线）
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const U = require(path.join(ROOT, 'miniprogram/utils/cards.js'));

const d = new Date();
const pad = n => String(n).padStart(2, '0');
const BUILD_AT = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
  ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());

/* 1. 内嵌图片 */
const IMG_DIR = path.join(ROOT, 'miniprogram/assets/cards');
const IMG_DATA = {};
let n0 = 0, bytes = 0;
fs.readdirSync(IMG_DIR).forEach(f => {
  if (!/\.jpg$/.test(f)) return;
  const b = fs.readFileSync(path.join(IMG_DIR, f));
  IMG_DATA[f] = 'data:image/jpeg;base64,' + b.toString('base64');
  n0++; bytes += b.length;
});

/* 2. 反推 8 条组合提示（summaryMini 是小程序端用的同一套） */
const SPREAD_TIP = {};
['UUU','RUU','UUR','URU','RUR','RRU','URR','RRR'].forEach(k => {
  const cs = k.split('').map(ch => ({ id: 0, name: 'x', reversed: ch === 'R' }));
  SPREAD_TIP[k] = (U.summaryMini(cs) || {}).text || '';
});

/* 3. 注入模板 */
let html = fs.readFileSync(path.join(__dirname, 'mini_preview_tpl.html'), 'utf8');
const J = o => JSON.stringify(o);
html = html
  .replace('__IMG_DATA__', J(IMG_DATA))
  .replace('__CARDS__', J(U.CARDS))
  .replace('__SUIT_ORDER__', J(U.SUIT_ORDER))
  .replace('__SLOT_MINI__', J(U.SLOT_MINI))
  .replace('__SPREAD_TIP__', J(SPREAD_TIP))
  .replace('__BUILD_AT__', BUILD_AT);

const OUT1 = path.join(ROOT, '科研灵感卡-小程序预览.html');
const OUT2 = path.join(ROOT, 'docs/mini-preview.html');
fs.writeFileSync(OUT1, html);
fs.writeFileSync(OUT2, html);

const MB = x => (x / 1024 / 1024).toFixed(2) + ' MB';
console.log('✓ 内嵌牌图 ' + n0 + ' 张（' + MB(bytes) + '）');
console.log('✓ 卡片 ' + U.CARDS.length + ' 张 | SLOT_MINI ' + JSON.stringify(U.SLOT_MINI));
console.log('✓ ' + OUT1 + '  ' + MB(fs.statSync(OUT1).size));
console.log('✓ ' + OUT2 + '  ' + MB(fs.statSync(OUT2).size));
console.log('  BUILD_AT = ' + BUILD_AT);
