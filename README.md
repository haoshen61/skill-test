# Wedding Invitation Builder Skill Test

这是一个可独立测试和演示的 `wedding-invitation-builder` Skill 仓库。它专门验证“从新对话和用户素材开始制作未来婚礼邀请函”的完整流程，不包含原婚礼项目源码、生产配置或云端凭据。

## 仓库内容

```text
skill/                         可安装 Skill、便携生成器、模板和测试
assets/                        通用抽象色卡、参考图、相册图和音乐
demo/                          已确认 brief、本地演示脚本和 JSON QA 证据
docs/                          Skill 设计、演示 runbook 和用户流程
EXPECTED_CONVERSATION_FLOW.md 新对话逐句输入与预期结果
USAGE_GUIDE.md                 安装、生成和本地验收说明
FINAL_TEST_RECORD.md            最近一次本地验收记录
FINAL_TEST_AND_DEMO_PPT_OUTLINE.md 比赛汇报提纲
```

素材是比赛演示样例，不代表人物隐私、字体、第三方参考图或音乐获得公开再分发授权。生产项目的照片、密钥、CloudBase 登录缓存、`.env`、高分辨率原稿和云函数不在本仓库。

本次清理已从当前版本移除原婚礼封面、相册、拼贴图和旧 QA 截图，并改用通用抽象素材；为遵守不强制推送的仓库规则，未重写已有 Git 历史，旧提交中的二进制仍可能可见。如需从 Git 历史彻底撤回旧素材，应另行评估并明确授权历史迁移。

## 默认行为

Skill 默认制作**未来婚礼邀请函**，不是婚礼回顾页。页面先展示邀请标题和已确认的婚礼信息；只有用户明确要求“婚礼回顾/感谢页/已结束婚礼”并在 brief 中设置 `mode: "recap"` 或 `mode: "retrospective"` 时，才启用回顾首屏。

Skill 必须按以下阶段执行，不能跳过需求采集直接改代码：

1. 判断未来邀请函或明确的回顾模式。
2. 一次只追问一个关键事实。
3. 写出包含待确认项的 brief 草稿。
4. 展示素材清单并确认处理/展示权限。
5. 回显完整 brief，等待用户明确“确认/按这个生成”。
6. 生成本地静态邀请函。
7. 做手机和桌面 QA，并记录证据。
8. 单独处理 Git 同步、后端变更和生产发布授权。

未确认 brief 时只能生成草稿预览，不能宣称最终交付；没有生产授权时 `publish` 必须保持 `false`。

## 快速测试

在仓库根目录运行：

```bash
npm --prefix skill test
node skill/scripts/create-invitation.js \
  --assets assets \
  --brief demo/confirmed-brief.json \
  --out /tmp/wedding-invitation-builder-preview
```

生成目录包含 `brief.json`、`asset-manifest.json`、`release-record.json`、静态页面和本地演示管理页。素材源目录不会被修改。将生成目录通过任意静态 HTTP 服务器打开，在 390×844 和桌面视口检查布局、相册加载/空/失败状态、键盘焦点、音乐按钮和本地 RSVP 更新。

## 新对话演示

将本仓库作为唯一工作目录开启新对话，显式读取 `skill/SKILL.md`，并把 `assets/` 作为用户素材目录。按 [EXPECTED_CONVERSATION_FLOW.md](EXPECTED_CONVERSATION_FLOW.md) 逐句演示：Skill 会先追问日期、场地、新人、故事、设计、互动、素材权限和发布范围，然后停在 brief 确认门。

完整的比赛演示节奏见 [docs/WEDDING_INVITATION_SKILL_DEMO.md](docs/WEDDING_INVITATION_SKILL_DEMO.md)。

`demo/build-demo-deck.mjs` 是可选的 PPTX 生成脚本。它不属于 Skill 运行时，也不携带任何本机路径；只有在演示环境提供 `WEDDING_DEMO_ARTIFACT_TOOL`、`WEDDING_DEMO_PRESENTATION_UTILS`、`WEDDING_DEMO_PYTHON`、`WEDDING_DEMO_INTEGRITY_VALIDATOR` 和 `WEDDING_DEMO_LAYOUT_VALIDATOR` 路径时才运行。

## 部署边界

本仓库只做本地生成和本地数据演示。RSVP/点歌使用浏览器 `localStorage`，管理页没有生产认证；自动播放、分享卡片、通知页、CloudBase/Cloudflare、生产图片处理和真实多用户幂等都必须在实际项目中重新确认并适配。Git 推送不等于生产发布，Skill 不会从素材或登录状态推断部署授权。

## 维护约定

改动 Skill 时同步更新 `skill/`、相关测试、流程文档和验收记录；先运行 `npm --prefix skill test`，再提交并推送 `main`。不要把生产项目中的私人素材、密钥或部署缓存复制到这里。
