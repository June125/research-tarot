/**
 * 下载 Rider-Waite-Smith（韦特 / 莱德伟特）塔罗牌图
 * 图源：Wikimedia Commons，RWS 1909 年版已落入公有领域（public domain）
 *
 * 用法：node tools/fetch_images.js
 * 产出：assets/cards/ 与 miniprogram/assets/cards/（各 78 张 jpg）
 *
 * 说明：Wikimedia 缩略图只提供固定档位，实测只有 500px 可用，
 *      所以先取 500px，再用 macOS 自带 sips 压到 320px 宽。
 */
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets/cards');
const MP = path.join(ROOT, 'miniprogram/assets/cards');
const TMP = path.join(ROOT, '.tmp-img');
const UA = 'research-tarot/1.0 (Macintosh; local prototype)';
const WIDTH = 320;      // 最终宽度
const QUALITY = 55;     // jpeg 质量

const MAJOR_NAMES = ['Fool','Magician','High_Priestess','Empress','Emperor','Hierophant','Lovers','Chariot','Strength','Hermit','Wheel_of_Fortune','Justice','Hanged_Man','Death','Temperance','Devil','Tower','Star','Moon','Sun','Judgement','World'];
const COMMON_SUIT = { wands: 'Wands', cups: 'Cups', swords: 'Swords', pents: 'Pents' };

const jobs = [];
MAJOR_NAMES.forEach(function (n, i) {
  const nn = String(i).padStart(2, '0');
  jobs.push({ commons: 'RWS_Tarot_' + nn + '_' + n + '.jpg', local: 'major-' + nn + '.jpg' });
});
['wands', 'cups', 'swords', 'pents'].forEach(function (s) {
  for (let i = 1; i <= 14; i++) {
    const nn = String(i).padStart(2, '0');
    jobs.push({ commons: COMMON_SUIT[s] + nn + '.jpg', local: s + '-' + nn + '.jpg' });
  }
});

function run(cmd, args) {
  return new Promise(function (resolve) {
    execFile(cmd, args, { maxBuffer: 1 << 20 }, function (err, stdout, stderr) {
      resolve({ ok: !err, err: err, out: stdout });
    });
  });
}

async function queryTitles(list) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=500&titles='
    + encodeURIComponent(list.join('|'));
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  return r.json();
}

async function downloadWithRetry(url, dest, tries) {
  for (let i = 0; i < (tries || 3); i++) {
    const r = await run('curl', ['-sS', '-L', '-m', '45', '-A', UA, '-o', dest, url]);
    try {
      if (fs.statSync(dest).size > 8000) return true;
    } catch (e) {}
    await new Promise(res => setTimeout(res, 1200 * (i + 1)));
  }
  return false;
}

(async function () {
  [OUT, MP, TMP].forEach(d => fs.mkdirSync(d, { recursive: true }));
  console.log('① 查询 Wikimedia Commons …');

  const byFile = {};
  for (let i = 0; i < jobs.length; i += 25) {
    const chunk = jobs.slice(i, i + 25);
    const j = await queryTitles(chunk.map(x => 'File:' + x.commons));
    const pages = (j.query && j.query.pages) || {};
    Object.values(pages).forEach(function (p) {
      if (p.missing !== undefined) { console.error('  缺图:', p.title); return; }
      const ii = p.imageinfo && p.imageinfo[0];
      if (!ii) return;
      const file = p.title.replace(/^File:/, '').replace(/ /g, '_');
      byFile[file] = (ii.thumburl || ii.url).split('?')[0];
    });
  }
  console.log('  拿到 URL:', Object.keys(byFile).length, '/', jobs.length);

  const plan = jobs.filter(function (jb) {
    if (!byFile[jb.commons]) { console.error('  无 URL:', jb.commons); return false; }
    return true;
  }).map(function (jb) { return { local: jb.local, url: byFile[jb.commons] }; });

  console.log('② 下载 78 张（并发 4，失败自动重试）…');
  let ok = 0;
  for (let i = 0; i < plan.length; i += 4) {
    const batch = plan.slice(i, i + 4);
    const rs = await Promise.all(batch.map(function (p) {
      return downloadWithRetry(p.url, path.join(TMP, p.local), 3).then(function (good) {
        if (good) return true;
        console.error('  下载失败:', p.local);
        return false;
      });
    }));
    ok += rs.filter(Boolean).length;
    process.stdout.write('\r  ' + Math.min(i + 4, plan.length) + '/' + plan.length);
  }
  console.log('\n  下载成功:', ok, '/', plan.length);

  console.log('③ 压缩到 ' + WIDTH + 'px …');
  let done = 0;
  for (const p of plan) {
    const src = path.join(TMP, p.local);
    const dst = path.join(OUT, p.local);
    if (!fs.existsSync(src)) continue;
    const r = await run('sips', ['--resampleWidth', String(WIDTH), '-s', 'formatOptions', String(QUALITY), src, '--out', dst]);
    if (r.ok) done++;
  }
  console.log('  压缩完成:', done);

  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.jpg'));
  const total = files.reduce(function (a, f) { return a + fs.statSync(path.join(OUT, f)).size; }, 0);
  console.log('④ 共', files.length, '张，', (total / 1024 / 1024).toFixed(2), 'MB');

  files.forEach(function (f) { fs.copyFileSync(path.join(OUT, f), path.join(MP, f)); });
  console.log('  已复制到 miniprogram/assets/cards/');

  fs.rmSync(TMP, { recursive: true, force: true });
  console.log('完成');
})();
