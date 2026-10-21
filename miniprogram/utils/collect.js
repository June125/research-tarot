/**
 * 卡牌收集册（纯本地存储，不上报、不联网）
 * 记录用户抽到过的牌，用于图鉴页展示收集进度
 */
var KEY = 'rscard_collected';

function getAll() {
  try {
    var v = wx.getStorageSync(KEY);
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}

/** 记录抽到的牌（按 id 去重，保持 id 原始类型），返回最新全集 */
function add(cards) {
  var old = getAll();
  var seen = {};
  var next = [];
  old.forEach(function (id) {
    if (!seen[id]) { seen[id] = 1; next.push(id); }
  });
  (cards || []).forEach(function (c) {
    if (c && c.id != null && !seen[c.id]) { seen[c.id] = 1; next.push(c.id); }
  });
  try { wx.setStorageSync(KEY, next); } catch (e) {}
  return next;
}

/** 是否收集过某张牌 */
function has(id) {
  return getAll().indexOf(id) >= 0;
}

/** 清空收集册 */
function clear() {
  try { wx.setStorageSync(KEY, []); } catch (e) {}
}

module.exports = {
  KEY: KEY,
  getAll: getAll,
  add: add,
  has: has,
  clear: clear
};
