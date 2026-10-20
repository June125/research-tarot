#!/usr/bin/env node
/* 生成 GitHub Pages 发布目录 docs/
 *
 * 与根目录的「科研塔罗牌.html」不同，这一版 **不内嵌图片**：
 * 78 张牌图作为独立文件放在 docs/assets/cards/ 下，靠相对路径读取。
 * 好处：首屏快（不用先下载 6 MB）、图片可被浏览器/CDN 缓存、仓库里也能直接看图。
 *
 * 用法：node tools/build_ghpages.js   （tools/build.js 结尾会自动调用）
 * 产出：docs/index.html + docs/assets/cards/*.jpg
 * 发布：GitHub 仓库 Settings → Pages → Source 选「main 分支 / docs 文件夹」
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'preview', 'src.html');
const OUT_DIR = path.join(ROOT, 'docs');
const OUT_HTML = path.join(OUT_DIR, 'index.html');
const SRC_CARDS = path.join(ROOT, 'assets', 'cards');
const OUT_CARDS = path.join(OUT_DIR, 'assets', 'cards');

if (!fs.existsSync(SRC)) throw new Error('找不到 preview/src.html');

let html = fs.readFileSync(SRC, 'utf8');

/* 1. 图片路径：源文件 ../assets/cards/ → 站点版 ./assets/cards/ */
const MARK = "const IMG_BASE = '../assets/cards/';";
if (!html.includes(MARK)) {
  throw new Error("src.html 里找不到 IMG_BASE 定义，可能被改坏了");
}
html = html.replace(MARK, "const IMG_BASE = './assets/cards/';");

/* 2. 注入构建时间。
      不能省 —— todayRec() 靠 BUILD_AT 判断版本：页面更新后，用户昨天/今天抽到的旧记录
      会自动作废重抽。站点版 BUILD_AT 为空的话，朋友刷新了也可能还是同一张牌。
      注意：no-cache 这几个 meta 只作用于 HTML 自身，78 张图是独立请求，照样能被缓存。 */
const now = new Date();
const pad = n => String(n).padStart(2, '0');
const stamp = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate())
  + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
const MARK_BUILD = "const BUILD_AT = '';";
if (!html.includes(MARK_BUILD)) {
  throw new Error("src.html 里找不到 BUILD_AT 占位，可能被改坏了");
}
html = html.replace(MARK_BUILD, "const BUILD_AT = '" + stamp + "';");

/* 3. 顶部标注生成物 */
const banner = '<!-- 站点版（GitHub Pages 用）：由 tools/build_ghpages.js 从 preview/src.html 生成，勿手改 -->\n';
if (!html.startsWith('<!--')) html = banner + html;

fs.mkdirSync(OUT_CARDS, { recursive: true });
fs.writeFileSync(OUT_HTML, html);

/* 4. 复制 78 张牌图 */
let n = 0, bytes = 0;
for (const f of fs.readdirSync(SRC_CARDS)) {
  if (!f.endsWith('.jpg')) continue;
  const b = fs.readFileSync(path.join(SRC_CARDS, f));
  fs.writeFileSync(path.join(OUT_CARDS, f), b);
  n++; bytes += b.length;
}

/* 5. 校验：页面里引用的每一张图都必须真的存在 */
const cards = require(path.join(ROOT, 'miniprogram', 'utils', 'cards.js'));
const missing = cards.CARDS.filter(c => !fs.existsSync(path.join(OUT_CARDS, c.img))).map(c => c.img);

console.log('✓ docs/index.html  ' + (fs.statSync(OUT_HTML).size / 1024).toFixed(0) + ' KB');
console.log('✓ docs/assets/cards/  ' + n + ' 张  ' + (bytes / 1024 / 1024).toFixed(2) + ' MB');
if (missing.length) {
  console.log('✗ 缺图 ' + missing.length + ' 张：' + missing.slice(0, 5).join(', '));
  process.exit(1);
}
console.log('✓ 78 张牌图齐全');
console.log('');
console.log('发布步骤：把仓库推到 GitHub 后，进 Settings → Pages，');
console.log('Source 选「Deploy from a branch」，分支选 main，文件夹选 /docs，保存。');
console.log('网址形如：https://<你的用户名>.github.io/<仓库名>/');
