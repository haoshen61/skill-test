import fs from "node:fs/promises";
import path from "node:path";

const artifactToolPath = process.env.WEDDING_DEMO_ARTIFACT_TOOL;
const presentationUtilsPath = process.env.WEDDING_DEMO_PRESENTATION_UTILS;
const pythonExecutable = process.env.WEDDING_DEMO_PYTHON;
const integrityValidatorPath = process.env.WEDDING_DEMO_INTEGRITY_VALIDATOR;
const layoutValidatorPath = process.env.WEDDING_DEMO_LAYOUT_VALIDATOR;
if (!artifactToolPath || !presentationUtilsPath || !pythonExecutable || !integrityValidatorPath || !layoutValidatorPath) {
  throw new Error("Set the WEDDING_DEMO_ARTIFACT_TOOL, WEDDING_DEMO_PRESENTATION_UTILS, WEDDING_DEMO_PYTHON, WEDDING_DEMO_INTEGRITY_VALIDATOR, and WEDDING_DEMO_LAYOUT_VALIDATOR paths to run the optional PPTX demo builder.");
}
const { Presentation, PresentationFile } = await import(artifactToolPath);
const { finalizePresentation } = await import(presentationUtilsPath);

const workspaceDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const buildDir = path.join(workspaceDir, "demo", "ppt-build");
const renderDir = path.join(buildDir, "rendered");
const finalDir = path.join(workspaceDir, "demo", "ppt-output");
const candidatePath = path.join(buildDir, "candidate.pptx");
const finalPath = path.join(finalDir, "WEDDING_INVITATION_SKILL_DEMO.pptx");
await fs.mkdir(renderDir, { recursive: true });
await fs.mkdir(finalDir, { recursive: true });

const colors = {
  paper: "#F4EEE5",
  ink: "#4F3B32",
  muted: "#7D6657",
  line: "#D9C8BA",
  rose: "#D9A9A0",
  blue: "#9FB8CE",
  white: "#FFFAF2"
};

async function imageBytes(relativePath) {
  return (await fs.readFile(path.join(workspaceDir, relativePath))).buffer;
}

function addText(slide, text, position, style = {}) {
  const box = slide.shapes.add({
    geometry: "textbox",
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 }
  });
  box.text = text;
  box.text.style = {
    fontFamily: style.fontFamily || "Songti SC",
    fontSize: style.fontSize || 20,
    color: style.color || colors.ink,
    bold: style.bold || false,
    italic: style.italic || false,
    align: style.align || "left",
    verticalAlign: style.verticalAlign || "top",
    breakLine: true
  };
  return box;
}

function addRule(slide, left, top, width, color = colors.line) {
  slide.shapes.add({
    geometry: "rect",
    position: { left, top, width, height: 2 },
    fill: color,
    line: { style: "solid", fill: color, width: 0 }
  });
}

async function addImage(slide, relativePath, position, alt, fit = "contain") {
  const ext = path.extname(relativePath).toLowerCase();
  const contentType = ext === ".png" ? "image/png" : "image/jpeg";
  slide.images.add({
    blob: await imageBytes(relativePath),
    contentType,
    alt,
    fit,
    position,
    geometry: "roundRect",
    borderRadius: "rounded-xl"
  });
}

function setupSlide(slide, title, kicker) {
  slide.background.fill = colors.paper;
  addText(slide, kicker.toUpperCase(), { left: 70, top: 48, width: 320, height: 24 }, { fontFamily: "Arial", fontSize: 12, color: colors.muted, bold: true });
  addText(slide, title, { left: 70, top: 86, width: 760, height: 70 }, { fontSize: 34, color: colors.ink });
  addRule(slide, 70, 165, 1140);
}

const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });

