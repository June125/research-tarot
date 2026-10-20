/** 一次性：给 22 张大牌补「场景」字段 */
const fs = require('fs');
const path = require('path');

const MD = path.resolve(__dirname, '../文案/牌义文案.md');
const SCENE = {
  '0': '开题', 'I': '组会', 'II': '文献', 'III': '经费', 'IV': '导师', 'V': '同行评议',
  'VI': '合作', 'VII': '冲刺', 'VIII': '心态', 'IX': '闭关', 'X': '投稿轮盘', 'XI': '署名',
  'XII': '延毕', 'XIII': '换方向', 'XIV': '节制', 'XV': '内卷', 'XVI': '翻车',
  'XVII': '灵感', 'XVIII': '迷雾', 'XIX': '接收', 'XX': '答辩', 'XXI': '毕业'
};

const lines = fs.readFileSync(MD, 'utf8').split(/\r?\n/);
const out = [];
let curRoman = null;
let done = 0;

lines.forEach(function (line) {
  const h = line.match(/^##\s+major\s*\|\s*([^|]+)\|/);
  if (h) { curRoman = h[1].trim(); }
  if (curRoman && /^-\s*关键词：/.test(line)) {
    const s = SCENE[curRoman];
    if (s) { out.push('- 场景：' + s); done++; }
    curRoman = null;
  }
  out.push(line);
});

fs.writeFileSync(MD, out.join('\n'), 'utf8');
console.log('已给', done, '张大牌补上场景字段');
