# Wedding Invitation Builder：最终本地验收记录

## 测试元数据

- 日期：2026-11-05
- 工作目录：`skill-test` 仓库根目录
- Skill 来源：`skill/SKILL.md`
- 素材来源：`assets/`
- 预览命令：`node skill/scripts/create-invitation.js --assets assets --brief demo/confirmed-brief.json --out /tmp/wedding-invitation-builder-preview`
- 生产发布授权：否

## 通过结果

`npm --prefix skill test`：15/15 通过。

迁移完成后的原婚礼项目完整测试为 70/70 通过；本仓库不依赖那个生产项目，也不把它的源码或凭据复制进来。

## 行为验收

### 默认模式

- 没有提供 `mode` 时，生成的 `brief.json` 使用 `mode: "invitation"`。
- 页面首屏展示“婚礼邀请函”和邀请文案，不展示“婚礼已圆满落幕”或“Wedding memories”。
- `sections` 默认是 `cover`、`story`、`details`、`rsvp`、`music`、`thanks`。
- “继续查看电子请柬”按钮在普通邀请模式下隐藏，邀请信息直接可见。
- 只有显式 `mode: "recap"` 或 `mode: "retrospective"` 才进入回顾首屏和邀请 reveal。

### 工作流阶段门

`skill/tests/workflow.test.js` 检查以下顺序和关键门：

1. 判断未来邀请函或明确的回顾模式。
2. 一次只追问一个关键事实。
3. 形成包含 pending 项的 brief 草稿。
4. 扫描素材并确认隐私、许可证和处理权限。
5. 回显 brief，等待用户明确确认。
6. 只在确认后生成本地邀请函。
7. 记录手机和桌面 QA。
8. 单独处理 Git、后端和生产发布授权。

未确认时 `workflow.briefConfirmed` 不得设为 `true`；只做 demo 时 `workflow.releaseAuthorized` 和 `authorization.publish` 保持 `false`。

### 资产与相册

- `assets/manifest.json` 的角色、隐私、许可证、用途和备注被保留到输出 `asset-manifest.json`。
- `demo/confirmed-brief.json` 手动选择 7 个 `gallery/scene-0..6.jpg` 通用抽象素材作为相册。
- 色卡、视觉参考、字体参考、封面和分享卡片仍会列入素材清单供审阅，但不会因为是图片就自动进入轮播。
- `.env*`、`.git`、`.cloudbase`、`.tcb`、隐藏文件和不支持格式不会被复制。

### 本地交互

- RSVP 只包含姓名、手机号后四位和出席大人人数，不提供缺席选项。
- 相同姓名与手机号后四位再次提交时，本地 `localStorage` 更新原记录；这不是生产数据库幂等的证明。
- 点歌留言保留可选歌手字段，歌手为空时不会被静默删除。
- `admin.html` 只读当前浏览器的演示数据，没有认证、云端存储或生产 CSV 能力。

### 静态页面与 QA

生成目录应包含：

```text
index.html  styles.css  app.js
admin.html  admin.js
visual-preferences.html
brief.json  asset-manifest.json  release-record.json
```

验收重点：

- 390×844 手机视口和一个桌面视口没有横向溢出或文字重叠。
- 相册的 loading、ready、empty、failed 状态分开处理；loading 阶段不闪现任何真实人物或私人照片。
- 键盘左右方向键、可见焦点和 `prefers-reduced-motion` 可用。
- 音乐以点击按钮为可靠入口；自动播放和低音量跨浏览器行为仍列为 pending。
- 生成器不修改 `assets/` 源目录。

## 未执行与待适配

以下内容在本地 Skill 验收中明确保持未执行，不能从本次结果推断已完成：

- CloudBase 数据库、云函数、认证后台、真实多用户 RSVP 幂等和 CSV 导出。
- Cloudflare/Pages/Workers 构建、域名配置、上传和线上验收。
- 分享卡片元数据、通知页和微信缓存验证。
- 路径/花瓣等专属动效、复杂字体授权和生产图片 EXIF/压缩流水线。
- 音乐自动播放、低音量和跨浏览器策略。

生产前必须重新确认环境、密钥位置、域名、素材隐私/版权和明确的发布授权。Skill 不会把 Git push、生成目录或登录状态当成生产发布证据。

## 2026-11-06 本轮提交

本轮在独立测试工作区完成了 27 步输入与结果记录，并生成演示 PPT。逐步记录见 `FINAL_TEST_RUN_2026-11-06.md`，演示文件见 `demo/ppt-output/invitation-skill-demo.pptx`，本轮 JSON 和测试输出见 `demo/evidence/test-run-2026-11-06/`。