{
  const slide = presentation.slides.add();
  slide.background.fill = colors.paper;
  await addImage(slide, "assets/cover/invitation-cover.jpg", { left: 780, top: 60, width: 360, height: 560 }, "邀请函封面", "contain");
  addText(slide, "wedding-invitation-builder", { left: 72, top: 130, width: 620, height: 90 }, { fontFamily: "Arial", fontSize: 42, color: colors.ink, bold: true });
  addText(slide, "本地 Skill 安装与最终验收", { left: 76, top: 250, width: 520, height: 55 }, { fontSize: 28, color: colors.muted });
  addText(slide, "从逐轮对话和本地素材生成可审阅的移动优先邀请函", { left: 76, top: 340, width: 520, height: 80 }, { fontSize: 22, color: colors.ink });
  addText(slide, "2026-11-05  ·  只做本地预览", { left: 76, top: 600, width: 520, height: 30 }, { fontFamily: "Arial", fontSize: 14, color: colors.muted });
}

{
  const slide = presentation.slides.add();
  setupSlide(slide, "测试范围与边界", "scope");
  addText(slide, "本次只读取仓库中的三类内容", { left: 80, top: 220, width: 500, height: 44 }, { fontSize: 24, bold: true });
  addText(slide, "skill/  ·  可安装 Skill 与便携生成器\nassets/  ·  需求追问、视觉 brief、本地预览素材\nEXPECTED_CONVERSATION_FLOW.md  ·  27 步验收台词", { left: 82, top: 292, width: 510, height: 150 }, { fontSize: 20, color: colors.muted });
  addText(slide, "生产状态", { left: 720, top: 220, width: 300, height: 38 }, { fontSize: 24, bold: true, color: colors.rose });
  addText(slide, "publish = false\nCloudBase / Cloudflare 未执行\n本地 RSVP、个性化留言和管理页只使用浏览器 localStorage", { left: 722, top: 292, width: 430, height: 140 }, { fontSize: 22, color: colors.ink });
}

{
  const slide = presentation.slides.add();
  setupSlide(slide, "Skill 安装与入口", "install");
  addText(slide, "当前仓库没有独立安装脚本。新对话显式读取：", { left: 80, top: 210, width: 600, height: 36 }, { fontSize: 22 });
  addText(slide, "skill/SKILL.md", { left: 80, top: 264, width: 500, height: 48 }, { fontFamily: "Arial", fontSize: 28, color: colors.rose, bold: true });
  addRule(slide, 80, 330, 480, colors.rose);
  addText(slide, "node skill/scripts/create-invitation.js\n  --assets assets\n  --brief demo/confirmed-brief.json\n  --out /tmp/wedding-invitation-builder-preview", { left: 82, top: 370, width: 600, height: 160 }, { fontFamily: "Arial", fontSize: 20, color: colors.ink });
  addText(slide, "源素材目录只读，输出写入工作区外临时目录。", { left: 750, top: 250, width: 390, height: 80 }, { fontSize: 23, color: colors.muted });
  addText(slide, "8 个标准输出文件\nbrief · manifest · release record\n静态页面 · 本地只读管理页", { left: 750, top: 370, width: 390, height: 130 }, { fontSize: 22, color: colors.ink });
}

{
  const slide = presentation.slides.add();
  setupSlide(slide, "对话采集：事件与故事", "steps 1–10");
  addText(slide, "2027-05-16  ·  Asia/Shanghai  ·  午宴", { left: 80, top: 220, width: 650, height: 44 }, { fontSize: 28, bold: true });
  addText(slide, "签到 11:00  |  仪式 11:28\n杭州云栖里酒店  ·  云锦厅\n浙江省杭州市西湖区云栖路 88 号", { left: 82, top: 290, width: 560, height: 130 }, { fontSize: 23, color: colors.muted });
  addText(slide, "沐宸  INTJ  城市规划师\n若汐  ESFP  花艺师", { left: 760, top: 220, width: 380, height: 100 }, { fontSize: 25, color: colors.ink, bold: true });
  addText(slide, "2022 年秋天相遇，从朋友慢慢成为爱人。\n一个人规划远方，一个人照料当下。", { left: 760, top: 360, width: 380, height: 110 }, { fontSize: 21, color: colors.muted });
}

