# dsh-cyberpunk-theme · DSH 赛博朋克 2077 主题

> 把 [DeepSeek Harness](https://github.com/deepseek-ai)（DSH）整个界面换成《赛博朋克 2077》夜之城风格的**深度定制主题**——霓虹配色、CRT 氛围、流动彩带、故障闪烁、全局切角 UI、输入框下方的实时状态条，还带一个独立的设置页和**主题总开关**。
> 以 **标准 DSH bundle 插件** 分发（`dsh plugin add` 一行安装，刷新/重启都不丢），同时保留 **动态 Cordis 插件** 形式（30 秒快速体验，零配置）。

---

## 📸 效果预览

| 🌃 夜之城（暗色） | 🏙 荒坂（亮色） |
| --- | --- |
| ![暗色模式](docs/screenshots/session-dark.png) | ![亮色模式](docs/screenshots/session-light.png) |

*截图来自启用主题后的真实 DSH 会话——暗色模式下霓虹效果最完整。*

---

## 🚀 安装（三选一，按你的场景挑）

### 方式一：让 DSH 的 Agent 帮你装 —— 零复制（最省事）

如果你在用带 Agent 的 DSH 会话（比如你现在正在看的这个界面），**什么都不用复制**，直接说一句话：

> 「安装 cyberpunk 2077 主题：client 代码在 `<仓库路径>/src/client.js`，host 代码在 `<仓库路径>/src/host.js`，帮我创建动态插件并运行」

Agent 会读取仓库代码、自动完成 `cordis_define` + `cordis_run`。之后**刷新页面主题消失**时，同样一句话让 Agent 重新运行即可恢复。

### 方式二：`dsh plugin add` 安装，永久生效（推荐正式使用）

把主题装成 DSH 的**正式组合插件（bundle）**：浏览器端由 client module system 以 `/plugins/dsh-cyberpunk-theme/client.js` 服务，**刷新不丢、重启不丢**。

1. `git clone https://github.com/ai7603/dsh-cyberpunk-theme`（或直接下载 zip 解压）。仓库已包含构建好的 `lib/index.js` + `lib/client.js`，直接安装即可；只有改过源码才需要 `pnpm install && pnpm build` 重建；
2. 在你的 DSH checkout 里执行：

```sh
pnpm dsh plugin --profile web add /path/to/dsh-cyberpunk-theme
# 或: pnpm dsh plugin --profile <你的 profile> add <本地路径>
```

3. 重启该 web profile（plugin-set 变更按设计需要重启）：

```sh
pnpm dsh web
```

安装命令会识别 package.json 的 `dsh.bundle.patch`，把本包追加到 `dsh.profile.bundles`；其 `cordis.patch.yml` 自动向组合树插入 `id: cyberpunk-2077` / `name: dsh-cyberpunk-theme` 行。验证可用 `pnpm dsh web --dump-config` 看到该行，页面打开后设置里应出现 **Cyberpunk 2077** 分区。

> 💡 **不需要改动 DSH 源码/workspace**：`lib/` 是本包的产物目录，host 端是合法的 no-op loader entry，浏览器端是标准 `dsh.client` bundle。详见「🔩 怎么做到的」。

### 方式三：30 秒快速体验（动态插件，刷新会消失）

想在**不改任何配置**的情况下先看效果？用 DSH 的动态 Cordis 插件：

1. 在 DSH Web 界面发起**创建动态插件**（`cordis_define`，`idPrefix` 如 `cpunk`）。
2. 把下面的 **Host 代码** 粘贴到 host 栏（一个超小的 `ping` 心跳服务）：

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

**验证是否生效：** 设置页里应该出现 **Cyberpunk 2077** 分区（第一项是 **Enable Cyberpunk theme** 总开关）；输入框下方会出现状态条（`LOCAL 时间` / `UPLINK ● 心跳` / `Accent`）；页面四周有流动彩带。

> 💡 **建议暗色模式使用**：设置 → Cyberpunk 2077 → **Night City (Dark)**（或 DSH 自带的外观设置切到暗色）。

### ⚠️ 动态插件 vs 永久安装

| | 方式一 / 方式三（动态插件） | 方式二（永久安装） |
| --- | --- | --- |
| 安装成本 | 一句话 / 复制粘贴一次 | clone + `dsh plugin add` + 重启 |
| 刷新页面 | **主题消失**，需要重新运行 | 一直生效 |
| DSH 重启 | 插件丢失 | 一直生效 |
| 适用 | 快速体验、临时试用 | 正式长期使用 |

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
- 按性能档位挂载：Full 挂载全部；Balanced 只挂载暗角 + **变换动画版流光边框**，网格/扫描线可在设置中按需开启；Eco（默认）只挂载**故障闪烁层**。故障闪烁层全程仅做 `opacity/transform` 合成器动画，每 6 秒做 4 组双闪，平均开销很小，所以三个档位都有。

### ✨ 品牌
- 左上角 **DeepSeek Harness 商标 + 鲸鱼 Logo** 在 Full 档下于四色间流动（8 秒循环）；三档都保留周期性的 RGB 分离故障闪烁，Balanced/Eco 档底色保持静态强调色。
- 新会话空白页的 **探索未至之境 / 预览版** 标题与徽章跟随小鲸鱼品牌色同步，并一起做 RGB 故障闪烁。

### 📊 输入框读数区
- **LLM 统计行**——内置统计行变成一排紧凑单行切角芯片；Full 档颜色**与品牌实时同步**（同一套关键帧），三档都保留周期性芯片故障闪烁；缓存命中率从整数改写为 **2 位小数**（如 `Cache hit 99.13%`）。
- **状态条**——`LOCAL HH:MM:SS` · 日期 · `UPLINK ● ONLINE` 心跳（动态安装：真实 Client→Host ping；永久安装：浏览器连通性 bridge）· 当前强调色；三档都可开启状态条故障闪烁。

### 🧩 细节打磨
- **赛博朋克对角双切角**（左上 + 右下，CP2077 标志性造型）：用户气泡 16px、工具调用组卡片 14px、composer 输入卡片 12px、新会话按钮 10px、代码块 10px——每条切边都带霓虹亮线（1px 描边沿对角线被裁切，切出的斜线自带发光）。
- **侧边栏行**——当前会话常驻霓虹侧轨（`aria-selected`），悬停霓虹染色 + 强调色文字。
- **霓虹光标**与**输入框聚焦辉光**；标题 HUD 字距；代码块终端色竖条；霓虹滚动条与选区。

### ⚙️ 设置页（设置 → Cyberpunk 2077）
- **主题总开关（Enable Cyberpunk theme）**——一键停用整套主题：token 覆盖、氛围层、状态条和全部 CSS 效果都卸载，界面恢复 DSH 原生外观；设置页本身保留，随时可以一键重新开启。关闭时其余选项会禁用置灰。
- 配色方案：**夜之城（暗色）** / 跟随系统 / 亮色。
- 强调色：4 套预设，通过 `theme.overrideTokens` 实时切换。
- **性能档位：Full / Balanced / Eco（默认）**——默认使用最省电的 Eco：不挂载网格/扫描线/暗角/边框，只保留屏幕故障与品牌/统计/状态条故障。流光边框不是用整屏渐变 + `background-position` 动画实现的（那会让浏览器每帧重新光栅化整个视口），而是拆成**四条 2px 细边**，每条边内部只对一个小图层做 `transform` 位移（纯合成器动画，不走主线程重绘）。**Balanced** 开启缓慢流动的霓虹边框 + 暗角，网格/扫描线按需开启，关掉品牌/统计行的连续色彩流动和装饰性滤镜，三档都保留品牌/统计/状态条的间歇故障闪烁；**Full** 启用全部动态效果并自动打开网格/扫描线。
- 特效开关：**网格** / **扫描线** / **屏幕故障** / **状态条故障**。
- 全部尊重 `prefers-reduced-motion`（系统"减弱动态效果"时自动关闭动画）。

---

## 🛠 工作原理

- **Token 层**：`theme.overrideTokens(source, tokens)` 在活动主题之上叠加一层，presenter 把它投影到 `body` 的 CSS 变量上——因此亮/暗两套配色都能被完整覆盖。
- **主题总开关**：`<html data-cp-enabled>` 是全部主题 CSS 的前置条件；关闭开关会移除该属性、dispose token 覆盖，并让氛围层/状态条组件返回 `null`。设置页样式刻意不加这个前缀，所以关掉主题后仍能打开设置页重新开启。
- **流光边框性能**：四边细条方案把每帧需要重绘的像素量从 `宽 × 高` 降到 `2 × (宽 + 高) × 2px`（约两个数量级），并且动画只改 `transform`，交给合成器在 GPU 上处理，主线程不会每帧重新光栅化。
- **故障闪烁性能**：屏幕故障层平时 `opacity: 0`，只在 6 秒周期内做短促的 `opacity/transform` 变化；品牌/统计/状态条的 RGB 撕裂则在各自的 5–8 秒周期内**停留约 0.5–0.7 秒**再恢复。这些都是合成器友好属性，绝大部分时间不做功，所以放在 Balanced/Eco 里仍几乎不增加功耗。
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
  - 缓存命中精度：DSH 渲染前把命中率四舍五入成整数；主题从该组件的 React fiber hook 状态里读取原始 `cacheReadTokens` / `uncachedInputTokens` / `cacheWriteTokens` 三个桶重新计算两位小数。读不到时保留 DSH 原生整数文案。

  这些属性不属于 DSH 公开 API——如果 DSH 改了 DOM 结构，主题会**优雅降级**（不报错，只是局部不生效）。

### 🔩 为什么 `dsh plugin add` 一行即装（方式二原理）

永久安装走 DSH 的**标准 bundle 插件协议**，与内置 web 插件完全同构：

- `dsh.bundle.patch` 声明本包是 bundle；`cordis.patch.yml` 向组合树插入 `id: cyberpunk-2077` / `name: dsh-cyberpunk-theme` 行，`dsh plugin add` 的 reconcile 会把它追加进 profile 的 `dsh.profile.bundles`；
- package 主入口 `lib/index.js` 是合法 host loader entry（`name` + `apply`，纯浏览器主题所以 host 面为 no-op）；
- `dsh.client` + `exports["./client"]` 让 client module system 把 `lib/client.js` 编进启动图，经 `/plugins/dsh-cyberpunk-theme/client.js` 下发。`lib/client.js` 是 tsdown 生成的 closure-factory bundle：`window.__ModuleLoader__.load({ id, factory })`，React 从 loader 平台模块表解析、不重复打包；
- 所以它**刷新不丢、重启不丢**，bundle 内容更新还能走 host 的 HMR 轮询。

动态插件（方式一/三）与永久插件共用同一个 `cyberpunkClientPlugin()` 主题核心，只把三处"动态便利"桥接成 bundle 等价物，配色、CSS、Slot 注册一行不变：

| 动态插件写法 | 永久插件等价写法 |
| --- | --- |
| evaluator 闭包参数 `styles.insert(css)` | `src/client/runtime.js` 的 plugin-owned `<style data-plugin>` sink，经 `globalThis.__DSH_CYBERPUNK_STYLES__` 注入 |
| evaluator 闭包参数 `React` | `src/client.js` 顶部的 `import * as React from 'react'`（打包时 external 到平台模块表） |
| evaluator 闭包参数 `host.call('ping')` / host 面 `harness.handle` | `src/client/runtime.js` 的浏览器连通性 bridge；host 面改为 no-op |

`theme.overrideTokens`、三个 Slot 注册（`shell.overlay`、`conversation.composer.dock`、`settings.section`）、token 名、配色值——**一行都不用改**。

---

## 🎨 自定义

所有调节点都在 [`src/client.js`](./src/client.js)：

- **`ACCENTS`** —— 强调色预设。新增一套：给它 `label` + `brand` / `success` / `error` / `warn` 各一组 `{ light, dark }`。
- **`baseTokens`** —— 与强调色无关的背景/文字/边框 token，每个都是 `{ light, dark }` 一对（DSH 的 13 个 alias token）。
- **`state` / `patch`** —— 内存设置 store：总开关 `enabled`、强调色、性能档位与各特效开关。`patch()` 负责同步 `data-cp-enabled` / `data-cp-perf` 属性与 token 覆盖层。
- **`MAIN_CSS`** —— 所有特效，主题选择器都带 `html[data-cp-enabled]` 前缀（总开关），设置页样式例外。动画时长是 `@keyframes` 里的 `…s infinite` 值（`cp-ribbon-flow-x/y`、`cp-brand`、`cp-glitch`、`cp-stats-glitch`、`cp-status-glitch`、`cp-dot`）；浓度是各处的 alpha / `color-mix` 百分比。

改完代码后，`pnpm build` 重建永久安装产物（`lib/`），`node scripts/build-readme.cjs` 同步 README 里的动态安装代码块。

---

## 📁 项目结构

```
dsh-cyberpunk-theme/
├── lib/
│   ├── index.js            # 构建产物：永久安装的 host entry（no-op loader 插件）
│   ├── client.js           # 构建产物：永久安装的浏览器 bundle（__ModuleLoader__ closure factory）
│   └── client.js.map
├── src/
│   ├── client.js           # 主题核心：token、CSS、氛围层、状态条、设置页 + 总开关（动态/永久共用）
│   ├── host.js             # 动态插件 host 一半：私有 ping RPC（心跳）
│   ├── client/index.js     # 永久安装浏览器端 entry（name/inject/apply）
│   ├── client/runtime.js   # 永久安装桥接：styles.insert + host.call 的 bundle 等价物
│   ├── host-index.js       # 永久安装 host entry（no-op，构建为 lib/index.js）
│   ├── client-plugin.mjs   # 历史兼容入口（动态插件对象形式）
│   ├── host-plugin.mjs     # 历史兼容入口（动态插件对象形式）
│   ├── types.d.ts          # lib/index.js 的类型面
│   └── types.client.d.ts   # lib/client.js 的类型面
├── cordis.patch.yml        # bundle patch：向组合树插入 cyberpunk-2077 行
├── tsdown.config.mjs       # 构建 lib/（host ESM + client CJS closure factory）
├── index.js                # 重新导出两个动态插件工厂
├── scripts/
│   ├── extract-body.cjs    # 从 src/ 提取可直接粘贴的动态插件代码块
│   ├── build-readme.cjs    # 用提取结果生成 README.md（安装代码不漂移）
│   ├── verify-browser.mjs  # 永久安装浏览器冒烟测试
│   ├── smoke-port.patch.yml # 冒烟测试用 scratch 端口 overlay（3092）
│   └── inspect-dom.cjs     # 真实页面 DOM 体检（调试产品锚点用）
├── docs/
│   └── screenshots/  # 暗色/亮色实拍截图
├── package.json        # 含 dsh.bundle + exports["./client"] + dsh.client 声明（标准 bundle 协议）
├── LICENSE           # MIT
└── README.md
```

---

## 📄 许可证

[MIT](./LICENSE) —— 自由使用、修改、分发。
