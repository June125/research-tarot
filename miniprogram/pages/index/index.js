const KEY = 'research_tarot_today';
const COLLECT = require('../../utils/collect.js');

function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

Page({
  data: {
    todayText: '每天一张 · 从 22 张大牌里出',
    hasToday: false,
    collected: 0
  },

  onShow: function () {
    this.refresh();
  },

  refresh: function () {
    let rec = null;
    try { rec = wx.getStorageSync(KEY); } catch (e) { rec = null; }
    if (rec && rec.date === todayKey()) {
      this.setData({
        hasToday: true,
        todayText: '今日已抽：' + rec.name + (rec.scene ? '（' + rec.scene + '）' : '') + '（' + (rec.reversed ? '提醒' : '正向') + '）· 点击查看'
      });
    } else {
      this.setData({
        hasToday: false,
        todayText: '每天一张 · 从 22 张大牌里出'
      });
    }
    this.setData({ collected: COLLECT.getAll().length });
  },

  goSingle: function () {
    if (this.data.hasToday) {
      wx.navigateTo({ url: '/pages/draw/draw?mode=single&replay=1' });
    } else {
      wx.navigateTo({ url: '/pages/draw/draw?mode=single' });
    }
  },

  goThree: function () {
    wx.navigateTo({ url: '/pages/draw/draw?mode=three' });
  },

  goGallery: function () {
    wx.navigateTo({ url: '/pages/gallery/gallery' });
  },

  goAbout: function () {
    wx.navigateTo({ url: '/pages/about/about' });
  },

  onShareAppMessage: function () {
    return { title: '今日科研卡 · 每天一张科研提示', path: '/pages/index/index' };
  }
});
