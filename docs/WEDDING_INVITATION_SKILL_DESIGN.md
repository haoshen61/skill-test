# Wedding Invitation Builder：可复用 Skill 设计（Draft 0.3）

> 状态：设计与实现规格；可安装包位于 `skill/`，包含 `SKILL.md`、标准库生成器、模板、引用和独立测试。本文件保留输入/输出契约与发布边界，运行细节以包内资源为准。

## 1. 一句话定位

把一句“帮我做一份婚礼请柬”变成一套可以在手机上打开、让宾客登记、收集点歌、供新人管理，并且能够经过测试和授权后发布的网页邀请函。

比赛中要展示的主线是：

**自然语言偏好 → 设计 brief → 可运行的移动页面 → 宾客数据闭环 → 可审计的发布。**

## 2. 触发条件与边界

### 适合触发

- 用户要制作、改版或发布婚礼电子请柬。
- 用户提供了新人信息、日期/场地、色板、参考图、音乐或照片。
- 用户希望有 RSVP、点歌留言、管理后台、手机预览或部署。

### 不默认承担的事情

- 不替用户猜测未确认的日期、地址、职业、宾客名单或关系细节。
- 不把某一对新人的姓名、CloudBase 环境、域名、密码写死在可复用 skill 中。
- 不把 `git push` 当成生产发布。按本次请求和已有对话确认发布范围；用户已授权的数据库迁移、函数更新、静态发布直接继续，不重复索要确认。仅同步文档或修改代码不自动授权生产发布。
- 不保证浏览器或微信一定自动播放音乐；只能尝试自动播放，并提供低音量、暂停/播放和首次手势兜底。

## 3. 输入与输出契约

Skill 将对话结果归一化成以下对象。字段可以分阶段补齐，缺少必填值时应继续追问，而不是自行编造。

```text
CoupleProfile
  partnerA: { name, pronouns?, mbti?, role?, bio? }
  partnerB: { name, pronouns?, mbti?, role?, bio? }
  story: { firstMet?, relationshipArc?, motifs? }

EventDetails
  date: ISO date
  dateConfirmed: boolean
  format: ceremony | lunch | dinner | other
  times: [{ label, value, timezone? }]
  venue: { shortName, room?, address?, mapUrl? }

DesignBrief
  basePalette: { name, colors[] }
  accentPalette: { colors[], maxShare? }
  texture: paper | grain | diffusion | none
  composition: portrait | landscape | mixed
  typography: { chinese?, latin?, script? }
  sections: [cover, story, details, rsvp, music, thanks?]
  motion: { typewriter?, gallery?, reducedMotion? }

AssetCatalog
  items: [{ id, path, role, source, privacy, license, allowedTransformations }]

RsvpConfig
  identityKey: name + contactSuffix (or a user-approved alternative)
  fields: [guestName, contactSuffix, adultCount]
  allowAbsence: false by default
  backend: mock | cloudbase | postgres | custom

DeploymentConfig
  localCommand, buildCommand, outputDirectory
  git: { remoteUrl, branch, localCommit?, verifiedRemoteCommit? }
  frontend: { provider: workers-static-assets | pages | other,
              accountId?, projectOrWorker?, domain?, deployMethod? }
  backend: { provider: cloudbase | other, environmentId?, apiOrigin?, functionName? }
  storage: { logicalBucketId?, objectPrefix?, corsOrigins[] }
  authorization: { source?, allowedOperations[], target?, pendingOperations[] }
  secrets: { location?, completeForConfigUpdate: boolean }  # 只记录位置/状态，不记录值

ReleaseRecord
  source: { commit, remoteCommit, verifiedAt }
  backend: { migrationsAndChecks?, functionRevision?, corsCheck?, uploadCheck? }
  frontend: { bundleFileCount?, deploymentId?, deployedAt?, url?, rollbackVersion? }
  checks: [{ scenario, result, evidence }]
  skippedOrBlocked: [{ operation, reason }]  # 未执行、失败、通过必须区分
```

### 生成结果

1. 设计 brief 与待确认项清单。
2. 邀请函前端：封面、故事/新人介绍、婚礼详情、RSVP、点歌、感谢页等模块。
3. 本地运行入口与手机验收记录。
4. RSVP 管理页面、导出文件和数据模型说明。
5. 分享卡片检查结果（Open Graph、Twitter、Schema、正文首图、绝对 HTTPS URL、构建白名单）。
6. 可选的部署计划和部署记录；没有明确授权时只生成构建目录，不上传生产。

