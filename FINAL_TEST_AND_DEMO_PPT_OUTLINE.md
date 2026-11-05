# 邀请函制作 Skill 最终测试记录与演示 PPT 草案

## 使用范围

本草案只使用本仓库中的内容：

- `skill/`：待安装、执行和验证的 `wedding-invitation-builder` Skill 与便携生成器。
- `assets/`：需求追问、设计 brief 和本地预览使用的演示素材。
- `EXPECTED_CONVERSATION_FLOW.md`：逐句对话、预期行为和验收边界。

演示只覆盖本地生成和浏览器本地数据；不引入外部素材，不读取密钥，不执行 CloudBase、Cloudflare 或其他生产发布。生成结果可放在临时目录，例如 `/tmp/wedding-invitation-builder-preview`，并在最终测试记录中写明路径。

## 最终通过测试应留下的证据

每次阶段切换都记录“输入、动作、结果、证据路径、待确认项”。最终通过的那一次测试至少应保存：

1. 安装记录：Skill 来源为当前目录 `skill/SKILL.md`，安装方式或显式引用方式，以及安装后可调用的入口。
2. 对话记录：按 `EXPECTED_CONVERSATION_FLOW.md` 的 27 步顺序，记录用户输入、Skill 回答、确认/暂停点和实际结果。
3. `brief.json`：新人、事件、视觉、页面段落、交互和授权状态；未确认事实保持 `null` 或 `pending`。
4. `asset-manifest.json`：素材分类、隐私、许可证、用途和警告；相册只选择 `wedding/` 下的婚礼展示图。
5. 本地生成目录中的 `index.html`、`styles.css`、`app.js`、`admin.html`、`admin.js` 与 `release-record.json`。
6. 测试输出：`npm --prefix skill test` 的通过结果、生成器命令结果和手机/桌面预览检查记录。
7. 阶段成果截图或截图路径：封面、相册分页、音乐按钮、RSVP、管理页、空/失败状态，以及本地 `localStorage` 记录。
8. `release-record.json` 的 pending/skipped 清单：生产发布、云端 RSVP 幂等、分享卡片、通知页、自动播放/压缩等未实现项必须明确列出。

### 通过门槛

以下任一项发生时，测试状态应先记为“未通过”，由主代理修订 Skill/生成流程或向用户确认后再重跑：

- 相册混入色卡、字体参考、第三方风格参考或分享卡片，且没有在记录中解释并人工筛选。
- RSVP 重复提交被追加成两条，却被描述成云端幂等更新。
- 歌手字段被静默丢弃，或未说明当前模板不支持该字段。
- 生成结果含有密钥、签名 URL、生产域名，或把本地管理页描述成已认证后台。
- `release-record.json` 没有明确列出自动播放、压缩/EXIF、分享卡片、通知页和云端发布等未执行事项。

## 27 步对话与阶段映射

| 阶段 | 对话步骤 | 目标 | 阶段成果 |
| --- | --- | --- | --- |
| A. 安装与需求采集 | 1–10 | 让 Skill 一次只追问一个关键事实，形成事件、场地、新人和故事草稿 | 需求采集记录、待确认事实清单 |
| B. 视觉与交互 brief | 11–13 | 将米色纸张、咖色结构、粉蓝重点、城市路径和花瓣等偏好转成设计目标，并区分生成器已支持与待适配能力 | `brief.json` 草稿、能力边界清单 |
| C. 资产授权与发布边界 | 14–18 | 读取 `assets/manifest.json`，确认私人素材和第三方参考的隐私/许可证，明确本次只做本地演示 | `asset-manifest.json`、`publishAuthorized=false`、确认后的 brief |
| D. 生成与静态 QA | 19–20 | 用确认 brief 生成未来邀请函，检查邀请首屏、相册、音乐按钮、加载/空/失败状态与响应式布局 | 生成目录、手机/桌面检查表、问题修订记录 |
| E. 本地交互演示 | 21–25 | 验证 RSVP 新建与本地幂等提示、点歌留言、管理页和数据安全边界 | `localStorage` 记录、管理页截图、未实现项 |
| F. 收口与下一步 | 26–27 | 解释后续云端/域名发布需要重新确认的事项，形成最终交付摘要 | `release-record.json`、最终测试记录、下一步清单 |

## 演示 PPT 建议结构（12 页，16:9）

