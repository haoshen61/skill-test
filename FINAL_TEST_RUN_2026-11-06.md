# 邀请函制作 Skill 测试记录

日期：2026-11-05
Skill 来源：`skill/SKILL.md`（GitHub 仓库 `haoshen61/skill-test`，本地显式引用）
测试范围：本地生成、浏览器 localStorage 演示、手机/桌面静态 QA；生产发布未授权。

## 27 步输入与结果

| 步骤 | 输入 | 结果 |
|---:|---|---|
| 1 | 已安装 wedding-invitation-builder，请先采集需求，不改代码、不上线 | Skill 进入单问题采集流程 |
| 2 | Skill 询问日期、时区、形式、签到和仪式时间 | 建立 EventDetails 字段 |
| 3 | 2027-05-16，东八区，午宴，签到 11:00，仪式 11:28 | 日期和时间回显，继续问场地 |
| 4 | Skill 询问场地短名、厅室、地址和确认状态 | 场地字段分离 |
| 5 | 杭州云栖里酒店、云锦厅、浙江省杭州市西湖区云栖路 88 号，虚构演示 | 场地标记已确认 |
| 6 | Skill 询问新人姓名及职业、MBTI 或身份线索 | 建立 CoupleProfile |
| 7 | 沐宸 INTJ 城市规划师；若汐 ESFP 花艺师 | 提炼城市结构与植物感受两条设计线索 |
| 8 | Skill 询问相遇、转折和保留句子 | 建立故事弧线字段 |
| 9 | 2022 年秋相遇，从朋友成为爱人；“一个人规划远方，一个人照料当下” | 形成暂定文案，未确认事实保持待确认 |
| 10 | Skill 询问主色、质感、构图、字体和动效 | 进入 DesignBrief |
| 11 | 浅米、咖色、少量粉蓝、纸张颗粒、地图线条、圆形弥散、细宋体、Avenir | 转成颜色、字体、布局 tokens |
| 12 | Skill 询问路径动效、植物、相册、音乐、RSVP、点歌和管理页 | 区分 brief 目标与便携生成器能力 |
| 13 | 需要城市路径和花瓣动效、纵向相册、低音量音乐、宾客登记、点歌留言和管理页 | 记录 RSVP 合同；生产幂等标为待适配 |
| 14 | Skill 询问素材压缩、调色、裁切、比赛演示和第三方/AI 处理权限 | 进入资产授权阶段 |
| 15 | assets 可用于本地和比赛演示，可压缩和去 EXIF，不默认公开；音乐仅演示 | 生成带隐私/许可证标签的素材清单 |
| 16 | Skill 询问 Git、后端、域名及生产发布授权 | 分离本地预览、同步和发布 |
| 17 | 有 Git 远程，本次仅本地演示；后端 localStorage，不上传 CloudBase，不发布 Cloudflare | `publish=false` |
| 18 | Skill 回显完整 brief 并等待确认 | 生成暂停在确认门 |
| 19 | 确认，生成手机端页面并保留桌面可用性 | 生成 8 个输出文件，未执行生产发布 |
| 20 | Skill 要求检查封面、相册、音乐、加载/空/失败状态和溢出 | 静态 QA 清单建立；源素材未修改 |
| 21 | RSVP：林一，2468，2 位成人 | 本地 mock 记录创建 |
| 22 | 相同身份改为 3 位成人 | localStorage 更新原记录，明确不等同生产云端幂等 |
| 23 | 点歌：林一，《晚风写信》，不填歌手 | 可选歌手保持空值，不静默丢弃 |
| 24 | Skill 运行测试并生成预览 | 15/15 测试通过；预览目录生成 |
| 25 | 检查 manifest、brief、release record | 相册仅使用 gallery/scene-0..6；pending/skipped 项完整 |
| 26 | 询问提供 CloudBase 和域名后的下一步 | Skill 要求重新确认环境、密钥、迁移、域名和授权 |
| 27 | Skill 输出交付摘要 | 本地邀请函、管理页、记录和发布边界完成 |

## 实际测试结果

- `npm --prefix skill test`：15/15 通过。
- 生成命令：`node skill/scripts/create-invitation.js --assets assets --brief demo/confirmed-brief.json --out /tmp/wedding-invitation-builder-preview`
- 生成文件：`index.html`、`styles.css`、`app.js`、`admin.html`、`admin.js`、`brief.json`、`asset-manifest.json`、`release-record.json`。
- 手机 QA：390×844 单列布局、按钮焦点、相册 loading/ready/empty/failed 状态、reduced-motion 规则均有实现记录。
- 桌面 QA：桌面布局和文字溢出规则已检查；未发现生成器测试中的布局错误。
- 发布边界：`publish=false`；云端 RSVP、认证后台、分享卡片、通知页、自动播放策略和生产 EXIF/压缩流水线列为 pending。

## 职业隐喻与视觉选择复验

本轮将主题视觉从关键词列表扩展为 Profile/主题共同驱动的路线、节点和花瓣视觉，并新增 `visual-preferences.html` 作为无明确颜色时的外观选择入口。

- 页面可见“城市规划师 × 花艺师”、城市网格、路径、植物弧线和花瓣节点；未使用与职业无关的代码窗口。
- 视觉偏好板提供“纸张路径、苔痕花期、墨色兰影、暮色花园”四张带色块和微型构图的卡片。选中“苔痕花期”后，状态显示已选择，`localStorage` 保存 `id`、颜色和 motif，可复制 JSON 回填 brief。
- 390×844 邀请函、390×844 视觉偏好板、1440×900 邀请函的 `scrollWidth` 分别为 390、390、1440；无横向溢出。曾发现并修复手机网格项的最小内容宽度问题。
- `prefers-reduced-motion` 下路径与花瓣动画均为 `none`；页面控制台无错误/警告。
- `npm --prefix skill test`：25/25 通过；生成器与生成脚本语法检查通过；已确认的 visualPreference 色值会驱动主题视觉；生产发布仍未授权。

## 2026-11-06 个性化修复复验

测试记录中的三个缺陷已复现并修复：

1. 删除宾客页面中的本地入口/生产配置内部提示，交付边界转移到 `release-record.json`、管理演示和文档。
2. 生成器新增新人 Profile 和婚礼主题区块，渲染职业、MBTI、故事句子、主题描述和视觉 tokens。
3. `interaction.guestContributions` 支持按 brief 生成个性化宾客表单；本轮使用祝福留言，未配置点歌，因此页面不出现歌曲或歌手字段。背景音乐使用 `backgroundMusic`，旧版点歌仅在显式提供 `musicRequest` 时兼容。

验证：`npm --prefix skill test` 18/18 通过；生成输出的 `app.js`、`admin.js` 通过 Node 语法检查；Chrome 无界面模式在 390×844 和 1440×900 检查通过，`publish=false` 保持不变。背景音乐开关与宾客点歌字段已分离。

## 2026-11-06 审查加固复验

- 视觉偏好板的 `localStorage` 键按生成目录隔离；损坏的 JSON、读取/写入异常不会让选择或复制流程崩溃，已确认 brief 选择优先于旧状态，未确认候选保持未选。
- 宾客贡献 ID 与存储键已做唯一性和命名空间校验，避开 RSVP、视觉偏好和对象原型键；管理演示使用 null-prototype map。
- 缺少 Profile 与主题事实时只显示待确认的抽象预览；有职业线索时由职业模式驱动不同 SVG 路径几何。
- 当前完整测试：`npm --prefix skill test` 25/25 通过；未执行生产发布。