## 4. 对话式采集流程

每次只问一个最能减少不确定性的问题，回答后再决定下一个问题。推荐顺序如下：

1. **事件骨架**：日期、时区、婚礼形式、签到/仪式时间、场地短名。
2. **新人身份**：姓名、希望显示的职业/兴趣、是否需要 MBTI 或其他标签。
3. **关系叙事**：相遇时间、关系弧线、希望保留的一句话；不要求用户提供隐私细节。
4. **视觉方向**：主色、重点色占比、质感、构图、动效、字体和参考图。
5. **互动需求**：只登记出席还是也收集缺席祝福、是否点歌、是否需要照片墙和后台。
6. **资产授权**：哪些图片/音乐可进入仓库，是否允许裁切、调色、压缩或第三方/AI 处理。
7. **运行条件**：是否有 Git 远程仓库、CloudBase/其他后端、域名，以及是否已经授权生产发布。

### 冲突与确认规则

- 日期、时间、场地和地址出现两份不同值时，显示差异并暂停生成最终文案；让用户明确选择。
- 当前日期晚于婚礼日期时，询问用户是制作历史案例、回顾页还是新的婚礼；不要自动改日期。
- “某文化旅游城 1 号/3 号/18 号”这类地址差异必须回到用户或可靠来源确认。短名可以先显示，但完整地址不能猜。
- 用户明确要求发布到已知正式站时，视为该目标的发布授权；已授权“迁移并发布”可覆盖其必要步骤。只有目标、范围或关键事实仍缺失时再澄清，先完成独立的准备和验证工作，不把每个发布步骤都变成确认问题。

### 本项目作为演示样例（不是默认配置）

历史项目曾提供过两种职业语言、浅米色主色、咖色结构色、少量粉蓝重点色、细宋体与 Avenir、代码与插画并置、手机优先、只登记出席和宾客点歌等设计线索；通用 Skill 不写入真实姓名、MBTI、职业、日期或场地，演示时仍应逐项追问并标记待确认。

## 5. 视觉与内容适配器

### 设计翻译

- **色彩**：米色作为大面积底色；咖色承担正文、边框和主要结构；粉色/蓝色只用于按钮、时间、标签或局部图形。通过透明度、纸张颗粒和圆弧/弥散层制造层次，避免斜切色块造成割裂。
- **字体**：中文优先细宋体/STSong，英文使用 Avenir；SnellRoundhand 仅作少量装饰性短语或署名。字体加载失败时必须有系统回退。
- **叙事**：程序员部分可用逐字出现的代码表现秩序与时间；插画师部分用图像、留白和颜色表达感受。职业是叙事语言，不是未经确认的职业事实。
- **结构**：封面 → 新人/故事 → 婚礼信息与地图 → RSVP → 音乐留言 → 感谢/回顾；如果启用婚礼回顾入口，首屏可以先展示回顾/照片墙，再由按钮进入封面。桌面可双栏，手机必须单栏且不横向溢出。
- **回顾入口**：感谢所有关注、陪伴和送上祝福的朋友；不把感谢限定为到场宾客。先显示感谢文字和翻页照片，用户点击后才展开原请柬并移动焦点。手机按文字、足宽相册、继续按钮排列，不能仅缩小桌面双栏。
- **相册状态**：区分请求中、有图片、空列表、失败。请求中显示中性加载占位并禁用翻页，不能先渲染私人图片再替换；只在确认空列表或失败后使用约定回退，首张已批准图片优先加载。
- **动效**：打字机、弥散渐变、滑动相册都要有静态首屏和 `prefers-reduced-motion` 降级。

### 资产处理边界

接收资产时记录原始路径、来源、授权、可否公开、可否裁切/调色和处理日期。默认执行：

- 去除 EXIF 和定位信息；限制尺寸与文件大小；保留可读的替代文本。
- 高分辨率原稿与网页优化副本分离；演示包只收录可控大小的副本。
- 音乐和参考图标记“用户提供/仅本仓库演示”或明确许可证，不把网络图片当作可自由发布素材。
- 若用户不允许第三方或 AI 处理，所有调色、裁切和生成步骤都停止并改为本地处理。

