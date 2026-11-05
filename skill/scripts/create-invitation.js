#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".ogg", ".wav", ".aac"]);
const SECRET_SEGMENTS = new Set([".cloudbase", ".tcb", ".git"]);
const RESERVED_RECORD_IDS = new Set([
  "__proto__", "prototype", "constructor", "toString", "valueOf", "hasOwnProperty",
  "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "__defineGetter__",
  "__defineSetter__", "__lookupGetter__", "__lookupSetter__"
]);
const RSVP_STORAGE_KEY = "weddingInvitation.rsvp";
const STORAGE_KEY_PREFIX = "weddingInvitation.";
const STORAGE_KEY_PATTERN = /^weddingInvitation\.[a-z0-9_-]+$/i;
const VISUAL_PREFERENCE_STORAGE_PREFIX = `${STORAGE_KEY_PREFIX}visualPreference.`;
const VISUAL_PALETTE_OPTIONS = [
  {
    id: "paper-route",
    label: "纸张路径",
    description: "浅米纸张、咖色路线与柔和粉蓝节点",
    colors: ["#F4EEE5", "#6F5547", "#D9A9A0", "#9FB8CE"],
    motif: "路径与花瓣"
  },
  {
    id: "moss-bloom",
    label: "苔痕花期",
    description: "灰绿底色、植物弧线与温暖花瓣",
    colors: ["#E8E5D9", "#425246", "#C98F82", "#D8C08A"],
    motif: "枝叶与生长"
  },
  {
    id: "ink-orchid",
    label: "墨色兰影",
    description: "雾白留白、墨色结构与低饱和紫调",
    colors: ["#F2F0EC", "#34313A", "#9B879B", "#C9B8A5"],
    motif: "弧线与留白"
  },
  {
    id: "sunset-garden",
    label: "暮色花园",
    description: "暖沙背景、夕照橙与深莓色节点",
    colors: ["#F3E4D2", "#6B4037", "#D48762", "#B7A2B8"],
    motif: "光线与花束"
  }
];

