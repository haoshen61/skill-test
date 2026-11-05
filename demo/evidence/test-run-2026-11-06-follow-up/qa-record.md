# 个性化修复复验

- 生成命令：`node skill/scripts/create-invitation.js --assets assets --brief demo/confirmed-brief.json --out /tmp/wedding-invitation-builder-preview-follow-up`
- 测试：`npm --prefix skill test`，18/18 通过。
- 语法：生成的 `app.js`、`admin.js` 通过 `node --check`。
- 手机：Chrome 无界面模式，390×844；Profile、婚礼主题、祝福表单可见，没有横向溢出。
- 桌面：Chrome 无界面模式，1440×900；双栏首屏、相册控制和播放按钮可见，没有文字重叠。
- 内容：内部交付提示不存在；未配置点歌时没有歌曲/歌手字段；背景音乐按钮仍可用；`publish=false`。
- 生产：CloudBase、Cloudflare、认证后台和音乐版权均未执行，仍需单独确认。