{
  const slide = presentation.slides.add();
  setupSlide(slide, "视觉 brief：城市结构与植物感受", "steps 11–13");
  await addImage(slide, "assets/palette/color-theme.png", { left: 80, top: 220, width: 380, height: 260 }, "浅米、咖色、粉色和蓝色的色卡", "contain");
  await addImage(slide, "assets/references/reference-editorial-01.jpg", { left: 500, top: 220, width: 180, height: 260 }, "编辑感参考", "contain");
  await addImage(slide, "assets/typography/type-reference-03.jpg", { left: 700, top: 220, width: 180, height: 260 }, "中文细字重排版参考", "contain");
  addText(slide, "浅米色承载大面积背景，咖色负责正文和结构；粉色与蓝色只作重点。\n纸张颗粒、地图线条、圆形弥散和柔和渐变进入 brief。\n路径逐步绘制、花瓣展开是设计目标，便携生成器继续列为待适配。", { left: 920, top: 220, width: 280, height: 230 }, { fontSize: 18, color: colors.muted });
}

{
  const slide = presentation.slides.add();
  setupSlide(slide, "资产扫描与授权", "steps 14–18");
  await addImage(slide, "assets/contact-sheet.jpg", { left: 80, top: 210, width: 420, height: 300 }, "抽象演示素材缩略总览", "contain");
  addText(slide, "26 项被扫描\n25 图片 + 1 音频", { left: 590, top: 220, width: 250, height: 80 }, { fontSize: 26, bold: true });
  addText(slide, "manifest.json 提供角色、隐私、许可证和用途标签。\ngallery.paths 手动选择 7 个抽象 gallery/ 项目。\n风格参考仍可复制到本地审阅，但不进入轮播。", { left: 590, top: 330, width: 520, height: 150 }, { fontSize: 22, color: colors.muted });
  addText(slide, "本地演示获准  ·  公开发布未获准", { left: 590, top: 550, width: 520, height: 40 }, { fontSize: 22, color: colors.rose, bold: true });
}

{
  const slide = presentation.slides.add();
  setupSlide(slide, "生成结果：邀请函首屏与回顾分支", "steps 19–20");
  await addImage(slide, "assets/cover/invitation-cover.jpg", { left: 90, top: 210, width: 270, height: 470 }, "抽象演示封面", "contain");
  await addImage(slide, "assets/gallery/scene-0.jpg", { left: 430, top: 210, width: 270, height: 470 }, "抽象相册首图", "contain");
  addText(slide, "普通模式先展示“婚礼邀请函”和婚礼信息；演示素材不含人物或私人事实。\nloading、empty、failed 三种相册状态分开处理。", { left: 760, top: 250, width: 390, height: 150 }, { fontSize: 20, color: colors.muted });
}

{
  const slide = presentation.slides.add();
  setupSlide(slide, "手机与桌面布局", "responsive QA");
  addText(slide, "手机 390 × 844", { left: 110, top: 205, width: 300, height: 36 }, { fontFamily: "Arial", fontSize: 20, bold: true });
  addText(slide, "桌面 1440 × 900", { left: 690, top: 205, width: 340, height: 36 }, { fontFamily: "Arial", fontSize: 20, bold: true });
  await addImage(slide, "assets/cover/invitation-cover.jpg", { left: 80, top: 255, width: 300, height: 420 }, "手机端抽象封面示例", "contain");
  await addImage(slide, "assets/gallery/scene-0.jpg", { left: 620, top: 255, width: 300, height: 420 }, "桌面端相册首图示例", "contain");
  addText(slide, "通过：素材按原比例展示，演示记录无私人图片或生产数据。", { left: 620, top: 690, width: 560, height: 42 }, { fontSize: 19, color: colors.muted });
}

{
  const slide = presentation.slides.add();
  setupSlide(slide, "本地交互：RSVP、个性化留言和音乐", "steps 21–23");
  await addImage(slide, "assets/contact-sheet.jpg", { left: 80, top: 205, width: 350, height: 470 }, "通用素材与本地交互演示", "contain");
  addText(slide, "林一 · 2468 · 2 位成人", { left: 540, top: 225, width: 500, height: 44 }, { fontSize: 25, bold: true });
  addText(slide, "再次输入同一身份并改为 3 位后，localStorage 仍只有一条记录。\n状态：已更新本机演示数据。", { left: 540, top: 300, width: 560, height: 100 }, { fontSize: 22, color: colors.muted });
  addText(slide, "点歌：林一 · 《晚风写信》 · 歌手留空\n音乐按钮以用户点击为主，自动播放和低音量策略 pending。", { left: 540, top: 450, width: 560, height: 100 }, { fontSize: 22, color: colors.ink });
}