| 页码 | 标题 | 页面内容 | 阶段证据/当前目录素材 |
| --- | --- | --- | --- |
| 1 | `wedding-invitation-builder` | 一句话说明：从对话和本地素材生成可审阅的移动优先邀请函。副标题写“本地 Skill 安装与最终验收”。 | `assets/cover/invitation-cover.jpg`，浅米背景；只保留标题和日期 |
| 2 | 测试范围与边界 | 说明本次只使用 `skill/`、`assets/`、`EXPECTED_CONVERSATION_FLOW.md`；只做本地预览和 mock 数据；生产发布未授权。 | `README.md`、`EXPECTED_CONVERSATION_FLOW.md` 的范围说明 |
| 3 | Skill 安装与入口 | 展示 Skill 入口 `skill/SKILL.md`、便携命令和安装后输出契约；说明生成器不修改源素材。 | `skill/SKILL.md`、`skill/references/portable-runtime.md` |
| 4 | 对话采集：从事件到故事 | 用时间线概括步骤 1–10：2027-05-16、东八区、午宴、杭州云栖里酒店、沐宸与若汐、关系主线。强调每项事实都由用户确认。 | `EXPECTED_CONVERSATION_FLOW.md`；可配 `assets/references/` 风格参考 |
| 5 | 视觉 brief：城市结构与植物感受 | 展示浅米、咖色、少量粉蓝、纸张颗粒、地图线条、圆形弥散；说明城市规划与花艺线索如何进入 brief。 | `assets/palette/color-theme.png`、`assets/palette/palette-cover.jpg`、`assets/typography/` |
| 6 | 资产扫描与授权 | 解释色卡/参考图/婚礼图/音乐的分类；婚礼图片用于相册，参考图不进入轮播；所有项先保持 pending，公开授权未被推断。 | `assets/manifest.json`、`assets/README.md`、`assets/contact-sheet.jpg` |
| 7 | 生成结果：未来邀请函首屏 | 展示“婚礼邀请函”、已确认婚礼信息和相册；说明普通邀请函不默认进入回顾页，加载状态不会闪现默认头像。显式 recap 模式另有单独测试。 | 生成目录 `index.html`；`assets/cover/invitation-cover.jpg` |
| 8 | 生成结果：手机与桌面布局 | 并列展示窄屏单列和桌面基本可用性；检查文字不溢出、图片按原比例、键盘焦点和 reduced-motion。 | 生成目录 `styles.css`、手机/桌面截图 |
| 9 | 本地交互：RSVP、点歌和音乐 | 展示林一/2468/2 位成人的 mock RSVP，再更新为 3 位；展示《晚风写信》留言和手动音乐按钮。明确数据只写浏览器 `localStorage`。 | `app.js`、`admin.js`、本地预览截图；`assets/music/0902.mp3` |
| 10 | 管理页与异常状态 | 展示只读本地管理页、空相册、图片失败、自动播放被浏览器阻止等状态；说明生产管理员认证、云端幂等和自动播放策略尚未实现。 | `admin.html`、`admin.js`、浏览器检查记录 |
| 11 | 测试结果与阶段成果 | 给出 `npm --prefix skill test` 的 15 项通过结果；列出生成命令、输出文件和手机/桌面检查结果。用一张表对应 A–F 阶段与证据路径。 | 终端输出、`brief.json`、`asset-manifest.json`、`release-record.json` |
| 12 | 交付清单与下一步 | 明确当前交付是本地预览和记录；生产前需重新确认域名、后端、迁移、隐私/版权和发布授权。列出 pending/skipped 项，不把未实现能力写成已完成。 | `release-record.json`、最终测试记录；浅米色收尾页 |

## PPT 文案与视觉约束

- 页面底色以浅米色为主，咖色承担标题和结构线，粉色/蓝色只做局部强调；保持当前邀请函的柔和纸张质感。
- 每页只保留一个核心信息，标题用直接的名词短语，例如“资产扫描与授权”“本地交互”，避免口号式标题。
- 优先使用当前目录的原始截图或素材；不下载外部图片，不为装饰绘制新的程序化图形。
- 文字保持可编辑，正文建议至少 17pt，标题至少 32pt，封面标题至少 42pt。
- 不在 PPT 中展示真实宾客资料、密钥、签名 URL、生产域名或未授权音乐的公开发布结论。

## 最终测试记录模板

将本模板复制为 `FINAL_TEST_RECORD.md`，在最后一次通过测试时逐项填入真实结果：

```md
# 最终通过测试记录

## 测试元数据

- 日期：
- 工作目录：仓库根目录
- Skill 来源：`skill/SKILL.md`
- 素材来源：`assets/`
- 生产发布授权：否
- 预览输出：

## 阶段记录

### A. 安装与需求采集

- 输入：
- Skill 行为：
- 阶段成果：
- 证据路径：
- 待确认项：

### B. 视觉与交互 brief

- 输入：
- Skill 行为：
- 阶段成果：
- 证据路径：
- 待实现项：

### C. 资产授权与发布边界

- 输入：
- Skill 行为：
- 阶段成果：
- 证据路径：
- 许可证/隐私警告：

### D. 生成与静态 QA

- 生成命令：
- 输出文件：
- 手机检查：
- 桌面检查：
- 修订与复测：

### E. 本地交互演示

- RSVP 新建结果：
- RSVP 重复提交结果：
- 点歌留言结果：
- 音乐按钮/自动播放结果：
- 管理页结果：

### F. 收口与发布边界

- `npm --prefix skill test`：
- 未执行的生产检查：
- `release-record.json` pending/skipped：
- 最终结论：通过 / 未通过

## 阶段成果索引

| 阶段 | 文件或截图 | 结果 |
| --- | --- | --- |
| A |  |  |
| B |  |  |
| C |  |  |
| D |  |  |
| E |  |  |
| F |  |  |
```
