# 职业隐喻视觉与视觉偏好板验收

- 生成命令：`node skill/scripts/create-invitation.js --assets assets --brief demo/confirmed-brief.json --out /tmp/wedding-invitation-builder-preview-visual`
- 测试：`npm --prefix skill test`，见同目录 `npm-test.txt`，25/25 通过。
- 浏览器路径：Browser 插件不可用，Playwright 包也不可用，使用本机 Chrome CDP；临时 HTTP 服务为 `http://127.0.0.1:4173`。
- 邀请函手机：390×844，标题、Profile、主题 SVG/CSS 视觉可见，`data-mode-a="route"`、`data-mode-b="bloom"`，当前主题视觉非 pending，横向滚动宽度 390。
- 邀请函桌面：1440×900，Profile 与主题视觉可见，横向滚动宽度 1440。
- 视觉偏好板手机：390×844，四张卡片可见；键盘聚焦 radio 后选择“苔痕花期”，状态和生成目录专用的 `weddingInvitation.visualPreference.<scope>` 键同步，payload 含 `confirmed: true`。损坏 JSON 或浏览器拒绝写入时，选择与复制仍可继续。
- 选中的 `design.visualPreference.colors` 驱动主题 CSS 变量；`moss-bloom` 使用 `#e8e5d9` / `#425246`，release record 不再把视觉选择列为 pending。
- 相册：ready `1 / 7`，下一张 `2 / 7`，方向键返回 `1 / 7`；失败提示“这张照片暂时无法加载”，空目录提示“暂无已确认照片”。
- RSVP：同一姓名/后四位由 2 位改为 3 位后 localStorage 仍为 1 条，状态为“已更新本机演示数据。”；祝福表单保存 1 条本地记录；音乐按钮存在，浏览器拦截播放时显示“浏览器阻止播放”。
- reduced-motion：`prefers-reduced-motion: reduce` 下路线与花瓣动画计算样式为 `none`。
- 控制台：无 warning/error/exception。
- 贡献键：重复或保留键会被重新命名；RSVP、视觉偏好和对象原型键不会被宾客表单占用。
- 发布：`authorization.publish=false`，未执行生产发布。
