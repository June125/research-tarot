const U = require('../../utils/cards.js');
const KEY = 'research_tarot_today';
const SLOT = ['过去', '现在', '未来'];

/**
 * 牌图路径前缀
 *   本地图：'/assets/cards/'（已放在小程序目录内，78 张约 4.8MB，注意主包 2MB 限制）
 *   上线时建议把 assets/cards 传到 CDN，把这里换成 'https://你的域名/cards/'
 */
const IMG_BASE = '/assets/cards/';

function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

Page({
  data: {
    mode: 'single',
    step: 'shuffle',
    imgBase: IMG_BASE,
    card: null,
    flipped: false,
    cards: [],
    flips: [false, false, false],
    slots: SLOT,
    detail: [],
    summary: null,
    showDetail: false
  },

  onLoad: function (opt) {
    const mode = (opt && opt.mode === 'three') ? 'three' : 'single';
    this.setData({ mode: mode });
    wx.setNavigationBarTitle({ title: mode === 'single' ? '今日一抽' : '三张牌阵' });

    // 今日已抽过：直接回看，不重复洗牌
    if (mode === 'single' && opt && opt.replay) {
      let rec = null;
      try { rec = wx.getStorageSync(KEY); } catch (e) { rec = null; }
      if (rec && rec.date === todayKey()) {
        this.setData({ card: rec, step: 'result' });
        setTimeout(() => this.setData({ flipped: true }), 260);
        return;
      }
    }

    this.dealAfterShuffle();
  },

  dealAfterShuffle: function () {
    const self = this;
    setTimeout(function () { self.deal(); }, 1700);
  },

  deal: function () {
    if (this.data.mode === 'single') {
      // 今日一抽：只从 22 张大阿尔卡纳中抽
      const c = U.drawMajor();
      try {
        wx.setStorageSync(KEY, Object.assign({ date: todayKey() }, c));
      } catch (e) {}
      this.setData({ card: c, step: 'result', flipped: false });
      setTimeout(() => this.setData({ flipped: true }), 260);
    } else {
      // 三张牌阵：全 78 张牌池，不重复
      this.setData({
        cards: U.drawMany(3),
        flips: [false, false, false],
        detail: [],
        summary: null,
        showDetail: false,
        step: 'result'
      });
    }
  },

  flipSingle: function () {
    if (!this.data.flipped) this.setData({ flipped: true });
  },

  flipOne: function (e) {
    const i = Number(e.currentTarget.dataset.i);
    if (this.data.flips[i]) return;
    const patch = {};
    patch['flips[' + i + ']'] = true;
    this.setData(patch);
    const done = this.data.flips.filter(function (v) { return v; }).length;
    if (done === this.data.cards.length) {
      const self = this;
      setTimeout(function () { self.buildDetail(); }, 700);
    }
  },

  buildDetail: function () {
    const detail = this.data.cards.map(function (c, i) {
      return {
        slot: SLOT[i],
        name: c.name,
        title: c.name,
        scene: c.scene,
        reversed: c.reversed,
        text: c.reversed ? c.revText : c.upright,
        research: c.research,
        advice: c.advice,
        quote: c.quote
      };
    });
    this.setData({ detail: detail, summary: U.summaryOf(this.data.cards), showDetail: true });
  },

  redraw: function () {
    this.setData({ step: 'shuffle', showDetail: false, detail: [], flips: [false, false, false] });
    this.dealAfterShuffle();
  },

  backHome: function () {
    wx.navigateBack();
  },

  copy: function () {
    let t = '';
    if (this.data.mode === 'single' && this.data.card) {
      const c = this.data.card;
      t = '【科研塔罗 · 今日一抽】\n' + c.roman + ' ' + c.name + (c.scene ? '（' + c.scene + '）' : '')
        + '（' + (c.reversed ? '逆位' : '正位') + '）\n'
        + '解读：' + (c.reversed ? c.revText : c.upright) + '\n科研：' + c.research + '\n建议：' + c.advice;
    } else if (this.data.cards.length) {
      const s = U.summaryOf(this.data.cards);
      t = '【科研塔罗 · 三张牌阵】\n'
        + this.data.cards.map(function (c, i) {
            return SLOT[i] + '：' + c.name + (c.scene ? '（' + c.scene + '）' : '') + '（' + (c.reversed ? '逆位' : '正位') + '）';
          }).join('\n')
        + '\n\n综合：' + s.level + '　' + s.text;
    }
    wx.setClipboardData({
      data: t,
      success: function () {
        wx.showToast({ title: '已复制，去群里整活', icon: 'none' });
      }
    });
  },

  onShareAppMessage: function () {
    const title = this.data.mode === 'single' && this.data.card
      ? '我今天抽到了「' + this.data.card.name + '」，你呢？'
      : '科研塔罗牌 · 三张牌阵';
    return { title: title, path: '/pages/index/index' };
  }
});
