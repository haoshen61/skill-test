# Wedding Invitation Demo Assets

这是一套给 `wedding-invitation-builder` 比赛演示使用的素材样例。它把本项目中实际用过的色卡、视觉参考、排版参考、封面、婚礼图片和音乐整理成小尺寸副本，方便在没有高分辨率原稿的电脑上复现设计 brief 和演示流程。

## 目录

| 目录 | 内容 | 典型演示用途 |
| --- | --- | --- |
| `palette/` | 浅米、咖色、粉色、蓝色等色板参考 | 生成设计 brief、解释主色/重点色比例 |
| `references/` | 弥散、纸张、编辑感和作品集风格参考 | 追问视觉偏好、说明构图来源 |
| `typography/` | 字体排版参考截图 | 说明细宋体、Avenir、手写装饰的层级 |
| `cover/` | 当前邀请函封面和微信/社交分享卡片 | 展示首屏与分享卡片 invariant |
| `wedding/` | 插画信息页和婚礼照片的优化副本 | 展示手机相册、图片回退和婚礼故事 |
| `music/` | `0902.mp3` | 演示低音量播放、暂停和自动播放兜底 |
| `contact-sheet.jpg` | 上述图片的缩略总览 | 现场快速说明素材关系，不作为运行时资源 |

完整的来源、用途、隐私和许可证说明见同目录的 [`manifest.json`](manifest.json)。

## 重要边界

- 这是用户提供的私人婚礼素材和第三方风格参考的**比赛/本仓库演示包**，不代表获得公开再分发、商业使用或训练授权。
- 婚礼照片和封面可能包含可识别人物；副本已缩放并通过重新编码去除 EXIF/定位信息，但仍应按私人资料处理。
- 音乐的公开发行权未在此文件中确认。演示时使用低音量；公开上线前重新确认授权，必要时替换为有许可的音频。
- `album/` 与 `邀请函包含图片/` 中的高分辨率原稿仍被 `.gitignore` 排除，本包只从 `output/` 里的网页优化版本生成。
- 这些文件不应加入 `scripts/build-cloudflare.js` 的 `runtimeFiles`，也不会自动进入 `dist/cloudflare-pages/`。生产页面只使用它自己的运行时资源和经过授权的用户上传内容。
- `font/` 目录中的 `Avenir.ttc`、`SnellRoundhand.ttc`、`Songti.ttc` 是项目已有字体文件；本包只放排版参考截图，字体的授权范围仍需在公开发布前核实。

## 演示建议

1. 先打开 `contact-sheet.jpg`，让评委看到色板、参考图、字体参考和婚礼图是同一套输入。
2. 用 `palette/color-theme.png` 和 `palette/palette-cover.jpg` 说明“浅米色为底、咖色为结构色，粉/蓝只作局部重点色”。
3. 用 `references/` 和 `typography/` 追问构图、质感和字体层级，再生成 brief。
4. 用 `cover/invitation-cover.jpg` 讲封面，用 `cover/share-preview-card.jpg` 讲微信/社交卡片，两者用途不同，不要混用。
5. 用 `wedding/illustration-0.jpg` 作为代码/插画页首图，用 `photo-1.jpg` 至 `photo-6.jpg` 演示纵向相册；图片不裁切，手机端按原比例布局。
6. 用 `music/0902.mp3` 演示一次“尝试自动播放 → 浏览器阻止 → 用户点击按钮播放”的完整状态。

演示提交数据时请使用合成姓名和后四位，不要把真实宾客信息写入 Git、CSV 或截图。
