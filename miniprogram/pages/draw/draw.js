const U = require('../../utils/cards.js');
const COLLECT = require('../../utils/collect.js');
const SLOT = U.SLOT_MINI || ['卡在哪', '怎么破', '怎么收'];

/**
 * 牌图路径前缀
 *   本地图：'/assets/cards/'（已压缩至主包 2MB 以内）
 *   若后续图变大，可上传到 CDN，把这里换成 'https://你的已备案域名/cards/'
 *   （需同时在小程序后台配置 downloadFile 合法域名）
 */
const IMG_BASE = '/assets/cards/';

Page({
  data: {
    step: 'mail',
    imgBase: IMG_BASE,
    cards: [],
    flips: [false, false, false],
    slots: SLOT,
    detail: [],
    summary: null,
    showDetail: false
  },

  onLoad: function () {
    wx.setNavigationBarTitle({ title: '我该怎么做' });
  },

  /* 拆开 ACCEPTED 信封 → 发牌 */
  openMail: function () {
    this.dealAfterShuffle();
  },

  dealAfterShuffle: function () {
    const self = this;
    this.setData({ step: 'shuffle' });
    setTimeout(function () { self.deal(); }, 1500);
  },

  deal: function () {
    // 三张不重复，全 78 张牌池
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
    this.setData({ step: 'mail', showDetail: false, detail: [], flips: [false, false, false] });
  },

  backHome: function () {
    wx.navigateBack();
  },

  copy: function () {
    const self = this;
    if (!self.data.cards.length) return;
    const s = U.summaryMini ? U.summaryMini(self.data.cards) : { text: '' };
    const t = '【科研灵感卡 · 我该怎么做】\n'
      + self.data.cards.map(function (c, i) {
          return SLOT[i] + '：' + c.name + (c.scene ? '（' + c.scene + '）' : '')
            + '（' + (c.reversed ? '换个角度看' : '这条建议') + '）';
        }).join('\n')
      + '\n\n综合：' + s.text;
    wx.setClipboardData({
      data: t,
      success: function () {
        wx.showToast({ title: '已复制', icon: 'none' });
      }
    });
  },

  onShareAppMessage: function () {
    return { title: '科研灵感卡 · 我该怎么做', path: '/pages/gallery/gallery' };
  }
});
