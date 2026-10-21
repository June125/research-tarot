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
      title: '清空阅读记录',
      content: '会清除已读标记（本地数据，不可恢复），确定吗？',
      success: function (res) {
        if (res.confirm) {
          COLLECT.clear();
          wx.showToast({ title: '已清空', icon: 'none' });
        }
      }
    });
  }
});
