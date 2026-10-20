# 科研塔罗牌 Research Tarot

78 张标准塔罗（22 大阿尔卡纳 + 56 小阿尔卡纳），韦特（Rider-Waite-Smith, 1909，公有领域）原图做牌面，
牌义按市面通行解法、**剥离感情线只留事业学业**，再附一条科研场景预测和一条当天可执行的建议。

## 你要改的文案在哪

**`文案/牌义文案.md`** —— 这是唯一的文案来源，改它就够了。

改完存盘，在项目根目录执行一条命令重新生成：

```bash
node tools/build.js
```

它会自动做三件事：
1. 重建 `miniprogram/utils/cards.js`（小程序的数据源）
2. 把数据注入 `preview/index.html`（预览版源文件）
3. 生成 **`科研塔罗牌.html`**（单机版，78 张牌图已内嵌，双击就能看）

三个产物里前两个是中间物，`科研塔罗牌.html` 是最终能直接打开的那个，都**不要手改**，手改会被下次构建覆盖。

构建时会校验：必须正好 78 张（22/14/14/14/14），六个字段一个都不能少，缺了会直接报错并指出是哪一张。

## 目录

```
research-tarot/
├─ 文案/牌义文案.md        ← 唯一文案来源，你改这个
├─ 科研塔罗牌.html          ← 生成物：单机预览版，牌图已内嵌，双击就开
├─ tools/build.js          ← 文案 → 代码 的构建脚本（跑它就够）
├─ tools/build_standalone.js ← 把牌图内嵌成单文件（build.js 会自动调用）
├─ tools/fetch_images.js   ← 抓韦特牌图的脚本（一般不用再跑）
├─ assets/cards/           ← 78 张牌图（320px 宽，共 4.9 MB）
├─ preview/src.html        ← 预览版源文件（依赖 assets/，被 build.js 注入，不直接打开）
└─ miniprogram/            ← 微信小程序源码
   ├─ assets/cards/        ← 同上 78 张图
   ├─ utils/cards.js       ← 生成物
   └─ pages/{index,draw,gallery}
```

## 看效果用哪个文件

**`科研塔罗牌.html`** —— 双击打开就行。78 张牌图已内嵌成 base64，不依赖任何外部文件，
离线可用、发给别人也是单独一个文件能看。

`preview/src.html` 是它的源文件，靠相对路径 `../assets/cards/` 取图，**不要直接打开** ——
放进只提供单个 HTML 的静态服务里（比如 IDE 预览面板）会全是裂图。要预览就用根目录那个成品。

### 怎么确认自己看的是不是最新一份

- 首页标题下方有一枚**版本徽章**，写着「构建于 YYYY-MM-DD HH:mm」，每次 `node tools/build.js` 都会变。
- 每次构建都会**自动作废上一次的「今日一抽」记录**，所以只要重新构建过，再点进去一定是新抽的一张，不会停在旧牌上。
- 结果页有「🔄 换一张」，随时重抽，不用清缓存。
- 如果你打开的是 `preview/src.html`（源文件，牌图未内嵌），页面会**自己弹一条红色警告**告诉你打开错了 —— 不会让你对着空白牌面猜。

改完文件如果页面没变化，先 **Cmd + Shift + R 强制刷新**，再看徽章上的构建时间。

## 玩法

- **今日一抽**：只从 22 张大阿尔卡纳里抽，一天一次（localStorage 按日期锁）
- **三张牌阵**：过去 / 现在 / 未来，从全 78 张里不重复抽，逐张点击翻开
- **牌面图鉴**：五个分组翻完 78 张，点开看正位/逆位/科研/建议

逆位概率 32%，逆位的牌图会整体旋转 180°。

牌面主标题永远是**塔罗原牌名**（女祭司、权杖三…），`场景` 只作为金色小副标跟在后面
（如「女祭司 ᴇ́ 文献」）。想彻底去掉副标，把 `文案/牌义文案.md` 里对应的 `- 场景：…` 行删掉或留空，重新构建即可。

## 跑小程序

微信开发者工具 → 导入项目 → 选 `miniprogram/` 目录 → appid 填 `touristappid` 可用游客模式预览。

### 一个注意点：图片体积

78 张图共 **4.9 MB**，超过小程序主包 2 MB 限制。真要上传发布，有两个办法：

1. **丢 CDN**（推荐）：把 `assets/cards/` 整个传到对象存储，然后改两处 `IMG_BASE`：
   - `miniprogram/pages/draw/draw.js` 里的 `IMG_BASE`
   - `miniprogram/pages/gallery/gallery.js` 里的 `IMG_BASE`
   
   改成 `'https://你的域名/cards/'`，然后把 `miniprogram/assets/cards/` 删掉。
2. **分包**：把 `assets/cards` 挪进分包目录，配 `app.json` 的 `subpackages`。

本地预览不受影响，直接跑就行。

## 牌图来源

Rider-Waite-Smith deck，1909 年出版，已进入公有领域，图源来自 Wikimedia Commons。
想换图，直接替换 `assets/cards/` 里的同名 jpg 即可（`major-00.jpg` ~ `major-21.jpg`、
`wands-01~14.jpg`、`cups-01~14.jpg`、`swords-01~14.jpg`、`pents-01~14.jpg`）。
