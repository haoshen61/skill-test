# Wedding Invitation Demo Assets

这是一套给 `wedding-invitation-builder` 比赛演示使用的通用素材样例。运行素材已经去除新人姓名、日期、地址、可识别人像、宾客资料和旧婚礼封面；它们只用于展示需求采集、视觉 brief、相册选择和本地交互流程。

## 目录

| 目录 | 内容 | 典型演示用途 |
| --- | --- | --- |
| `palette/` | 浅米、咖色、粉色、蓝色等色板参考 | 生成设计 brief、解释主色/重点色比例 |
| `references/` | 弥散、纸张、编辑感和作品集风格参考 | 追问视觉偏好、说明构图来源 |
| `typography/` | 字体排版参考截图 | 说明细宋体、Avenir、手写装饰的层级 |
| `cover/` | 无文字的抽象封面、分享卡和源图示例 | 展示首屏与分享卡片的资源边界 |
| `gallery/` | 7 张无人物的纵向抽象相册图 | 演示手机相册、原比例布局和加载状态 |
| `open-candidates/` | 已记录来源的开放许可植物/花卉候选 | 只用于比较外部来源与仓库生成图，不默认进入相册 |
| `music/` | `0902.mp3` | 演示低音量播放、暂停和自动播放兜底 |
| `contact-sheet.jpg` | 抽象素材缩略总览 | 现场快速说明素材关系，不作为运行时资源 |

完整的来源、用途、隐私和许可证说明见同目录的 [`manifest.json`](manifest.json) 与 [`CREDITS.md`](CREDITS.md)。

## 隐私与授权边界

- `cover/`、`gallery/` 和 `palette/palette-cover.jpg` 是为本仓库生成的几何抽象图，不含人物、姓名、日期、地址或二维码。
- `references/` 与 `typography/` 是仅供风格讨论的用户提供或第三方参考图；部分图片可能带有原作者署名、账号、地址或二维码。它们不进入相册，公开发布前仍需确认许可。
- `music/0902.mp3` 只作为本地交互演示音频。公开上线或比赛录屏前，应确认演出/再分发权限，必要时替换为已获授权的短音频。
- `open-candidates/` 中的文件来自 Wikimedia Commons 页面，manifest 记录了原始页面、下载地址和声明的许可；使用前仍应重新打开来源页核对许可、裁切和再分发条件。
- 所有素材都不会进入生产项目的 `runtimeFiles`；本仓库不包含 CloudBase 登录缓存、`.env`、高分辨率原稿或用户上传照片。
- 生成器会扫描并复制支持的素材供本地审阅，但只有确认 brief 中的 `gallery.paths` 才会成为相册。

## 演示建议

1. 先打开 `contact-sheet.jpg`，说明色板、风格参考、字体参考和通用相册素材是不同的输入类别。
2. 用 `palette/color-theme.png` 与 `palette/palette-cover.jpg` 说明“浅米色为底、咖色为结构色，粉/蓝只作局部重点色”。
3. 用 `references/` 与 `typography/` 追问构图、质感和字体层级；明确它们只是参考，不是页面运行素材。
4. 用 `cover/invitation-cover.jpg` 讲封面，用 `cover/share-preview-card.jpg` 讲微信/社交卡片，两者用途不同，不要混用。
5. 用 `gallery/scene-0.jpg` 至 `scene-6.jpg` 演示纵向相册；图片不裁切，手机端按原比例布局。
6. 用 `music/0902.mp3` 演示一次“尝试自动播放 → 浏览器阻止 → 用户点击按钮播放”的完整状态。
7. 如需展示外部来源的素材审查，再打开 `open-candidates/`；不要把它们与默认的抽象相册混用。

这些素材只证明 Skill 的流程和边界，不代表任何真实婚礼事实，也不授予第三方参考图或音乐的公开发布权。