function usage() {
  return "Usage: node scripts/create-invitation.js --assets <directory> --out <directory> [--brief <json-file>]";
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!flag.startsWith("--")) throw new Error(`Unexpected argument: ${flag}\n${usage()}`);
    const key = flag.slice(2);
    if (key === "help") return { help: true };
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}\n${usage()}`);
    args[key] = value;
    index += 1;
  }
  if (!args.assets || !args.out) throw new Error(usage());
  return args;
}

function relativePath(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function shouldSkip(relative) {
  return relative.split("/").some((segment) => segment.startsWith(".") || SECRET_SEGMENTS.has(segment));
}

function mediaType(relative) {
  const extension = path.extname(relative).toLowerCase();
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (AUDIO_EXTENSIONS.has(extension)) return "audio";
  return null;
}

function readAssetMetadata(assetRoot) {
  const manifestPath = path.join(assetRoot, "manifest.json");
  if (!fs.existsSync(manifestPath)) return { entries: new Map(), warning: null };
  try {
    const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const entries = new Map();
    for (const item of Array.isArray(parsed.items) ? parsed.items : []) {
      if (!item || typeof item.path !== "string") continue;
      entries.set(item.path.split(path.sep).join("/"), item);
    }
    return { entries, warning: null };
  } catch (error) {
    return { entries: new Map(), warning: `Asset manifest metadata was ignored: ${error.message}` };
  }
}

function scanAssets(assetRoot) {
  const items = [];
  const warnings = [];
  const { entries: metadataByPath, warning: metadataWarning } = readAssetMetadata(assetRoot);
  if (metadataWarning) warnings.push(metadataWarning);

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      const relative = relativePath(assetRoot, filePath);
      if (shouldSkip(relative)) continue;
      if (entry.isDirectory()) {
        visit(filePath);
        continue;
      }
      if (!entry.isFile()) continue;
      const role = mediaType(relative);
      if (!role) continue;
      const stat = fs.statSync(filePath);
      const metadata = metadataByPath.get(relative) || {};
      items.push({
        id: relative.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "asset",
        path: relative,
        role,
        mediaType: role,
        assetRole: metadata.role || role,
        source: metadata.source || relative,
        bytes: stat.size,
        privacy: metadata.privacy || "pending",
        license: metadata.license || "unknown",
        allowedTransformations: Array.isArray(metadata.allowedTransformations) ? metadata.allowedTransformations : [],
        description: metadata.description || null,
        usedBy: Array.isArray(metadata.usedBy) ? metadata.usedBy : [],
        notes: metadata.notes || null
      });
    }
  }

  visit(assetRoot);
  items.sort((left, right) => left.path.localeCompare(right.path));
  if (!items.length) warnings.push("No supported assets were found; add approved image or audio files before publishing.");
  return { items, warnings };
}

function defaultBrief() {
  return {
    version: "0.1",
    mode: "invitation",
    couple: {
      partnerA: { name: null, occupation: null, mbti: null, identityCue: null },
      partnerB: { name: null, occupation: null, mbti: null, identityCue: null },
      story: { relationshipArc: null, confirmedCopy: null }
    },
    event: { date: null, dateConfirmed: false, format: null, times: [], venue: { shortName: null, address: null, mapUrl: null } },
    design: {
      theme: { name: null, description: null, motifs: [] },
      visualLanguage: { partnerA: null, partnerB: null, shared: [] },
      visualPreference: { id: null, label: null, colors: [], selectionMode: "visual", confirmed: false },
      basePalette: { name: "soft paper", colors: ["#f4eee5"] },
      accentPalette: { colors: ["#6f5547"] },
      texture: "paper",
      composition: "mixed",
      typography: { chinese: "system serif", latin: "system sans" }
    },
    gallery: { paths: null },
    workflow: { phase: "intake", briefConfirmed: false, assetsReviewed: false, localQa: "pending", releaseAuthorized: false },
    sections: ["cover", "story", "details", "rsvp", "guest-notes", "thanks"],
    copy: { invitationTitle: "婚礼邀请函", invitationIntro: "我们诚挚邀请您见证这一天", recapTitle: "婚礼已圆满落幕", thanks: "感谢每一份关注、陪伴与祝福", continueLabel: "继续查看电子请柬" },
    interaction: { gallery: true, backgroundMusic: false, music: false, rsvp: false, guestContributions: [], reducedMotion: true },
    authorization: { assets: "pending", publish: false }
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergeBrief(base, override) {
  if (!isPlainObject(override)) throw new Error("Brief JSON must contain an object at the root.");
  const merged = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(base[key])) merged[key] = mergeBrief(base[key], value);
    else merged[key] = value;
  }
  return merged;
}

function readBrief(briefPath) {
  if (!briefPath) return defaultBrief();
  try {
    const parsed = JSON.parse(fs.readFileSync(briefPath, "utf8"));
    return mergeBrief(defaultBrief(), parsed);
  } catch (error) {
    throw new Error(`Unable to read brief JSON: ${error.message}`);
  }
}

function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}

function assetUrl(relative) {
  return `assets/${relative.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`;
}

function safeIdentifier(value, fallback) {
  const normalized = String(value || "").trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return normalized && !RESERVED_RECORD_IDS.has(normalized) ? normalized : fallback;
}

function normalizeField(field, index) {
  if (!isPlainObject(field)) return null;
  const name = safeIdentifier(field.name, `field-${index + 1}`);
  const type = ["text", "textarea", "email", "number", "date"].includes(field.type) ? field.type : "text";
  const maxLength = Number.isInteger(field.maxLength) ? Math.max(1, Math.min(field.maxLength, 2000)) : null;
  return {
    name,
    label: String(field.label || field.name || `信息 ${index + 1}`),
    type,
    required: field.required === true,
    maxLength,
    placeholder: field.placeholder ? String(field.placeholder) : null
  };
}

function legacyMusicContribution(interaction) {
  const singerOptional = interaction?.musicRequest?.singerOptional !== false;
  return {
    id: "music",
    title: "点歌与祝福",
    description: "把想听的歌和想说的话留给新人。",
    submitLabel: "保存本地点歌",
    storageKey: "weddingInvitation.music",
    fields: [
      { name: "name", label: "留言人", type: "text", required: true, maxLength: 80 },
      { name: "song", label: "歌曲", type: "text", required: true, maxLength: 120 },
      { name: "singer", label: "歌手（可选）", type: "text", required: !singerOptional, maxLength: 120 },
      { name: "message", label: "祝福", type: "textarea", required: false, maxLength: 500 }
    ]
  };
}

function normalizeGuestContributions(interaction) {
  const configured = Array.isArray(interaction?.guestContributions) ? interaction.guestContributions : [];
  const source = configured.length ? configured : (interaction?.musicRequest ? [legacyMusicContribution(interaction)] : []);
  const ids = new Set();
  const storageKeys = new Set();
  return source.map((item, index) => {
    if (!isPlainObject(item)) return null;
    let id = safeIdentifier(item.id, `guest-${index + 1}`);
    while (ids.has(id) || id === "rsvp" || RESERVED_RECORD_IDS.has(id)) id = `${id}-entry`;
    ids.add(id);
    const fields = Array.isArray(item.fields) ? item.fields.map(normalizeField).filter(Boolean) : [];
    if (!fields.length) return null;
    const defaultStorageKey = `${STORAGE_KEY_PREFIX}${id}`;
    let storageKey = typeof item.storageKey === "string" ? item.storageKey.trim() : "";
    if (!STORAGE_KEY_PATTERN.test(storageKey) || storageKey === RSVP_STORAGE_KEY || storageKey.startsWith(VISUAL_PREFERENCE_STORAGE_PREFIX)) storageKey = defaultStorageKey;
    const storageKeyBase = storageKey;
    let suffix = 2;
    while (storageKeys.has(storageKey) || storageKey === RSVP_STORAGE_KEY) storageKey = `${storageKeyBase}-${suffix++}`;
    storageKeys.add(storageKey);
    return {
      id,
      title: String(item.title || "宾客留言"),
      description: item.description ? String(item.description) : null,
      submitLabel: String(item.submitLabel || "保存留言"),
      storageKey,
      fields
    };
  }).filter(Boolean);
}

function renderProfileCard(partner, fallbackLabel) {
  const profile = partner || {};
  const name = escapeHtml(profile.name === null || profile.name === undefined || profile.name === "" ? fallbackLabel : profile.name);
  const cues = [];
  if (profile.occupation) cues.push(`职业：${escapeHtml(profile.occupation)}`);
  if (profile.mbti) cues.push(`MBTI：${escapeHtml(profile.mbti)}`);
  if (profile.identityCue) {
    const identity = Array.isArray(profile.identityCue) ? profile.identityCue.join("、") : profile.identityCue;
    cues.push(escapeHtml(identity));
  }
  return `<article class="profile-card"><h3>${name}</h3><p>${cues.length ? cues.join(" · ") : "身份线索待确认"}</p></article>`;
}

function renderGuestContributions(contributions) {
  return contributions.map((contribution) => {
    const fields = contribution.fields.map((field) => {
      const attributes = [
        `name="${escapeHtml(field.name)}"`,
        field.required ? "required" : "",
        field.maxLength ? `maxlength="${field.maxLength}"` : "",
        field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : ""
      ].filter(Boolean).join(" ");
      const control = field.type === "textarea"
        ? `<textarea ${attributes}></textarea>`
        : `<input type="${escapeHtml(field.type)}" ${attributes}>`;
      return `<label>${escapeHtml(field.label)}${control}</label>`;
    }).join("\n");
    return `<form class="guest-form" data-contribution-id="${escapeHtml(contribution.id)}"><h3>${escapeHtml(contribution.title)}</h3>${contribution.description ? `<p class="guest-form-description">${escapeHtml(contribution.description)}</p>` : ""}${fields}<button type="submit">${escapeHtml(contribution.submitLabel)}</button><p data-status role="status"></p></form>`;
  }).join("\n");
}

function renderThemeTokens(design) {
  const theme = design?.theme || {};
  const motifs = Array.isArray(theme.motifs) ? theme.motifs : [];
  const values = [
    design?.basePalette?.name,
    design?.texture,
    design?.composition,
    design?.typography?.chinese,
    design?.typography?.latin,
    ...motifs
  ].filter(Boolean).map((value) => `<li>${escapeHtml(value)}</li>`);
  return values.join("\n");
}

function safeColor(value, fallback) {
  const match = String(value || "").trim().match(/^#[0-9a-f]{6}$/i);
  return match ? match[0].toLowerCase() : fallback;
}

function visualPalette(design) {
  const baseOption = VISUAL_PALETTE_OPTIONS[0];
  const preferenceColors = design?.visualPreference?.confirmed === true && Array.isArray(design.visualPreference.colors)
    ? design.visualPreference.colors
    : [];
  const baseColors = Array.isArray(design?.basePalette?.colors) ? design.basePalette.colors : [];
  const accentColors = Array.isArray(design?.accentPalette?.colors) ? design.accentPalette.colors : [];
  const fallback = baseOption.colors;
  return [
    safeColor(preferenceColors[0], safeColor(baseColors[0], fallback[0])),
    safeColor(preferenceColors[1], safeColor(accentColors[0], fallback[1])),
    safeColor(preferenceColors[2], safeColor(accentColors[1], fallback[2])),
    safeColor(preferenceColors[3], safeColor(accentColors[2], fallback[3]))
  ];
}

function profileVisualCue(profile, fallback) {
  const identity = Array.isArray(profile?.identityCue) ? profile.identityCue.join("、") : profile?.identityCue;
  return String(profile?.occupation || identity || fallback || "").trim() || fallback;
}

function visualMode(profile, configured, index) {
  const candidate = typeof configured === "string" ? configured : configured?.motif || configured?.shape || configured?.mode;
  if (["route", "bloom", "orbit", "wave"].includes(candidate)) return candidate;
  const cue = `${profile?.occupation || ""} ${Array.isArray(profile?.identityCue) ? profile.identityCue.join(" ") : profile?.identityCue || ""}`;
  if (/花|植物|园艺|自然|陶艺|手作|烘焙|料理/.test(cue)) return "bloom";
  if (/规划|建筑|工程|数据|研究|程序|设计|地图|城市/.test(cue)) return "route";
  return index === 0 ? "route" : "bloom";
}

function visualModeLabel(mode) {
  return { route: "路线隐喻", bloom: "生长隐喻", orbit: "轨迹隐喻", wave: "流动隐喻" }[mode] || "个人线索";
}

function renderThemeVisual(design, couple) {
  const theme = design?.theme || {};
  const palette = visualPalette(design);
  const partnerA = couple?.partnerA || {};
  const partnerB = couple?.partnerB || {};
  const cueA = profileVisualCue(partnerA, "新人 A");
  const cueB = profileVisualCue(partnerB, "新人 B");
  const modeA = visualMode(partnerA, design?.visualLanguage?.partnerA, 0);
  const modeB = visualMode(partnerB, design?.visualLanguage?.partnerB, 1);
  const themeName = theme.name || "共同主题";
  const motifs = (Array.isArray(theme.motifs) ? theme.motifs : []).filter(Boolean).slice(0, 4);
  const motifText = motifs.length ? motifs.join(" · ") : "共同主题节点";
  const hasProfileFacts = [partnerA.occupation, partnerA.identityCue, partnerB.occupation, partnerB.identityCue].some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value));
  const hasThemeFacts = Boolean(theme.name || theme.description || motifs.length);
  const isPending = !hasProfileFacts && !hasThemeFacts;
  const ariaLabel = isPending
    ? "视觉方向预览：待补充新人 Profile 与婚礼主题"
    : hasProfileFacts
      ? `${themeName}：${cueA}与${cueB}的职业隐喻，${motifText}`
      : `${themeName}：由主题线索组成的路线与花瓣视觉，${motifText}`;
  const captionTitle = isPending ? "视觉方向待确认" : themeName;
  const captionText = isPending ? "待补充新人 Profile 与婚礼主题" : motifText;
  const routePath = {
    route: "M28 150 C118 150 132 54 232 72 S332 188 432 116 S484 88 512 46",
    wave: "M28 142 C112 48 190 198 282 100 S430 52 512 118",
    orbit: "M28 146 C82 68 180 34 260 98 C334 162 414 164 512 64",
    bloom: "M28 170 C92 154 118 106 170 118 C222 132 266 100 310 72"
  }[modeA] || "M28 150 C118 150 132 54 232 72 S332 188 432 116 S484 88 512 46";
  const bloomPath = {
    bloom: "M304 178 C336 130 356 112 382 94 C414 72 452 74 482 46",
    orbit: "M286 176 C318 72 428 44 482 110 C520 156 446 198 374 162",
    wave: "M296 170 C344 110 354 168 402 106 S452 58 488 82",
    route: "M292 172 L344 126 L386 132 L428 76 L482 46"
  }[modeB] || "M304 178 C336 130 356 112 382 94 C414 72 452 74 482 46";
  const petals = [
    [402, 74, -26], [425, 62, 18], [447, 78, 54], [421, 88, 92], [398, 94, 144]
  ].map(([cx, cy, rotation]) => `<ellipse cx="${cx}" cy="${cy}" rx="13" ry="27" transform="rotate(${rotation} ${cx} ${cy})"></ellipse>`).join("");
  const grid = Array.from({ length: 7 }, (_, index) => `<line x1="${56 + index * 68}" y1="22" x2="${56 + index * 68}" y2="190"></line>`).join("");
  const horizontalGrid = Array.from({ length: 4 }, (_, index) => `<line x1="24" y1="${50 + index * 44}" x2="520" y2="${50 + index * 44}"></line>`).join("");
  return `<section class="theme-visual" data-profile-a="${escapeHtml(cueA)}" data-profile-b="${escapeHtml(cueB)}" data-mode-a="${escapeHtml(modeA)}" data-mode-b="${escapeHtml(modeB)}" data-pending="${isPending}" data-theme="${escapeHtml(themeName)}" style="--theme-base-color:${palette[0]};--theme-ink-color:${palette[1]};--theme-accent-a:${palette[2]};--theme-accent-b:${palette[3]}">
  <div class="theme-visual-header"><span class="theme-visual-person theme-visual-person-a"><strong>${escapeHtml(cueA)}</strong><small>${escapeHtml(isPending ? "待确认" : hasProfileFacts ? visualModeLabel(modeA) : "主题线索")}</small></span><span class="theme-visual-join" aria-hidden="true">×</span><span class="theme-visual-person theme-visual-person-b"><strong>${escapeHtml(cueB)}</strong><small>${escapeHtml(isPending ? "待确认" : hasProfileFacts ? visualModeLabel(modeB) : "主题线索")}</small></span></div>
  <div class="theme-visual-stage"><svg viewBox="0 0 540 210" role="img" aria-label="${escapeHtml(ariaLabel)}">
    <g class="theme-grid" aria-hidden="true">${grid}${horizontalGrid}</g>
    <path class="theme-route" d="${routePath}"></path>
    <path class="theme-route theme-route-secondary" d="${bloomPath}"></path>
    <g class="theme-bloom" aria-hidden="true">${petals}<circle cx="422" cy="78" r="9"></circle></g>
    <circle class="theme-node theme-node-a" cx="232" cy="72" r="8"></circle>
    <circle class="theme-node theme-node-b" cx="422" cy="78" r="8"></circle>
    <circle class="theme-node theme-node-shared" cx="374" cy="162" r="6"></circle>
  </svg><span class="theme-visual-label theme-visual-label-a">${escapeHtml(cueA)}</span><span class="theme-visual-label theme-visual-label-b">${escapeHtml(cueB)}</span></div>
  <p class="theme-visual-caption"><strong>${escapeHtml(captionTitle)}</strong><span>${escapeHtml(captionText)}</span></p>
</section>`;
}

function renderVisualPreferenceOptions(design) {
  const selectedId = design?.visualPreference?.confirmed === true ? design.visualPreference.id : "";
  return VISUAL_PALETTE_OPTIONS.map((option) => {
    const [base, ink, accentA, accentB] = option.colors;
    const checked = selectedId === option.id ? " checked" : "";
    return `<label class="visual-preference-card" data-palette-id="${option.id}" style="--option-base:${base};--option-ink:${ink};--option-accent-a:${accentA};--option-accent-b:${accentB}"><input type="radio" name="visualPreference" value="${option.id}"${checked}><span class="visual-preference-art" aria-hidden="true"><span class="visual-preference-grid"></span><span class="visual-preference-route"></span><span class="visual-preference-bloom"></span><span class="visual-preference-swatches"><i></i><i></i><i></i><i></i></span></span><span class="visual-preference-copy"><strong>${escapeHtml(option.label)}</strong><small>${escapeHtml(option.description)}</small><em>${escapeHtml(option.motif)}</em></span></label>`;
  }).join("\n");
}

function visualPreferenceJson(design) {
  const selectedId = design?.visualPreference?.confirmed === true ? design.visualPreference.id : null;
  return VISUAL_PALETTE_OPTIONS.map((option) => ({
    ...option,
    selected: option.id === selectedId
  }));
}

function render(templatePath, replacements) {
  let output = fs.readFileSync(templatePath, "utf8");
  for (const [token, value] of Object.entries(replacements)) output = output.replaceAll(`__${token}__`, value);
  return output;
}

function copySelectedAssets(assetRoot, outputRoot, items) {
  for (const item of items) {
    const source = path.join(assetRoot, ...item.path.split("/"));
    const destination = path.join(outputRoot, "assets", ...item.path.split("/"));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
}

function validateOutputPath(assetRoot, outputRoot) {
  const source = path.resolve(assetRoot);
  const output = path.resolve(outputRoot);
  const outputToSource = path.relative(output, source);
  if (outputToSource === "" || (!outputToSource.startsWith(`..${path.sep}`) && outputToSource !== ".." && !path.isAbsolute(outputToSource))) {
    throw new Error("Output directory must not contain the source asset directory.");
  }
  const sourceToOutput = path.relative(source, output);
  if (sourceToOutput && !sourceToOutput.startsWith(`..${path.sep}`) && sourceToOutput !== ".." && !path.isAbsolute(sourceToOutput)) {
    const firstSegment = sourceToOutput.split(path.sep)[0];
    if (!firstSegment.startsWith(".")) {
      throw new Error("Output directory inside the asset directory must be a hidden child such as .wedding-invitation.");
    }
  }
}

function createProject({ assetRoot, outputRoot, brief }) {
  if (!fs.existsSync(assetRoot) || !fs.statSync(assetRoot).isDirectory()) throw new Error(`Assets directory not found: ${assetRoot}`);
  validateOutputPath(assetRoot, outputRoot);
  const { items, warnings } = scanAssets(assetRoot);
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true });
  copySelectedAssets(assetRoot, outputRoot, items);

  const templateRoot = path.join(__dirname, "..", "templates");
  const imageItems = items.filter((item) => (item.mediaType || item.role) === "image");
  const configuredGalleryPaths = Array.isArray(brief.gallery?.paths) ? brief.gallery.paths.map((item) => String(item).split(path.sep).join("/")) : null;
  const galleryItems = configuredGalleryPaths
    ? imageItems.filter((item) => configuredGalleryPaths.includes(item.path))
    : imageItems;
  if (configuredGalleryPaths) {
    const missingGalleryPaths = configuredGalleryPaths.filter((candidate) => !imageItems.some((item) => item.path === candidate));
    if (missingGalleryPaths.length) warnings.push(`Gallery selections were not found: ${missingGalleryPaths.join(", ")}`);
  }
  const gallery = galleryItems.map((item) => ({ ...item, url: assetUrl(item.path) }));
  const audio = items.find((item) => item.role === "audio");
  const retrospective = brief.mode === "recap" || brief.mode === "retrospective";
  const guestContributions = normalizeGuestContributions(brief.interaction);
  const backgroundMusicEnabled = brief.interaction?.backgroundMusic === true
    || (brief.interaction?.backgroundMusic === undefined && brief.interaction?.music === true);
  const display = (value, fallback) => escapeHtml(value === null || value === undefined || value === "" ? fallback : value);
  const enabledFlag = (value) => value === true;
  const partnerNames = [brief.couple?.partnerA?.name, brief.couple?.partnerB?.name].filter(Boolean);
  const venue = brief.event?.venue || {};
  const design = brief.design || {};
  const theme = design.theme || {};
  const visualPreferenceStorageKey = `${STORAGE_KEY_PREFIX}visualPreference.${hashString(path.resolve(outputRoot))}`;
  const storyArc = brief.couple?.story?.relationshipArc;
  const confirmedStory = brief.couple?.story?.confirmedCopy;
  const replacements = {
    HERO_EYEBROW: retrospective ? "Wedding memories" : "Wedding invitation",
    TITLE: escapeHtml(retrospective ? (brief.copy?.recapTitle || "婚礼已圆满落幕") : (brief.copy?.invitationTitle || "婚礼邀请函")),
    INTRO: escapeHtml(retrospective ? (brief.copy?.thanks || "感谢每一份关注、陪伴与祝福") : (brief.copy?.invitationIntro || "我们诚挚邀请您见证这一天")),
    CONTINUE_LABEL: escapeHtml(brief.copy?.continueLabel || "继续查看电子请柬"),
    CONTINUE_HIDDEN: retrospective ? "" : "hidden",
    INVITATION_HIDDEN: retrospective ? "hidden" : "",
    RECAP_MODE: JSON.stringify(retrospective),
    COUPLE_NAMES: partnerNames.length ? partnerNames.map(escapeHtml).join(" 与 ") : "新人信息待确认",
    STORY: display(storyArc, "故事待确认"),
    STORY_COPY: confirmedStory ? `<p class="story-copy">${escapeHtml(confirmedStory)}</p>` : "",
    PROFILE_HTML: `${renderProfileCard(brief.couple?.partnerA, "新人 A 待确认")}\n${renderProfileCard(brief.couple?.partnerB, "新人 B 待确认")}`,
    THEME_NAME: display(theme.name, "婚礼主题待确认"),
    THEME_DESCRIPTION: display(theme.description, display(design.texture, "主题描述待确认")),
    THEME_TOKENS_HTML: renderThemeTokens(design),
    THEME_VISUAL_HTML: renderThemeVisual(design, brief.couple),
    VISUAL_PREFERENCE_OPTIONS_HTML: renderVisualPreferenceOptions(design),
    VISUAL_PREFERENCE_JSON: jsonForScript(visualPreferenceJson(design)),
    VISUAL_PREFERENCE_STORAGE_KEY: jsonForScript(visualPreferenceStorageKey),
    VISUAL_PREFERENCE_BRIEF_ID: jsonForScript(design.visualPreference?.id || null),
    VISUAL_PREFERENCE_BRIEF_CONFIRMED: JSON.stringify(design.visualPreference?.confirmed === true),
    EVENT_DATE: display(brief.event?.date, "日期待确认"),
    EVENT_FORMAT: display(brief.event?.format, "婚礼形式待确认"),
    VENUE: display(venue.shortName, "场地待确认"),
    ADDRESS: display(venue.address, "地址待确认"),
    GALLERY_JSON: jsonForScript(gallery),
    AUDIO_URL: jsonForScript(audio ? assetUrl(audio.path) : ""),
    RSVP_ENABLED: JSON.stringify(enabledFlag(brief.interaction?.rsvp)),
    MUSIC_ENABLED: JSON.stringify(backgroundMusicEnabled),
    GUEST_CONTRIBUTIONS_HTML: renderGuestContributions(guestContributions),
    GUEST_CONTRIBUTIONS_JSON: jsonForScript(guestContributions)
  };
  for (const file of ["index.html", "styles.css", "app.js", "admin.html", "admin.js", "visual-preferences.html"]) {
    fs.copyFileSync(path.join(templateRoot, file), path.join(outputRoot, file));
    const rendered = render(path.join(templateRoot, file), replacements);
    fs.writeFileSync(path.join(outputRoot, file), rendered, "utf8");
  }
  fs.writeFileSync(path.join(outputRoot, "asset-manifest.json"), JSON.stringify({ version: "0.1", items, warnings }, null, 2) + "\n");
  fs.writeFileSync(path.join(outputRoot, "brief.json"), JSON.stringify(brief, null, 2) + "\n");
  const pending = [
    "approved assets",
    "confirmed event facts",
    "production target",
    "production RSVP idempotency and authenticated storage",
    "music auto-play and low-volume cross-browser strategy",
    "share cards, /notice/ page, and cloud backend",
    "EXIF cleanup, compression, and image size limits"
  ];
  if (!brief.design?.visualPreference?.id || brief.design.visualPreference.confirmed !== true) pending.push("visual preference selection from the visual board");
  if (brief.workflow?.briefConfirmed !== true) pending.unshift("brief confirmation");
  if (Array.isArray(brief.pending)) pending.push(...brief.pending.map(String));
  fs.writeFileSync(path.join(outputRoot, "release-record.json"), JSON.stringify({
    version: "0.1",
    source: { commit: null, remoteCommit: null, verifiedAt: null },
    authorization: brief.authorization || { assets: "pending", publish: false },
    backend: { provider: null, migrations: [], functionRevision: null, checks: [] },
    frontend: { provider: null, deploymentId: null, url: null, rollbackVersion: null },
    workflow: { mode: retrospective ? "recap" : "invitation", phase: brief.workflow?.briefConfirmed === true ? "brief-confirmed" : "draft", briefConfirmed: brief.workflow?.briefConfirmed === true, releaseAuthorized: brief.workflow?.releaseAuthorized === true || brief.authorization?.publish === true },
    checks: [{ scenario: "local static generation", result: "generated", evidence: "Run the bundled tests and serve this directory with a static HTTP server." }],
    pending: [...new Set(pending)]
  }, null, 2) + "\n");
  return { files: ["index.html", "styles.css", "app.js", "admin.html", "admin.js", "visual-preferences.html", "asset-manifest.json", "brief.json", "release-record.json"], warnings };
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const result = createProject({ assetRoot: path.resolve(args.assets), outputRoot: path.resolve(args.out), brief: readBrief(args.brief && path.resolve(args.brief)) });
  console.log(JSON.stringify(result, null, 2));
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { createProject, defaultBrief, scanAssets };
