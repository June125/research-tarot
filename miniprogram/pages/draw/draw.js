const U = require('../../utils/cards.js');
const COLLECT = require('../../utils/collect.js');
const KEY = 'research_tarot_today';
const SLOT = U.SLOT_MINI || ['现状', '卡点', '下一步'];

/**
 * 牌图路径前缀
 *   本地图：'/assets/cards/'（已压缩至主包 2MB 以内）
 *   若后续图变大，可上传到 CDN，把这里换成 'https://你的已备案域名/cards/'
 *   （需同时在小程序后台配置 downloadFile 合法域名）
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
    wx.setNavigationBarTitle({ title: mode === 'single' ? '今日一卡' : '三卡组合' });

    // 今日已抽过：直接回看，不重复发牌
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
      // 今日一卡：只从 22 张大牌里出
      const c = U.drawMajor();
      try {
        wx.setStorageSync(KEY, Object.assign({ date: todayKey() }, c));
      } catch (e) {}
      COLLECT.add([c]);
      this.setData({ card: c, step: 'result', flipped: false });
      setTimeout(() => this.setData({ flipped: true }), 260);
    } else {
      // 三卡组合：全 78 张牌池，不重复
      const cs = U.drawMany(3);
      COLLECT.add(cs);
      this.setData({
        cards: cs,
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
    // 综合提示（不带结论评级）
    const s = U.summaryMini ? U.summaryMini(this.data.cards) : { text: '' };
    this.setData({ detail: detail, summary: s, showDetail: true });
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
      t = '【今日科研卡】\n' + c.roman + ' ' + c.name + (c.scene ? '（' + c.scene + '）' : '')
        + '（' + (c.reversed ? '提醒' : '正向') + '）\n'
        + '提示：' + (c.reversed ? c.revText : c.upright) + '\n科研：' + c.research + '\n建议：' + c.advice;
    } else if (this.data.cards.length) {
      const s = U.summaryMini ? U.summaryMini(this.data.cards) : { text: '' };
      t = '【今日科研卡 · 三卡组合】\n'
        + this.data.cards.map(function (c, i) {
            return SLOT[i] + '：' + c.name + (c.scene ? '（' + c.scene + '）' : '') + '（' + (c.reversed ? '提醒' : '正向') + '）';
          }).join('\n')
        + '\n\n综合：' + s.text;
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
      : '今日科研卡 · 三卡组合';
    return { title: title, path: '/pages/index/index' };
  }
});
