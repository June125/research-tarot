const U = require('../../utils/cards.js');
const COLLECT = require('../../utils/collect.js');

const GROUPS = [
  { key: 'major', label: '大牌 · 22 张' },
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
    cur: null,
    collected: 0
  },

  onLoad: function () {
    this.loadGroup('major');
  },

  onShow: function () {
    this.setData({ collected: COLLECT.getAll().length });
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
    this.setData({ cur: this.data.list[i] });
  },

  closeSheet: function () {
    this.setData({ cur: null });
  },

  noop: function () {},

  onShareAppMessage: function () {
    return { title: '今日科研卡 · 78 张完整牌库', path: '/pages/index/index' };
  }
});
