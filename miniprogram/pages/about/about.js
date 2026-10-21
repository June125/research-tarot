const COLLECT = require('../../utils/collect.js');
const MAIL = 'feedback@example.com';

Page({
  copyMail: function () {
    wx.setClipboardData({
      data: MAIL,
      success: function () {
        wx.showToast({ title: '邮箱已复制', icon: 'none' });
      }
    });
  },

  clearCollect: function () {
    const self = this;
    wx.showModal({
      title: '清空收集进度',
      content: '会清除已收集的卡牌记录（本地数据，不可恢复），确定吗？',
      success: function (res) {
        if (res.confirm) {
          COLLECT.clear();
          wx.showToast({ title: '已清空', icon: 'none' });
        }
      }
    });
  }
});
