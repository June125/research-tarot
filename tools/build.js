/**
 * 文案构建：文案/牌义文案.md  →  miniprogram/utils/cards.js  +  preview/src.html
 *
 * 用法：node tools/build.js
 *
 * 改了牌义文案之后跑这一条，两处一起更新，不会出现数据不一致。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MD = path.join(ROOT, '文案/牌义文案.md');
const OUT_JS = path.join(ROOT, 'miniprogram/utils/cards.js');
const OUT_HTML = path.join(ROOT, 'preview/src.html');

const FIELD_MAP = {
  '场景': 'scene',
  '关键词': 'kw',
  '正位': 'upright',
  '逆位': 'reversed',
  '科研': 'research',
  '建议': 'advice',
  '金句': 'quote'          // 牌面下方那句点题的话，独立字段，会被拼进 advice 之前单独解析
};

const SUIT_META = {
  wands: { cn: '权杖', en: 'Wands', emoji: '🪄', element: '火 · 行动与事业' },
  cups: { cn: '圣杯', en: 'Cups', emoji: '🏆', element: '水 · 直觉与认同' },
  swords: { cn: '宝剑', en: 'Swords', emoji: '⚔️', element: '风 · 思维与冲突' },
  pent: { cn: '星币', en: 'Pentacles', emoji: '🪙', element: '土 · 资源与成果' }
};

const NUM_VAL = { '首牌': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '侍从': 11, '骑士': 12, '皇后': 13, '国王': 14 };
const ROMAN_VAL = { '0': 0, 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15, 'XVI': 16, 'XVII': 17, 'XVIII': 18, 'XIX': 19, 'XX': 20, 'XXI': 21 };

/* ---------- 解析 ---------- */
const src = fs.readFileSync(MD, 'utf8');
const cards = [];
let cur = null;
let lastField = null;

