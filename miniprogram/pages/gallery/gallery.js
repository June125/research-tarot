const U = require('../../utils/cards.js');
const COLLECT = require('../../utils/collect.js');

const GROUPS = [
  { key: 'major', label: '大牌 · 22 张' },
  { key: 'wands', label: '权杖 · 火' },
  { key: 'cups', label: '圣杯 · 水' },
  { key: 'swords', label: '宝剑 · 风' },
  { key: 'pent', label: '星币 · 土' }
];

/**
 * 牌图路径前缀
 *   本地图：'/assets/cards/'（已压缩至主包 2MB 以内）
 *   若后续图变大，可上传到 CDN，把这里换成 'https://你的已备案域名/cards/'
 *   （需同时在小程序后台配置 downloadFile 合法域名）
 */
const IMG_BASE = '/assets/cards/';

Page({
  data: {
    groups: GROUPS,
    curGroup: 'major',
    imgBase: IMG_BASE,
    list: [],
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
      today: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
    });
    this.loadGroup('major');
  },

  onShow: function () {
    this.loadGroup(this.data.curGroup);
  },

  loadGroup: function (key) {
    const owned = COLLECT.getAll();
    const list = U.cardsOf(key).map(function (c) {
      return Object.assign({}, c, {
        owned: owned.indexOf(c.id) >= 0,
        sub: c.scene ? c.scene : (c.arcana === 'major' ? c.en : c.suitName)
      });
    });
    this.setData({ curGroup: key, list: list, collected: owned.length });
  },

  switchGroup: function (e) {
    this.loadGroup(e.currentTarget.dataset.k);
  },

  openSheet: function (e) {
    const i = Number(e.currentTarget.dataset.i);
    const c = this.data.list[i];
    if (!c) return;
    COLLECT.add([c]);
    this.loadGroup(this.data.curGroup);
    this.setData({ cur: c });
  },

  /* 今日一句：按日期固定轮播（同一天所有人相同），点开看整卡 */
  openDaily: function () {
    const c = this.data.daily;
    if (!c) return;
    COLLECT.add([c]);
    this.loadGroup(this.data.curGroup);
    this.setData({ cur: c });
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
    this.loadGroup(this.data.curGroup);
    this.setData({ mail: false, cur: c });
  },

  closeSheet: function () {
    this.setData({ cur: null });
  },

  noop: function () {},

  goThree: function () {
    wx.navigateTo({ url: '/pages/draw/draw' });
  },

  goAbout: function () {
    wx.navigateTo({ url: '/pages/about/about' });
  },

  onShareAppMessage: function () {
    return { title: '科研灵感卡 · 78 张科研方法论卡片', path: '/pages/gallery/gallery' };
  }
});
