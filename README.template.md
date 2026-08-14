# dsh-cyberpunk-theme · DSH 赛博朋克 2077 主题

> 把 [DeepSeek Harness](https://github.com/deepseek-ai)（DSH）整个界面换成《赛博朋克 2077》夜之城风格的**深度定制主题**——霓虹配色、CRT 氛围、流动彩带、故障闪烁、全局切角 UI、输入框下方的实时状态条，还带一个独立的设置页。
> 以 **动态 Cordis 插件** 形式分发，**30 秒即可装上**，无需改 DSH 源码、无需构建。

---

## 📸 效果预览

| 🌃 夜之城（暗色） | 🏙 荒坂（亮色） |
| --- | --- |
| ![暗色模式](docs/screenshots/session-dark.png) | ![亮色模式](docs/screenshots/session-light.png) |

*截图来自启用主题后的真实 DSH 会话——暗色模式下霓虹效果最完整。*

---

## 🚀 快速安装（动态插件 · 约 30 秒）

**前置条件**：一个能打开 **DeepSeek Harness Web 界面**、且支持动态 Cordis 插件（`cordis_define` / `cordis_run` 流程）的 DSH 实例。

**步骤：**

1. 打开 DSH 的 Web 界面，发起**创建动态插件**（`cordis_define`，`idPrefix` 随便取 3–6 个字母，例如 `cpunk`）。
2. 把下面的 **Host 代码** 粘贴到插件的 host 栏（一个超小的 `ping` 心跳服务，让状态条能显示 UPLINK 在线状态）：

```js
{{HOST_BODY}}
```

3. 把下面的 **Client 代码** 粘贴到 client 栏（主题本体：配色 token、全部 CSS、氛围层、状态条、设置页）：

<details>
<summary><b>📋 点开复制 Client 代码（约 500 行，含完整主题）</b></summary>

```js
{{CLIENT_BODY}}
```

</details>

> 💡 **不想手动复制？** 克隆仓库后执行 `node scripts/extract-body.cjs`，生成的 `scripts/client-body.txt` 就是上面这份 Client 代码，直接整份复制即可。

4. **运行（`cordis_run`）并授权** → 主题立即生效 🎉

**验证是否生效：** 设置页里应该出现 **Cyberpunk 2077** 分区；输入框下方会出现状态条（`LOCAL 时间` / `UPLINK ● 心跳` / `Accent`）；页面四周有流动彩带。

> 💡 **建议暗色模式使用**：设置 → Cyberpunk 2077 → **Night City (Dark)**（或 DSH 自带的外观设置切到暗色）。

### ⚠️ 动态插件的特性（必读）

- **刷新页面后主题会消失。** 动态插件的客户端部分是**进程级**的：它只在收到一次 **dispatch**（`cordis_run` / 运行卡片）时注入当前页面。刷新后主题没了**不是 bug**——重新运行一次插件（几秒）即可恢复。
- 插件**不跨 DSH 重启保留**：重启后需要重新创建/运行。
- 需要长期使用？见下方「🔩 永久安装」。

---

## 🔩 永久安装（进阶：重启不丢）

想把主题固化成随 DSH 启动、重启不丢的正式插件，只需把动态插件特有的三处"临时便利"换成常规写法，其余全部原样保留：

| 动态插件写法 | 永久插件等价写法 |
| --- | --- |
| `styles.insert(css)` | 打包器 CSS（CSS Modules / 样式表导入） |
| `React.createElement(...)` | JSX |
| `harness.handle` / `host.call` 的 ping | 常规的 client ↔ host 桥接 |

其余部分——`theme.overrideTokens`、三个 Slot 注册（`shell.overlay`、`conversation.composer.dock`、`settings.section`）、token 名、配色值——**原样可用，一行都不用改**。

---

## ✨ 功能总览

### 🎨 配色
- **暗色 · 夜之城**：蓝黑画布 `#08090f` + 霓虹黄 `#fcee0a`、电光青 `#00f0ff`、品红 `#ff2d6b`。
- **亮色 · 荒坂**：暖纸色 `#edece2` + 金/红点缀，可读且主题感明确。
- **4 套强调色预设**（夜城黄 / 网行者青 / 创伤小队品红 / 荒坂金），每套都配好了亮暗双模式。

### 🌆 氛围层（全部可穿透点击，`pointer-events: none`）
- **夜之城线框网格**——淡青色网格，中心聚焦、边缘渐隐。
- **CRT 扫描线**——随配色自动适配（亮色下暗线、暗色下亮线）。
- **暗角（Vignette）**——四周柔和压暗。
- **流动边框彩带**——黄 → 青 → 品红 → 紫的四色霓虹彩带沿整个应用边框流动。
- **屏幕故障闪烁**——偶发全屏故障爆闪。

### ✨ 品牌
- 左上角 **DeepSeek Harness 商标 + 鲸鱼 Logo** 在四色间流动（8 秒循环），伴随周期性的 RGB 分离故障闪烁。

### 📊 输入框读数区
- **LLM 统计行**——内置统计行变成一排紧凑单行切角芯片，颜色**与品牌实时同步**（同一套关键帧），带柔光与轻微故障。
- **状态条**——`LOCAL HH:MM:SS` · 日期 · `UPLINK ● ONLINE` 心跳（真实 Client→Host ping，圆点脉冲）· 当前强调色；可开启故障闪烁。

### 🧩 细节打磨
- **赛博朋克对角双切角**（左上 + 右下，CP2077 标志性造型）：用户气泡 16px、工具调用组卡片 14px、composer 输入卡片 12px、新会话按钮 10px、代码块 10px——每条切边都带霓虹亮线（1px 描边沿对角线被裁切，切出的斜线自带发光）。
- **侧边栏行**——当前会话常驻霓虹侧轨（`aria-selected`），悬停霓虹染色 + 强调色文字。
- **霓虹光标**与**输入框聚焦辉光**；标题 HUD 字距；代码块终端色竖条；霓虹滚动条与选区。

### ⚙️ 设置页（设置 → Cyberpunk 2077）
- 配色方案：**夜之城（暗色）** / 跟随系统 / 亮色。
- 强调色：4 套预设，通过 `theme.overrideTokens` 实时切换。
- 特效开关：**网格** / **扫描线** / **屏幕故障** / **状态条故障**。
- 全部尊重 `prefers-reduced-motion`（系统"减弱动态效果"时自动关闭动画）。

---

## 🛠 工作原理

- **Token 层**：`theme.overrideTokens(source, tokens)` 在活动主题之上叠加一层，presenter 把它投影到 `body` 的 CSS 变量上——因此亮/暗两套配色都能被完整覆盖。
- **Slot 注册**：氛围层注册在 `shell.overlay`（list、可叠加），状态条在 `conversation.composer.dock`，设置页在 `settings.section`。
- **产品 DOM 定位**：内置 UI 全部通过**稳定属性**（而非哈希类名）来定向：
  - 用户气泡：`data-chat-flow-kind="user"` + `data-time-hover-root`（行内栈的最后一个 `div` 就是气泡本体）
  - 工具调用组：`data-chat-flow-kind="tool-call"` 座位本身变成可见的切角卡片（内部行本来就是无背景的）
  - 侧边栏行：`role="treeitem"`、`aria-selected="true"`
  - composer 卡片：`data-composer-card`——**切角画在 `::before` 伪元素上**（底色 + 霓虹边 + 辉光都在伪元素上被裁切）。⚠️ **千万不要直接对卡片本体用 `clip-path`**：模型选择器和思考强度菜单渲染在卡片内部的 overlay 锚点里，祖先的 `clip-path` 会硬裁剪所有后代（连 `position: fixed` 都逃不掉）——v22 就因此把模型切换和思考强度弄失灵了，伪元素方案才两者兼得。
  - 新会话按钮：`[data-slot="sidebar"] > div > button:has(> svg[viewBox="0 0 16 16"][width="14"])`——侧边栏根节点的直接按钮子元素（带 14×14 加号图标那个）。旁边的品牌 wordmark 按钮（216×24，被商标 SVG **占满**）刻意不切——切它会切掉品牌字形。
  - 代码块：`[data-chat-flow-kind] pre`
  - 品牌：`svg[viewBox="0 0 182 24"]` / `svg[viewBox="0 0 23.16 17.04"]`
  - LLM 统计行：状态条的兄弟元素，用 `:has(+ .cp-status)` 定位

  这些属性不属于 DSH 公开 API——如果 DSH 改了 DOM 结构，主题会**优雅降级**（不报错，只是局部不生效）。

---

## 🎨 自定义

所有调节点都在 [`src/client.js`](./src/client.js)：

- **`ACCENTS`** —— 强调色预设。新增一套：给它 `label` + `brand` / `success` / `error` / `warn` 各一组 `{ light, dark }`。
- **`baseTokens`** —— 与强调色无关的背景/文字/边框 token，每个都是 `{ light, dark }` 一对（DSH 的 13 个 alias token）。
- **`MAIN_CSS`** —— 所有特效。动画时长是 `@keyframes` 里的 `…s infinite` 值（`cp-ribbon`、`cp-brand`、`cp-glitch`、`cp-stats-glitch`、`cp-status-glitch`、`cp-dot`）；浓度是各处的 alpha / `color-mix` 百分比。

改完代码后，README 里的安装代码块可以一键同步：`node scripts/build-readme.cjs`。

---

## 📁 项目结构

```
dsh-cyberpunk-theme/
├── src/
│   ├── client.js     # 客户端一半：token、CSS、氛围层、状态条、设置页
│   └── host.js       # 主机一半：私有 ping RPC（心跳）
├── index.js          # 重新导出两个插件工厂
├── scripts/
│   ├── extract-body.cjs    # 从 src/ 提取可直接粘贴的插件代码块
│   ├── build-readme.cjs    # 用提取结果生成 README.md（安装代码不漂移）
│   └── inspect-dom.cjs     # 真实页面 DOM 体检（调试产品锚点用）
├── docs/
│   └── screenshots/  # 暗色/亮色实拍截图
├── package.json
├── LICENSE           # MIT
└── README.md
```

---

## 📄 许可证

[MIT](./LICENSE) —— 自由使用、修改、分发。
