# 本地演示脚本

本脚本使用仓库中的 `skill/`、`assets/` 和 `demo/confirmed-brief.json`。生成目录写入 `/tmp`，不修改素材源目录，也不执行生产发布。

## 安装与生成

1. 在新对话中显式读取 `skill/SKILL.md`，或将 `skill/` 复制到 harness 的本地 Skill 目录。本仓库不依赖全局安装，也不从网络下载 Skill。
2. 运行：

   ```text
   node skill/scripts/create-invitation.js --assets assets --brief demo/confirmed-brief.json --out /tmp/wedding-invitation-builder-preview
   ```

3. 检查 `asset-manifest.json`、`brief.json` 和 `release-record.json`，确认 `publish=false`，相册只包含 `gallery/scene-0..6.jpg` 这 7 个手动选择的通用抽象素材。

如果没有预先确认颜色，先打开同一目录的 `visual-preferences.html`。在四张卡片中按色块、路线、花瓣和留白选择一组，切换到另一张后确认状态文字和 `localStorage` 更新；复制的 JSON 可回填 `design.visualPreference`。

## 本地交互台词

- 打开 `index.html`，等待相册从 loading 进入 ready；用左右按钮和键盘方向键翻页。
- 默认打开即可看到“婚礼邀请函”和婚礼信息；如要演示“继续查看电子请柬”，请另用 `mode: "recap"` 的 brief 生成回顾分支。
- 主题区应看到“城市规划师 × 花艺师”的路线/花瓣职业隐喻，以及“城市路径与花瓣”主题和三个 motifs；这部分使用静态 SVG/CSS 首帧，reduced-motion 时不播放动画。
- 点击“播放音乐”，如果浏览器阻止播放，页面保留“浏览器阻止播放”状态；自动播放与低音量策略仍列为 pending。
- 提交 RSVP：林一、2468、2 位成人。再次提交相同姓名和后四位，把人数改为 3，确认 localStorage 中仍只有一条记录且状态为“已更新本机演示数据”。
- 提交 brief 中配置的个性化留言：署名林一，写下“一起慢慢变老”。打开 `admin.html` 检查只读本地记录；点歌只有在 brief 明确配置时才出现。

## 收口

只报告本地生成、浏览器检查和本地存储演示。云端数据库、认证后台、分享卡片、通知页、CloudBase/Cloudflare 构建和生产发布保持未执行。
