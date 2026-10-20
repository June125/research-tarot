#!/usr/bin/env node
/**
 * 生成单机版预览 HTML：把 78 张牌图以 base64 内嵌进一个 HTML 文件。
 *
 * 为什么要这一步：preview/index.html 用相对路径 ../assets/cards/ 取图，
 * 直接双击打开（file://）没问题，但一旦放到只提供单个文件的静态服务里
 * （比如 IDE 预览面板），相对路径取不到，牌图全是裂图。
 * 内嵌之后，一个文件走天下：离线可用、发给别人也能看。
 *
 * 用法：node tools/build_standalone.js
 * 输出：科研塔罗牌.html（项目根目录）
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'preview', 'src.html');
const IMG_DIR = path.join(ROOT, 'assets', 'cards');
const OUT = path.join(ROOT, '科研塔罗牌.html');

const U = require(path.join(ROOT, 'miniprogram', 'utils', 'cards.js'));

let html = fs.readFileSync(SRC, 'utf8');

/* ---------- 1. 收集 78 张图，转 base64 ---------- */
const files = [...new Set(U.CARDS.map(c => c.img))].sort();
const map = {};
let total = 0;
for (const f of files) {
  const p = path.join(IMG_DIR, f);
  if (!fs.existsSync(p)) throw new Error('缺图：' + p);
  const buf = fs.readFileSync(p);
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('不是合法 JPEG：' + f);
  total += buf.length;
  map[f] = 'data:image/jpeg;base64,' + buf.toString('base64');
}
console.log('✓ 内嵌 ' + files.length + ' 张牌图，原始 ' + (total / 1024 / 1024).toFixed(2) + ' MB');

/* ---------- 2. 注入 ---------- */
const MARK = 'const IMG_DATA = {};';
if (!html.includes(MARK)) throw new Error('preview/src.html 里找不到 IMG_DATA 占位，可能被改坏了');
html = html.replace(MARK, 'const IMG_DATA = ' + JSON.stringify(map) + ';');

/* 打上构建时间，页面底部会显示，方便确认看到的是不是最新一份 */
const d = new Date(), pad = n => String(n).padStart(2, '0');
const stamp = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
  + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
if (html.includes("const BUILD_AT = '';")) {
  html = html.replace("const BUILD_AT = '';", "const BUILD_AT = '" + stamp + "';");
}

/* 单机版不需要再请求外部图，去掉 loading="lazy"（data URI 上无意义） */
html = html.replace(/ loading="lazy"/g, '');

/* 顶部加一行说明，方便日后认出这是生成物 */
const banner = '<!-- 单机版预览（构建于 ' + stamp + '）：由 tools/build_standalone.js 生成，牌图已内嵌。勿手改，改源文件 preview/src.html -->\n';
html = html.replace(/^<!DOCTYPE html>/i, '<!DOCTYPE html>\n' + banner);

fs.writeFileSync(OUT, html);
const size = fs.statSync(OUT).size;
console.log('✓ 已生成 ' + path.relative(ROOT, OUT) + '  ' + (size / 1024 / 1024).toFixed(2) + ' MB');
