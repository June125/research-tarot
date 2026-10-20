const KEY = 'research_tarot_today';

function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

Page({
  data: {
    todayText: '只抽大阿尔卡纳 · 一天一次',
    hasToday: false
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
        todayText: '今日已抽：' + rec.name + (rec.scene ? '（' + rec.scene + '）' : '') + '（' + (rec.reversed ? '逆位' : '正位') + '）· 点击查看'
      });
    } else {
      this.setData({
        hasToday: false,
        todayText: '只抽大阿尔卡纳 · 一天一次'
      });
    }
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
  }
});