本轮 `npm --prefix skill test`：15/15 通过。生产发布仍保持未授权，`release-record.json` 中的云端 RSVP、分享卡片、通知页、自动播放和生产图片流水线继续列为 pending。

## 2026-11-06 个性化修复复验

针对测试记录暴露的三个问题完成修复：

- 生成的宾客页面不再出现“这是一个可运行的本地入口；RSVP、点歌和生产发布仍需单独确认和配置。”等内部交付提示；能力边界保留在发布记录、管理演示和文档中。
- brief 中确认的新人职业/MBTI/身份线索、故事句子和 `design.theme` 会渲染到 Profile 与婚礼主题区块，不再只写进 JSON。
- 新增 `interaction.guestContributions` 通用表单契约；演示使用“给新人写一句话”祝福，点歌仅在 brief 明确配置时出现。RSVP 的本地身份更新保持不变。

验证结果：

- `npm --prefix skill test`：18/18 通过。
- 生成器输出通过 `node --check`；`publish=false` 保持不变。
- 使用 Chrome 无界面模式检查 390×844 与 1440×900：新人 Profile、婚礼主题和祝福表单可见，无横向溢出；页面不含上述内部提示、歌曲或歌手字段。
- 生产发布、云端 RSVP、认证管理后台、CloudBase/Cloudflare 和音乐版权仍未授权、未执行。
- 背景音乐使用 `interaction.backgroundMusic` 单独控制；点歌只有在 `interaction.musicRequest` 或 `guestContributions` 中明确配置时出现。

## 2026-11-06 职业隐喻视觉与视觉偏好板

针对“婚礼主题只有关键词、视觉没有结合 Profile”和“没有明确颜色时只能用文字描述”的反馈，Skill 增加了两条可验收能力：

- `index.html` 的主题区根据 Profile 职业线索和 `design.theme.motifs` 渲染路线、网格、节点、枝叶/花瓣的 SVG/CSS 视觉；演示 brief 使用“城市规划师 × 花艺师”，页面可见“城市路径与花瓣”，不再使用与当前职业无关的代码窗口。
- 生成目录新增 `visual-preferences.html`，提供四张色块与微型构图卡片。选择会写入浏览器 `localStorage`，可复制为 `design.visualPreference` JSON；未选时保持 brief 的 `null`/`pending`，不从文件名猜测颜色。

验证结果：

- `npm --prefix skill test`：25/25 通过。
- `node --check`：生成器、生成的 `app.js` 和 `admin.js` 均通过。
- Chrome CDP（Browser 插件不可用，Playwright 包也不可用，因此使用本机 Chrome 的 CDP 作为临时浏览器路径）：`390×844` 与 `1440×900` 的邀请函页面和 `390×844` 的视觉偏好板均无横向溢出；Profile、主题视觉、四张选择卡片可见；选择“苔痕花期”后状态文字与当前生成目录专用的 `weddingInvitation.visualPreference.<scope>` 键同步。
- 在 `prefers-reduced-motion: reduce` 下，路径和花瓣动画计算样式为 `none`；控制台无警告或异常。
- 已确认的 `design.visualPreference.colors` 会优先驱动主题视觉；选择 `moss-bloom` 后生成的 CSS 变量为 `#e8e5d9` / `#425246`，视觉选择不再停留在 localStorage。
- `publish=false` 保持不变；CloudBase、Cloudflare、生产 RSVP、版权和生产图片流水线仍未执行。

## 2026-11-06 审查加固复验

- 视觉偏好板使用生成目录专用的存储键；损坏的 JSON、被浏览器拒绝的读取或写入不会阻断卡片选择和 JSON 复制；已确认 brief 的选择优先于旧的本地状态，未确认的 brief 候选不会被标成已选。
- 宾客贡献 ID 会避开 `__proto__`、`constructor` 等对象原型键；贡献存储键强制使用 `weddingInvitation.` 命名空间、彼此唯一，并避开 RSVP 记录键和视觉偏好键空间；管理演示使用 null-prototype 数据表。
- Profile 或主题都未提供时，主题视觉明确显示为待确认预览；提供职业线索后，职业对应的路线、花瓣、轨迹或流动路径会驱动 SVG 几何，避免只把职业作为文字标签。
- `npm --prefix skill test`：25/25 通过；`git diff --check` 通过；未执行任何生产发布。