src.split(/\r?\n/).forEach(function (raw) {
  const line = raw.replace(/\s+$/, '');
  if (!line.trim()) { lastField = null; return; }
  if (/^#{1}\s/.test(line) || /^>\s?/.test(line) || /^---+$/.test(line)) return;

  const h = line.match(/^##\s+(.+)$/);
  if (h) {
    const parts = h[1].split('|').map(function (s) { return s.trim(); });
    if (parts.length < 5) {
      throw new Error('标题格式不对（需要 分组 | 序号 | 牌名 | 英文名 | 图标）：\n  ' + line);
    }
    cur = { group: parts[0], roman: parts[1], name: parts[2], en: parts[3], emoji: parts[4], scene: '', kw: '', upright: '', reversed: '', research: '', advice: '', quote: '' };
    cards.push(cur);
    lastField = null;
    return;
  }

  const f = line.match(/^-\s*([^：]+)：\s*([\s\S]*)$/);
  if (f && FIELD_MAP[f[1].trim()]) {
    const key = FIELD_MAP[f[1].trim()];
    if (cur) { cur[key] = f[2]; lastField = key; }
    return;
  }
  // 续行：接上一段
  if (cur && lastField) {
    cur[lastField] += (cur[lastField] ? ' ' : '') + line.trim();
  }
});

/* ---------- 补全字段 ---------- */
const used = new Set();
cards.forEach(function (c, i) {
  const g = c.group;
  if (g === 'major') {
    c.arcana = 'major';
    c.suit = null;
    c.suitName = '大阿尔卡纳';
    c.element = '人生主课题';
    c.num = ROMAN_VAL[c.roman] !== undefined ? ROMAN_VAL[c.roman] : i;
    c.img = 'major-' + String(c.num).padStart(2, '0') + '.jpg';
  } else {
    const meta = SUIT_META[g];
    if (!meta) throw new Error('未知分组「' + g + '」，只能是 major / wands / cups / swords / pent');
    c.arcana = 'minor';
    c.suit = g;
    c.suitName = meta.cn;
    c.element = meta.element;
    c.num = NUM_VAL[c.roman];
    if (!c.num) throw new Error('未知序号「' + c.roman + '」（第 ' + (cards.indexOf(c) + 1) + ' 张 ' + c.name + '）');
    // 星币组的文件名是 pents-（与分组名 pent 不同，历史遗留，勿改 assets 里的文件名）
    const prefix = (g === 'pent') ? 'pents' : g;
    c.img = prefix + '-' + String(c.num).padStart(2, '0') + '.jpg';
  }
  if (used.has(c.img)) throw new Error('重复的图 ' + c.img + '（' + c.name + '）');
  used.add(c.img);
});

/* ---------- 校验 ---------- */
const errs = [];
if (cards.length !== 78) errs.push('牌数应为 78，实际 ' + cards.length);
const byGroup = {};
cards.forEach(function (c) {
  byGroup[c.group] = (byGroup[c.group] || 0) + 1;
  ['kw', 'upright', 'reversed', 'research', 'advice'].forEach(function (k) {
    if (!c[k]) errs.push(c.name + ' 缺「' + k + '」');
  });
});
[['major', 22], ['wands', 14], ['cups', 14], ['swords', 14], ['pent', 14]].forEach(function (p) {
  const n = byGroup[p[0]] || 0;
  if (n !== p[1]) errs.push(p[0] + ' 应为 ' + p[1] + ' 张，实际 ' + n);
});

if (errs.length) {
  console.error('构建失败，请先修文案：');
  errs.slice(0, 40).forEach(function (e) { console.error('  ✗ ' + e); });
  if (errs.length > 40) console.error('  … 共 ' + errs.length + ' 处问题');
  process.exit(1);
}

/* ---------- 写 cards.js ---------- */
/**
 * 输出字段顺序。
 * 注意：逆位「文案」输出为 revText，reversed 这个 key 留给运行时表示正/逆位方向（布尔），
 * 否则 Object.assign 抽牌时会把文案覆盖成 true。
 */
const order = ['id', 'arcana', 'suit', 'suitName', 'element', 'name', 'scene', 'en', 'roman', 'num', 'emoji', 'img', 'kw', 'upright', 'revText', 'research', 'advice', 'quote'];

function jstr(s) {
  return JSON.stringify(String(s));
}

const rows = cards.map(function (c, i) {
  const o = Object.assign({ id: i }, c);
  delete o.group;
  o.revText = o.reversed;
  delete o.reversed;
  const body = order.map(function (k) {
    const v = o[k];
    return '    ' + k + ': ' + (k === 'id' || k === 'num' ? v : (v === null ? 'null' : jstr(v)));
  }).join(',\n');
  return '  {\n' + body + '\n  }';
});

const js = `/**
 * 今日科研卡 · 牌库数据（78 张，经典卡牌体系）
 *
 * ⚠️ 本文件由 tools/build.js 自动生成，请勿直接编辑。
 *    编辑源：文案/牌义文案.md  ——  改完执行：node tools/build.js
 *
 * 字段说明：
 *   upright / revText   市面通行牌义（正位 / 逆位文案），已剥离感情线，只保留事业、学业、资源、协作
 *   reversed            运行时字段，表示本次抽到的是否逆位（布尔），由抽牌函数注入
 *   research            映射到科研场景的提示
 *   advice              当天可执行的建议
 *   img                 牌图文件名，位于 assets/cards/（RWS 1909，公有领域）
 */
var CARDS = [
${rows.join(',\n')}
];

var SUIT_ORDER = [
  { key: 'major', label: '大阿尔卡纳', en: 'Major Arcana' },
  { key: 'wands', label: '权杖', en: 'Wands · 火' },
  { key: 'cups', label: '圣杯', en: 'Cups · 水' },
  { key: 'swords', label: '宝剑', en: 'Swords · 风' },
  { key: 'pent', label: '星币', en: 'Pentacles · 土' }
];

function cardsOf(key) {
  return CARDS.filter(function (c) {
    return key === 'major' ? c.arcana === 'major' : c.suit === key;
  });
}

/* 今日一抽：只从 22 张大阿尔卡纳中抽 */
function drawMajor() {
  var pool = CARDS.filter(function (c) { return c.arcana === 'major'; });
  var c = pool[Math.floor(Math.random() * pool.length)];
  return Object.assign({}, c, { reversed: Math.random() < 0.32 });
}

/* 兼容旧调用：等同于 drawMajor */
function drawOne() { return drawMajor(); }

/* 抽 n 张不重复（全 78 张牌池） */
function drawMany(n) {
  var pool = CARDS.slice(), out = [];
  for (var i = 0; i < n && pool.length; i++) {
    var k = Math.floor(Math.random() * pool.length);
    out.push(Object.assign({}, pool.splice(k, 1)[0], { reversed: Math.random() < 0.32 }));
  }
  return out;
}

/* ---------- 三卡组合的综合提示 ----------
   小程序端只输出不带结论标签的行动提示，不给出评级。
   （网页版 preview/src.html 另有一套带评级档位的 summaryOf，网页不受此限） */
var SLOT_MINI = ['现状', '卡点', '下一步'];
var SPREAD_TIP = {
  UUU: '三张都是正向卡，这几件事现在都推得动。挑最要紧的一件先做完，别摊太薄。',
  RUU: '第一张是提醒位，后两张是正向。先把那件一直拖着的收个尾，后面会顺很多。',
  UUR: '前两张正向、最后一张是提醒。收尾环节留一手预案，别在最后一步赶工。',
  URU: '中间那张是提醒位，前后都正向。集中处理这一件事就够了，不用全线调整。',
  RUR: '两张提醒夹着一张正向。力气集中在中间那件能动的，别同时开新战线。',
  RRU: '前两张是提醒、最后一张正向。先把眼前这两条写成行动项，收尾会比现在顺。',
  URR: '第一张正向，后两张是提醒。先复盘中间那个转折点，把范围收窄一点，别硬推。',
  RRR: '三张都是提醒位，问题一次摊开反而好办。今天适合复盘和休整，各写一条行动项，明天再动。'
};
function summaryMini(cards) {
  if (!cards || !cards.length) return { text: '' };
  if (cards.length !== 3) {
    return { text: '把每张卡的提醒各写成一条行动项，挑最要紧的先做。' };
  }
  var key = cards.map(function (c) { return c.reversed ? 'R' : 'U'; }).join('');
  return { text: SPREAD_TIP[key] || '把这三张的提醒各写成一条行动项，挑最要紧的先做。' };
}

module.exports = {
  CARDS: CARDS, SUIT_ORDER: SUIT_ORDER,
  cardsOf: cardsOf, drawMajor: drawMajor, drawOne: drawOne, drawMany: drawMany,
  SLOT_MINI: SLOT_MINI, summaryMini: summaryMini
};
`;

fs.writeFileSync(OUT_JS, js, 'utf8');
console.log('✓ 已写入 miniprogram/utils/cards.js  （' + cards.length + ' 张）');

/* ---------- 注入 HTML ---------- */
if (fs.existsSync(OUT_HTML)) {
  const html = fs.readFileSync(OUT_HTML, 'utf8');
  const re = /\/\* __CARDS_BEGIN__ \*\/[\s\S]*?\/\* __CARDS_END__ \*\//;
  if (!re.test(html)) {
    console.error('✗ preview/src.html 里没找到注入标记 __CARDS_BEGIN__ / __CARDS_END__，跳过注入');
  } else {
    const data = cards.map(function (c, i) {
      const o = Object.assign({ id: i }, c);
      delete o.group;
      o.revText = o.reversed;   // 与 cards.js 保持一致：reversed 留给运行时方向
      delete o.reversed;
      return o;
    });
    const block = '/* __CARDS_BEGIN__ */\nconst CARDS = ' + JSON.stringify(data) + ';\n/* __CARDS_END__ */';
    fs.writeFileSync(OUT_HTML, html.replace(re, block), 'utf8');
    console.log('✓ 已注入 preview/src.html');
  }
}

/* ---------- 统计 ---------- */
console.log('\n分组统计：');
Object.keys(byGroup).forEach(function (k) { console.log('  ' + k + ': ' + byGroup[k] + ' 张'); });

/* ---------- 顺带产出单机版（牌图内嵌，一个文件即可打开） ---------- */
try {
  console.log('');
  require('./build_standalone.js');
} catch (e) {
  console.log('（单机版未生成：' + e.message + '）');
}

/* ---------- 顺带刷新发布目录 dist/index.html（供重新发布用） ---------- */
try {
  const fs = require('fs');
  const path = require('path');
  const ROOT = path.join(__dirname, '..');
  const src = path.join(ROOT, '科研塔罗牌.html');
  const dir = path.join(ROOT, 'dist');
  if (fs.existsSync(src)) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    fs.copyFileSync(src, path.join(dir, 'index.html'));
    console.log('✓ 已刷新 dist/index.html（重新发布时用这个目录）');
  }
} catch (e) {
  console.log('（dist 未刷新：' + e.message + '）');
}

/* ---------- 顺带刷新 GitHub Pages 发布目录 docs/ ---------- */
try {
  console.log('');
  require('./build_ghpages.js');
} catch (e) {
  console.log('（docs 未生成：' + e.message + '）');
}
