const U = require('../../utils/cards.js');
const COLLECT = require('../../utils/collect.js');

const IMG_BASE = '/assets/cards/';

Page({
  data: {
    imgBase: IMG_BASE,
    cur: null,
    collected: 0,
    daily: null,
    today: '',
    mail: false
  },

  onLoad: function () {
    const d = new Date();
    const pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    this.setData({
      daily: U.dailyCard(),
      today: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()),
      collected: COLLECT.getAll().length
    });
  },

  onShow: function () {
    this.setData({ collected: COLLECT.getAll().length });
  },

  /* 今日一句：按日期固定轮播（同一天所有人相同），点开看整卡 */
  openDaily: function () {
    const c = this.data.daily;
    if (!c) return;
    COLLECT.add([c]);
    this.setData({ cur: c, collected: COLLECT.getAll().length });
  },

  /* 查收 Result：先开投稿结果信封，拆开是一张随机建议卡（不作解读与评级） */
  checkResult: function () {
    this.setData({ mail: true });
  },

  closeMail: function () {
    this.setData({ mail: false });
  },

  openMailCard: function () {
    const cs = U.drawMany(1);
    const c = cs && cs[0];
    if (!c) return;
    COLLECT.add([c]);
    this.setData({ mail: false, cur: c, collected: COLLECT.getAll().length });
  },

  closeSheet: function () {
    this.setData({ cur: null });
  },

  noop: function () {},

  goThree: function () {
    wx.navigateTo({ url: '/pages/draw/draw' });
  },

  goCollect: function () {
    wx.navigateTo({ url: '/pages/collection/collection' });
  },

  goAbout: function () {
    wx.navigateTo({ url: '/pages/about/about' });
  },

  onShareAppMessage: function () {
    return { title: '科研灵感卡 · 78 张科研方法论卡片', path: '/pages/gallery/gallery' };
  }
});
