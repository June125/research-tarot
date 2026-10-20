/**
 * 一次性工具：把现有 cards.js 导出成可编辑的 Markdown 文案
 * 用法：node tools/export_md.js
 * 产出：文案/牌义文案.md
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const U = require(path.join(ROOT, 'miniprogram/utils/cards.js'));

const lines = [];
lines.push('# 科研塔罗牌 · 牌义文案');
lines.push('');
lines.push('> 这是唯一的文案来源。改完存盘，在项目根目录执行 `node tools/build.js`，');
lines.push('> 会自动重建 `miniprogram/utils/cards.js` 并把数据注入 `preview/index.html`。');
lines.push('>');
lines.push('> 格式说明：');
lines.push('> - 每张牌以 `## 分组 | 序号 | 牌名 | 英文名 | 图标` 开头，**这一行别改结构**');
lines.push('> - 分组只填 major / wands / cups / swords / pents');
lines.push('> - 下面五个字段各占一行，冒号是中文全角「：」，缺字段会留空');
lines.push('> - 文案想换行就另起一行（不以「- 」开头即可，会被自动拼进上一段）');
lines.push('');

let lastGroup = '';
U.CARDS.forEach(function (c) {
  const group = c.arcana === 'major' ? 'major' : c.suit;
  if (group !== lastGroup) {
    const title = c.arcana === 'major' ? '大阿尔卡纳（22 张）'
      : ({ wands: '权杖 Wands · 火（14 张）', cups: '圣杯 Cups · 水（14 张）', swords: '宝剑 Swords · 风（14 张）', pent: '星币 Pentacles · 土（14 张）' })[group];
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('# ' + title);
    lines.push('');
    lastGroup = group;
  }
  lines.push('## ' + group + ' | ' + c.roman + ' | ' + c.name + ' | ' + c.en + ' | ' + c.emoji);
  lines.push('- 关键词：' + c.kw);
  lines.push('- 正位：' + c.upright);
  lines.push('- 逆位：' + c.reversed);
  lines.push('- 科研：' + c.research);
  lines.push('- 建议：' + c.advice);
  lines.push('');
});

const dir = path.join(ROOT, '文案');
fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, '牌义文案.md');
fs.writeFileSync(out, lines.join('\n'), 'utf8');
console.log('已导出:', out);
console.log('牌数:', U.CARDS.length, '| 字符数:', lines.join('\n').length);