{
  const slide = presentation.slides.add();
  setupSlide(slide, "管理页与异常状态", "local-only review");
  await addImage(slide, "assets/gallery/scene-6.jpg", { left: 80, top: 210, width: 320, height: 440 }, "抽象相册图片状态示例", "contain");
  addText(slide, "空相册：暂无已确认照片\n失败图片：这张照片暂时无法加载\n管理页：只读显示当前浏览器 localStorage", { left: 510, top: 230, width: 570, height: 150 }, { fontSize: 24, color: colors.ink });
  addText(slide, "生产管理员认证、云端幂等、CSV 导出和自动播放策略均未宣称完成。", { left: 510, top: 470, width: 570, height: 80 }, { fontSize: 21, color: colors.rose, bold: true });
}

{
  const slide = presentation.slides.add();
  setupSlide(slide, "测试结果与阶段成果", "steps 24–25");
  addText(slide, "12 / 12", { left: 90, top: 220, width: 320, height: 80 }, { fontFamily: "Arial", fontSize: 56, color: colors.rose, bold: true });
  addText(slide, "npm --prefix skill test", { left: 94, top: 310, width: 400, height: 40 }, { fontFamily: "Arial", fontSize: 22, color: colors.muted });
  addText(slide, "A  安装与需求采集\nB  视觉与交互 brief\nC  资产授权与发布边界\nD  生成与静态 QA\nE  本地交互演示\nF  收口与下一步", { left: 560, top: 220, width: 500, height: 260 }, { fontSize: 23, color: colors.ink });
  addText(slide, "每个阶段均有 brief、manifest、release record、页面、截图或 localStorage 证据。", { left: 560, top: 540, width: 560, height: 45 }, { fontSize: 19, color: colors.muted });
}

{
  const slide = presentation.slides.add();
  setupSlide(slide, "交付清单与下一步", "steps 26–27");
  addText(slide, "当前交付", { left: 90, top: 220, width: 250, height: 38 }, { fontSize: 25, color: colors.rose, bold: true });
  addText(slide, "本地邀请函\nconfirmed brief\n带隐私/许可证标签的素材清单\n本地 RSVP、个性化留言和只读管理页\n最终测试记录与使用说明", { left: 90, top: 285, width: 420, height: 230 }, { fontSize: 22, color: colors.ink });
  addText(slide, "生产前重新确认", { left: 700, top: 220, width: 300, height: 38 }, { fontSize: 25, color: colors.blue, bold: true });
  addText(slide, "环境、迁移、密钥、域名\n隐私与版权\n云端 RSVP 和认证\n分享卡片、通知页、静态发布\n明确的生产授权", { left: 700, top: 285, width: 430, height: 230 }, { fontSize: 22, color: colors.ink });
  addText(slide, "本次状态：未授权、未部署", { left: 700, top: 590, width: 430, height: 36 }, { fontSize: 22, color: colors.rose, bold: true });
}

for (const [index, slide] of presentation.slides.items.entries()) {
  const png = await presentation.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(path.join(renderDir, `slide-${String(index + 1).padStart(2, "0")}.png`), new Uint8Array(await png.arrayBuffer()));
}

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(candidatePath);
const result = await finalizePresentation({
  workspaceDir,
  candidatePath,
  finalPath,
  explicitTotalSlideCount: 12,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  pythonExecutable,
  integrityValidatorPath,
  layoutValidatorPath,
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-bullet-geometry", "--validate-heading-fit"],
  fontPolicy: { basis: "design", families: ["Aptos", "Songti SC", "Arial"] },
  scriptFonts: ["Songti SC"],
  verifyArtifactToolImport: true,
  receiptPath: path.join(buildDir, "WEDDING_INVITATION_SKILL_DEMO.validation.json")
});
console.log(JSON.stringify({ finalPath, result }, null, 2));