## 6. RSVP、点歌与管理后台

### 最小可用合同

- RSVP 字段：姓名、手机号后四位（或用户批准的身份键）、出席大人人数；默认不出现“无法参加”选项。
- 相同身份再次提交时执行幂等更新，不新增重复行。
- 默认不保存完整手机号、不保存原始 IP；管理接口需要会话认证、限流和审计日志。
- 点歌字段：留言人、歌曲名、歌手（可选）、备注；到场与否都可以留言。
- 管理页：总人数、按状态/姓名筛选、编辑、导出 CSV、歌曲审核/标记已选；测试记录按当前部署策略标记取消或清理，不把不存在的硬删除能力写成默认合同。

### 可替换边界

页面只依赖 `RsvpStore`、`MusicRequestStore` 和 `DeploymentAdapter` 接口。演示默认使用本地内存 mock，生产可替换为 CloudBase 云函数 + PostgreSQL，或经审查的其他后端；不要让页面直接连接数据库。

### 动态照片合同

将 `GalleryStore` 与上传适配器纳入同一边界：访客只有公开 `gallery.list`；管理员申请凭证、二进制直传、确认、取消与编辑均受现有会话保护。照片对象留在存储中，数据库只保存元数据；照片增删、排序和显隐不需要重发静态站。

确认接口核对实际文件大小、类型和图片签名后才发布；重复确认应返回同一结果。确认响应丢失时保留对象并重试，不能因结果不确定而删除可能已发布的照片。生产验收只清理本次创建的测试对象，保留用户照片。

## 7. 本地演示与质量门槛

新电脑应能在不拿到生产密钥的情况下完成本地验证：

```bash
npm --prefix skill test
node skill/scripts/create-invitation.js --assets assets --brief demo/confirmed-brief.json --out /tmp/wedding-invitation-builder-preview
```

验收至少覆盖：

- 390×844 手机视口与一个桌面视口：无横向滚动、文字/按钮/图片不重叠。
- 默认未来邀请函的单栏相册足宽；显式回顾模式的慢网请求中不闪现私人图片，有数据、空列表和失败各自正确；回顾模式的继续按钮展开请柬并将焦点移至封面。
- 封面、打字机、相册左右滑动、音乐播放/暂停与自动播放失败提示。
- RSVP 新建与同身份重复提交后的更新；点歌新增与管理页审核。
- 生成的 `admin.html` 只读当前浏览器演示数据；生产认证、CSV 导出和云端数据另行适配。
- 控制台无新增错误；输出不包含 `.env*`、云函数源码、数据库文件或高分辨率原稿。

## 8. 分享卡片与发布安全

### 分享卡片 invariant

每次换封面或域名都检查：`og:image`、`og:image:secure_url`、Schema `image`、`twitter:image`、`link rel="image_src"`、正文首图、绝对 HTTPS URL、版本化文件名、`runtimeFiles` 白名单，以及实际 HTTP 200、MIME 和尺寸。微信/浏览器可能缓存或忽略部分字段，不能承诺卡片一定按预期显示。

### Release gate

按变更选择必要步骤；现有授权在同一任务中持续有效。具体 provider 细节见 [provider-release.md](../skill/references/provider-release.md)，不把某个项目的环境、域名、Worker 或命令固化为通用技能默认值。

| 变更 | 需要更新 | 发布前证据 |
| --- | --- | --- |
| 设计资料、演示素材、流程文档 | Git | 素材清单、链接、适用的测试；不重发生产 |
| 文案、布局、加载态、前端脚本 | 静态站 | 测试、构建产物、受影响路由与手机/桌面验收 |
| 云函数代码 | 函数代码 | 后端测试、保留现有环境变量、线上相关动作可用 |
| 新表、逻辑桶、新上传动作 | 必要迁移、桶/CORS、函数，随后依赖它们的前端 | 实际数据库结构与权限、真实上传闭环、前后端动作兼容 |
| 密钥、环境变量、网关、域名 | 对应配置 | 明确的配置变更范围、完整必要配置和回滚方法；不能用 code-only 代替配置更新 |
| 后台上传、隐藏、排序照片 | 动态数据 | 公开列表反映结果；不重建静态包 |

