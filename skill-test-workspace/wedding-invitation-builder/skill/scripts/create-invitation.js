#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".ogg", ".wav", ".aac"]);
const SECRET_SEGMENTS = new Set([".cloudbase", ".tcb", ".git"]);

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

function scanAssets(assetRoot) {
  const items = [];
  const warnings = [];

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
      items.push({
        id: relative.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "asset",
        path: relative,
        role,
        source: relative,
        bytes: stat.size,
        privacy: "pending",
        license: "unknown",
        allowedTransformations: []
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
    couple: { partnerA: { name: null }, partnerB: { name: null }, story: { relationshipArc: null } },
    event: { date: null, dateConfirmed: false, format: null, times: [], venue: { shortName: null, address: null, mapUrl: null } },
    design: { basePalette: { name: "soft paper", colors: ["#f4eee5"] }, accentPalette: { colors: ["#6f5547"] }, texture: "paper", composition: "mixed", typography: { chinese: "system serif", latin: "system sans" } },
    sections: ["recap", "cover", "story", "details", "rsvp", "music", "thanks"],
    copy: { recapTitle: "婚礼已圆满落幕", thanks: "感谢每一份关注、陪伴与祝福", continueLabel: "继续查看电子请柬" },
    interaction: { gallery: true, music: true, rsvp: false, reducedMotion: true },
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

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}

function assetUrl(relative) {
  return `assets/${relative.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`;
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
  const gallery = items.filter((item) => item.role === "image").map((item) => ({ ...item, url: assetUrl(item.path) }));
  const audio = items.find((item) => item.role === "audio");
  const display = (value, fallback) => escapeHtml(value === null || value === undefined || value === "" ? fallback : value);
  const enabledFlag = (value) => value === true;
  const partnerNames = [brief.couple?.partnerA?.name, brief.couple?.partnerB?.name].filter(Boolean);
  const venue = brief.event?.venue || {};
  const replacements = {
    TITLE: escapeHtml(brief.copy?.recapTitle || "婚礼已圆满落幕"),
    THANKS: escapeHtml(brief.copy?.thanks || "感谢每一份关注、陪伴与祝福"),
    CONTINUE_LABEL: escapeHtml(brief.copy?.continueLabel || "继续查看电子请柬"),
    COUPLE_NAMES: partnerNames.length ? partnerNames.map(escapeHtml).join(" 与 ") : "新人信息待确认",
    STORY: display(brief.couple?.story?.relationshipArc, "故事待确认"),
    EVENT_DATE: display(brief.event?.date, "日期待确认"),
    EVENT_FORMAT: display(brief.event?.format, "婚礼形式待确认"),
    VENUE: display(venue.shortName, "场地待确认"),
    ADDRESS: display(venue.address, "地址待确认"),
    GALLERY_JSON: jsonForScript(gallery),
    AUDIO_URL: jsonForScript(audio ? assetUrl(audio.path) : ""),
    RSVP_ENABLED: JSON.stringify(enabledFlag(brief.interaction?.rsvp)),
    MUSIC_ENABLED: JSON.stringify(enabledFlag(brief.interaction?.music))
  };
  for (const file of ["index.html", "styles.css", "app.js", "admin.html", "admin.js"]) {
    fs.copyFileSync(path.join(templateRoot, file), path.join(outputRoot, file));
    const rendered = render(path.join(templateRoot, file), replacements);
    fs.writeFileSync(path.join(outputRoot, file), rendered, "utf8");
  }
  fs.writeFileSync(path.join(outputRoot, "asset-manifest.json"), JSON.stringify({ version: "0.1", items, warnings }, null, 2) + "\n");
  fs.writeFileSync(path.join(outputRoot, "brief.json"), JSON.stringify(brief, null, 2) + "\n");
  fs.writeFileSync(path.join(outputRoot, "release-record.json"), JSON.stringify({
    version: "0.1",
    source: { commit: null, remoteCommit: null, verifiedAt: null },
    authorization: brief.authorization || { assets: "pending", publish: false },
    backend: { provider: null, migrations: [], functionRevision: null, checks: [] },
    frontend: { provider: null, deploymentId: null, url: null, rollbackVersion: null },
    checks: [{ scenario: "local static generation", result: "generated", evidence: "Run the bundled tests and serve this directory with a static HTTP server." }],
    pending: warnings.length ? ["approved assets", "confirmed event facts", "production target"] : ["approved assets", "confirmed event facts", "production target"]
  }, null, 2) + "\n");
  return { files: ["index.html", "styles.css", "app.js", "admin.html", "admin.js", "asset-manifest.json", "brief.json", "release-record.json"], warnings };
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
