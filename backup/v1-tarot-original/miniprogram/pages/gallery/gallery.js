const U = require('../../utils/cards.js');

const GROUPS = [
  { key: 'major', label: '大阿尔卡纳' },
  { key: 'wands', label: '权杖 · 火' },
  { key: 'cups', label: '圣杯 · 水' },
  { key: 'swords', label: '宝剑 · 风' },
  { key: 'pent', label: '星币 · 土' }
];

const IMG_BASE = '/assets/cards/';

Page({
  data: {
    groups: GROUPS,
    curGroup: 'major',
    imgBase: IMG_BASE,
    list: [],
    cur: null
  },

  onLoad: function () {
    this.loadGroup('major');
  },

  loadGroup: function (key) {
    const list = U.cardsOf(key).map(function (c) {
      return Object.assign({}, c, {
        sub: c.scene ? c.scene : (c.arcana === 'major' ? c.en : c.suitName)
      });
    });
    this.setData({ curGroup: key, list: list });
  },

  switchGroup: function (e) {
    this.loadGroup(e.currentTarget.dataset.k);
  },

  openSheet: function (e) {
    const i = Number(e.currentTarget.dataset.i);
    this.setData({ cur: this.data.list[i] });
  },

  closeSheet: function () {
    this.setData({ cur: null });
  },

  noop: function () {},

  onShareAppMessage: function () {
    return { title: '科研塔罗牌 · 78 张完整牌库', path: '/pages/index/index' };
  }
});