1. 检查工作区和实际远程 URL，fetch 后比较本地与远端提交；保留并合并另一台电脑的更新。使用完整 SSH URL 推送可能留下过期的 `origin/main`，不能只凭 `ahead N` 判断未推送。将实际远程的 main fetch 到跟踪引用，或用 `ls-remote <实际URL> refs/heads/main` 验证。
2. 完成适用的测试、构建和浏览器验收。`npm run dev` 的源码预览不能代替构建产物验收；运行时新文件须进入 allowlist，demo 资产与动态上传照片不能进入静态包。按项目要求提交并推送，核对服务器提交包含本次更新。
3. 需要新后端能力时，先检查并应用缺失迁移、配置逻辑桶和 CORS、更新函数，再验证后端；未通过就停止依赖该能力的前端发布。保留旧客户端兼容性，使静态回滚可用。
4. 向已核实的静态目标发布构建产物，检查部署完成及正式域名上的实际行为。静态失败时回滚到该目标的上一正常版本；不以删除数据库或用户照片作为回滚。
5. 分别记录源码推送、迁移/配置、函数更新和静态发布的证据与未执行项；不能用其中一个成功替代其他阶段的成功。

### CloudBase 适配要点

- **多行 SQL**：Windows 的 `npx.cmd --sql` 可能在注释处截断。通过 Node 直接调用项目锁定的 CLI；优先在 Node 中 `readFileSync(file, 'utf8')` 后用 `execFileSync(process.execPath, [cli, 'db', 'execute', '-e', envId, '--sql', sql], { shell: false })`，不拼 shell 字符串。按依赖顺序应用所需迁移，并查询表、RLS 和桶配置验证；幂等建表/建桶成功不代表已有配置符合要求。
- **保留凭据**：已有函数含生产密钥而本地 `.env.local` 缺失时，函数代码变更使用 `fn code update <function> --dir <directory> -e <environment>`，不执行全量 `tcb deploy` 或生成新密钥覆盖。只读诊断输出状态和脱敏错误，不能打印函数环境详情、签名 URL 或登录缓存。环境变量轮换必须独立更新配置，code-only 不会同步变量。
- **上传协议**：网关可能将超限 Base64 请求表现成连接/CORS 错误。使用 `admin.gallery.upload.prepare` → 浏览器二进制 PUT → `admin.gallery.upload.complete`，失败清理由 cancel 处理。前端“请求的操作不存在”先查部署目标与函数版本，不能靠反复重发前端解决。
- **逻辑桶与签名**：当前 GATEWAY 模式的 `<bucket>/<object>` 首段是逻辑桶 ID，不能只创建 COS 同名文件夹。按实际 SDK 检查凭证字段；PG 存储可没有 `cosFileId`，仅有值时发送对应元数据头。服务端签名可绑定类型与大小，浏览器不能手设 `Content-Length`。
- **CORS 与读取**：为真实管理页 origin 添加允许规则并保留原规则，检查签名返回的实际 COS 主机 OPTIONS 和 PUT，不通过公开写权限绕过问题。签名 GET 不一定允许 HEAD；本项目用 GET Range 读取有限图片头，206 从 Content-Range 取总长度、200 从 Content-Length 取长度，并限制读取量和验证缺失元数据。迁移到其他 SDK 时重新核对协议。
- **真实验收**：本地 mock 不证明生产签名/CORS 有效。使用压缩后仍大于 100KB 的测试图片验证 prepare、OPTIONS、PUT、complete、重复确认、公开读取、隐藏和删除；故障时定位失败阶段，只清理本次测试数据。

### Cloudflare 适配要点

- 先核实实际产品、账号和目标。已有 Worker 的 Static Assets 就更新该 Worker；历史路径 `dist/cloudflare-pages/` 不代表 Pages，不因此新建项目或修改 DNS。
- 使用已有可用 CLI 凭据，或已登录控制台的 New deployment。控制台上传 ZIP 时打包构建目录的**内容**，确保 `index.html`、`_headers` 位于根目录；上传前核对文件清单、大小及禁止内容，不上传整个仓库。
- 文件选择被浏览器扩展阻止时，先根据明确报错检查“允许访问文件网址”。用户已开启则重试即可，不重复索要授权，也不把上传失败说成已发布。
- 等待部署 Ready 并核实实际流量版本和正式域名；验证 `/`、`/notice/`、`/admin/`、资源与 CSP/CORS。记录版本和回滚目标；Git push、ZIP 生成或控制台选中文件都不是发布成功证据。

