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
- `demo/confirmed-brief.json` 手动选择 7 个 `wedding/` 项目作为相册。
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
brief.json  asset-manifest.json  release-record.json
```

验收重点：

- 390×844 手机视口和一个桌面视口没有横向溢出或文字重叠。
- 相册的 loading、ready、empty、failed 状态分开处理；loading 阶段不闪现婚纱照。
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
