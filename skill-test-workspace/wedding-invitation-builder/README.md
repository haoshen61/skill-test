# Wedding Invitation Builder：新对话测试夹具

这是一个与现有婚礼邀请函源码隔离的测试目录。打开本目录开启新对话时，只把下面三类内容提供给 Skill：

- `skill/`：当前仓库 `main` 上的完整 `wedding-invitation-builder` 可安装包。
- `assets/`：用于需求追问、设计 brief 和本地预览的缩小素材副本。
- `EXPECTED_CONVERSATION_FLOW.md`：逐句用户输入、Skill 预期行为和验收结果。

本夹具不包含邀请函源码、CloudBase 云函数、生产配置、`.env`、登录缓存、`node_modules` 或真实宾客数据。素材只用于本地和比赛演示，不代表获得公开发布、商业使用或音乐公开播放授权。

## 在新对话中使用

1. 将本目录作为新对话的唯一工作目录打开，不要把父仓库作为工作目录。
2. 安装或显式引用 `skill/SKILL.md`。如果使用支持本地 Skill 的 harness，可将 `skill/` 复制到其 Skill 目录；也可以让 agent 直接读取该文件。
3. 把 `assets/` 作为用户素材目录。先发送 `EXPECTED_CONVERSATION_FLOW.md` 第 1 步的输入，让 agent 按顺序追问，不要直接提供既定答案以外的私人信息。
4. 本地生成结果放到工作区外的临时目录，例如：

   ```text
   /tmp/wedding-invitation-builder-preview
   ```

   这样测试结束后，本目录仍只保留 Skill、素材和流程文档。生成器的标准入口见 `skill/references/portable-runtime.md`。
5. 只做本地预览和本地 mock RSVP/点歌演示。流程中的“云开发、域名和生产发布”问题用于验证 Skill 的授权边界，本次夹具不授权上线。

## 预期结果

新对话完成后，应至少得到：

- 一份经过用户确认或明确标记待确认项的 `brief.json`；
- 一份包含隐私/许可状态的 `asset-manifest.json`；
- 手机优先的静态预览，以及仅保存在浏览器 `localStorage` 的 RSVP、点歌和本地管理页演示；
- 一份没有密钥、签名 URL 或生产部署声明的 `release-record.json`；
- 对音乐按钮与浏览器自动播放策略、空/失败图片、重复登记和未授权素材的可解释处理；便携生成器尚未实现的能力必须列入待办，不能宣称已完成。

## 便携生成器的边界

本夹具验证的是 Skill 的需求采集、资产安全和本地生成闭环，不是现有生产邀请函的复制品。当前标准库生成器会渲染确认的新人姓名、故事、日期、形式、场地、地址、图片相册、音乐按钮和浏览器本地表单；以下内容仍需要后续实现或 provider adapter：

- 地图路径/花瓣等专属动效，以及完整的颜色、字体和布局 tokens 到 CSS 的自动翻译；
- `event.times`、`mapUrl`、MBTI/职业等身份标签目前只进入 brief，不会自动渲染成页面信息；
- 当前扫描器会把所有支持的图片复制到 gallery；色卡、字体/风格参考和分享卡片不会自动从轮播中排除。演示前必须人工选择婚礼展示图，不能把默认全量轮播当作已完成的相册筛选；
- 真实的自动播放尝试、低音量策略和跨浏览器手势兜底；
- 生产级 RSVP 幂等、认证管理、CSV 导出和云端数据库；本地 `localStorage` 只是演示存储；
- 分享卡片元数据、`/notice/` 页面、CloudBase/Cloudflare 发布命令和真实部署验收；
- EXIF 清理、压缩和尺寸限制。生成器不会把本地预览误称为生产发布。

新对话遇到这些需求时，应把它们写进 brief 或最终交付摘要的 pending/skipped 清单，并说明下一步；只有生成器或 provider adapter 明确支持相应字段时，才把它们写入 `release-record.json`，不能静默忽略或虚构记录。

Skill 自带测试可在本目录运行：

```text
npm --prefix skill test
```

测试夹具的基准 Skill 来源提交为 `012ee40cd6da7bf1a15c645fdf63a7d88f44a5c5`。若远程 `main` 更新，应重新从最新提交制作一份夹具，不要在此目录内悄悄改写 Skill 包。