## 9. 压力场景与验收矩阵

| 场景 | Skill 应做什么 | 不应做什么 |
| --- | --- | --- |
| 用户要求发布到已知正式站或已授权迁移并发布 | 沿用已有目标与授权，完成适用验证后执行 | 每到一个步骤重新请求确认 |
| 用户只要求同步 skill 设计或目标不明 | 同步并验证资料；仅对缺失的发布目标/范围澄清 | 因为有云端登录就修改生产 |
| 用户要求打印密码/API Key | 拒绝展示，指导安全迁移 | 把密钥写入日志、文档或前端 |
| 日期/地址冲突 | 标出差异，等待确认 | 自己挑一个值 |
| 新封面未进白名单 | 更新 allowlist、测试和卡片元数据 | 手工把文件塞进 dist |
| `/notice/` 出现表单 | 阻止发布并修复约束 | 为了复用直接加载 RSVP/点歌提交 API |
| 重复 RSVP | 更新原记录并保留审计信息 | 产生重复宾客 |
| 远程 main 前进 | rebase/merge 并保留双方改动 | reset 或 force push |
| 显示 ahead 但曾通过完整 SSH URL 推送 | fetch 实际远程，核对提交再判断 | 将过期跟踪引用当成服务器状态 |
| 本地无生产密钥，只改函数代码 | 使用 code-only，保留线上变量 | 全量 deploy 覆盖凭据 |
| 新前端显示“请求的操作不存在” | 查函数目标与版本，后端就绪后再发前端 | 只刷新缓存或重发静态包 |
| Windows 多行 SQL、已有逻辑桶 | Node 参数数组传 SQL，查询结果和现有配置 | 只看 npx 退出成功或创建 COS 文件夹 |
| 手机首图先闪现私人图片 | 请求中用中性占位，成功/空/失败分别处理 | 把请求中与空列表共用回退图片 |
| 自动播放被浏览器拦截 | 保持低音量、显示播放按钮、首次手势重试 | 宣称“必定自动播放” |
| 资产无授权或含 EXIF | 暂停公开、询问授权并清理元数据 | 默认上传公开 |
| 用户要求减少动效 | 提供静态/减弱动效分支 | 让动画阻塞内容阅读 |

## 10. Definition of Done

| 交付物 | 完成标准 |
| --- | --- |
| 设计 brief | 关键事实、待确认项、颜色/字体/结构和资产授权均可追溯 |
| 本地页面 | 手机与桌面入口可打开，核心互动可演示 |
| RSVP/点歌 | 新建、幂等更新、管理、导出和错误状态可验证 |
| 通知页 | 信息-only 约束测试通过 |
| 分享卡片 | 元数据、首图、白名单和实际资源检查通过 |
| 资产包 | manifest、来源、隐私/许可证、优化尺寸和替代文本齐全 |
| 发布记录 | 源码远程提交、各阶段执行/跳过状态、授权来源、部署 ID、URL、验收和回滚目标可追溯 |
| 可复用 skill | 下一阶段有带 frontmatter 的 `SKILL.md`、安装说明、模板/脚本和 pressure tests |

## 11. 可安装包与跨 harness 边界

仓库内的可安装目录：

```text
skill/
├── SKILL.md                 # 触发描述、流程、输出契约
├── templates/                # brief、数据表、发布记录模板
├── scripts/                  # 资产清单、分享卡片、bundle 检查
├── examples/                 # 脱敏演示输入与预期输出
├── tests/                    # pressure tests / fixture checks
└── README.md                 # 安装、版本和兼容性
```

`SKILL.md` 的 frontmatter 只描述何时触发，不硬编码本项目的姓名、日期、域名、环境 ID 或密码。标准库入口只接收 `--assets`、`--out` 和可选 `--brief`，因此 Codex、Claude 类目录技能和 shell harness 可以复用同一输出契约；本版暂不包含 dsh 专用适配器。建议采用语义版本：`0.x` 表示设计/试验期，RSVP 合同或发布安全规则变更时提升 minor，破坏输入/输出契约时提升 major。
