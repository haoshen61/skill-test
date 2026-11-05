# wedding invitation builder 使用说明

这份说明面向只提供照片、参考图和音乐素材的新对话。Skill 会先收集确认事实，再生成可审阅的本地邀请函；它不会从文件名猜测私人信息，也不会自动上线。

## 1 安装或显式引用

本仓库没有独立安装脚本。打开新对话时使用下面任一方式：

- 显式读取 `skill/SKILL.md`。
- 将 `skill/` 复制到 harness 的本地 Skill 目录，并调用 `wedding-invitation-builder`。

本次验收只使用当前目录内容，没有从网络下载或调用全局 Skill。便携入口是：

```text
node skill/scripts/create-invitation.js --assets assets --out /tmp/wedding-invitation-builder-preview
```

确认 brief 后再加上 `--brief demo/confirmed-brief.json`。输出目录应放在工作区外的临时路径，源素材目录保持不变。

## 2 对话采集顺序

按 `EXPECTED_CONVERSATION_FLOW.md` 逐轮询问，不要一次要求用户填完所有字段：

1. 日期、时区、婚礼形式、签到时间和仪式时间。
2. 场地短名、厅室、完整地址和确认状态。
3. 新人姓名、职业、MBTI 或其他希望展示的身份线索。
4. 相遇时间、关系转折、故事弧线和想保留的句子。
5. 主色、重点色比例、质感、构图、字体和动效目标。
6. 相册、背景音乐、RSVP、以及希望宾客留下的个性化信息（祝福、忌口、交通或可选点歌）和管理页需求。
7. 素材是否允许本地演示、压缩、去除 EXIF、第三方或 AI 处理。
8. Git、后端、域名和本次是否授权生产发布。

在用户确认 brief 前不要生成页面。地址、时间、授权或发布目标发生冲突时先暂停并列出冲突。

## 3 素材清单与相册选择

Skill 会扫描支持的图片和音频，并跳过隐藏文件、`.env*`、`.git`、CloudBase 缓存和不支持的格式。若素材目录包含 `manifest.json`，对应的角色、隐私、许可证、用途和备注会进入 `asset-manifest.json`。

混合素材目录必须在确认 brief 中显式写出 `gallery.paths`。本案例选择：

```json
[
  "gallery/scene-0.jpg",
  "gallery/scene-1.jpg",
  "gallery/scene-2.jpg",
  "gallery/scene-3.jpg",
  "gallery/scene-4.jpg",
  "gallery/scene-5.jpg",
  "gallery/scene-6.jpg"
]
```

色卡、风格参考、字体参考、封面、分享卡片和 contact sheet 可以复制到本地预览目录供审阅，但不能因为文件是图片就自动进入相册。所有素材的公开隐私和许可证仍需单独确认。

## 4 生成结果

标准输出包含：

- `brief.json`：确认事实、设计目标、交互合同和授权状态。
- `asset-manifest.json`：素材分类、字节数、隐私、许可证、用途和警告。
- `release-record.json`：本地生成证据、发布状态、pending 和 rollback 字段。
- `index.html`、`styles.css`、`app.js`：未来邀请函首屏、新人 Profile、婚礼主题、相册、婚礼信息、音乐按钮和 brief 配置的本地表单；显式 `mode: "recap"` 时才启用回顾入口。
- `admin.html`、`admin.js`：当前浏览器 localStorage 的只读查看与导出。

默认视觉合同是“婚礼邀请函”首屏、已确认婚礼信息、新人 Profile、婚礼主题、分页相册、RSVP 和 brief 配置的宾客互动。背景音乐由 `interaction.backgroundMusic` 单独控制；点歌只有在 `interaction.musicRequest` 或 `guestContributions` 中明确配置时才出现。加载、空列表和图片失败状态分开处理；手机端使用单列布局，按钮有可见焦点并支持 reduced-motion。只有 brief 明确设置 `mode: "recap"` 或 `mode: "retrospective"` 时，才展示“婚礼已圆满落幕”和“继续查看电子请柬”。

## 5 本地 RSVP 与宾客互动

把 RSVP 的身份键定义为姓名和手机号后四位。首次提交会保存一条记录；相同身份再次提交会更新原记录。这个行为只在浏览器 localStorage 内成立，不能代替生产数据库的认证、并发控制和幂等接口。

除 RSVP 外，表单字段由 `interaction.guestContributions` 决定。可以配置署名/祝福、忌口、交通需求、合影意愿或点歌；没有配置点歌时，页面不得自行出现歌曲字段。点歌 shorthand 的歌手留空时记录空字符串，不应静默丢弃字段。

管理页没有登录和认证，只能演示当前浏览器的数据。不要把它描述成生产后台，也不要把 localStorage 记录上传到云端。

## 6 本地验收

从 skill 目录运行：

```text
npm test
```

再使用静态 HTTP 服务器打开生成目录，检查：

- 手机 390×844 与桌面 1440×900 的首屏和文字溢出。
- 相册 loading、ready、empty、failed 状态，以及左右按钮和键盘方向键。
- 默认邀请函首屏显示标题和婚礼信息；回顾模式下检查“继续查看电子请柬”后的邀请函显示和标题焦点。
- 手动音乐按钮和浏览器阻止播放提示。
- RSVP 2 位成人后改为 3 位，记录数量仍为 1。
- 每个 `guestContributions` 表单的必填校验、localStorage 记录和管理页展示；点歌只在明确配置时验收。

最终验收摘要见 `FINAL_TEST_RECORD.md`；演示证据以 JSON 状态记录和生成目录为主，`demo/evidence/` 中不再保存旧婚礼截图。

## 7 发布边界

本地测试通过不代表生产发布完成。当前 release record 必须保持 `publish=false`，并列出：

- 生产 RSVP 认证、云端存储、并发幂等和 CSV 导出。
- 自动播放、低音量和跨浏览器手势策略。
- 分享卡片、`/notice/` 页面、CloudBase/Cloudflare 构建与部署。
- 地图路径/花瓣动效和 `times`、`mapUrl`、身份标签的页面渲染。
- 生产级 EXIF、压缩和图片尺寸流水线。

以后确需发布时，应在独立对话重新确认环境、密钥、数据库迁移、域名、隐私/版权和明确的生产授权。
