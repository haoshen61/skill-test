const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const assert = require("node:assert/strict");

const skillRoot = path.resolve(__dirname, "..");
const cli = path.join(skillRoot, "scripts", "create-invitation.js");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "wedding-skill-"));
  const assets = path.join(root, "materials");
  const out = path.join(root, "generated");
  fs.mkdirSync(path.join(assets, "photos"), { recursive: true });
  fs.writeFileSync(path.join(assets, "photos", "first.jpg"), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
  fs.writeFileSync(path.join(assets, "music.mp3"), Buffer.from("ID3demo"));
  fs.writeFileSync(path.join(assets, "notes.txt"), "not a runtime asset");
  fs.writeFileSync(path.join(assets, ".env.local"), "SECRET=must-not-copy");
  return { root, assets, out };
}

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
}

test("generates an asset manifest and future-first static project", () => {
  const { assets, out } = fixture();
  const result = run(["--assets", assets, "--out", out]);
  assert.equal(result.status, 0, result.stderr);

  const manifest = JSON.parse(fs.readFileSync(path.join(out, "asset-manifest.json"), "utf8"));
  assert.deepEqual(manifest.items.map((item) => item.path), ["music.mp3", "photos/first.jpg"]);
  assert.equal(manifest.items[0].privacy, "pending");
  assert.equal(manifest.items[0].license, "unknown");
  assert.equal(fs.existsSync(path.join(out, "assets", "photos", "first.jpg")), true);
  assert.equal(fs.existsSync(path.join(out, "assets", ".env.local")), false);
  assert.equal(fs.existsSync(path.join(out, "admin.html")), true);
  assert.equal(fs.existsSync(path.join(out, "admin.js")), true);

  const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
  const styles = fs.readFileSync(path.join(out, "styles.css"), "utf8");
  const script = fs.readFileSync(path.join(out, "app.js"), "utf8");
  const adminScript = fs.readFileSync(path.join(out, "admin.js"), "utf8");
  assert.match(html, /婚礼邀请函/);
  assert.match(html, /我们诚挚邀请您见证这一天/);
  assert.match(html, /rel="icon"/);
  assert.match(styles, /\.guest-form/);
  assert.match(html, /gallery-loading/);
  assert.match(script, /pending|loading/i);
  assert.match(script, /localStorage/);
  assert.match(script, /prefers-reduced-motion/);
  assert.match(adminScript, /textContent/);
  assert.doesNotMatch(adminScript, /records\.innerHTML/);
});

test("defaults to a future invitation and keeps retrospective mode opt-in", () => {
  const { assets, out } = fixture();
  const result = run(["--assets", assets, "--out", out]);
  assert.equal(result.status, 0, result.stderr);

  const brief = JSON.parse(fs.readFileSync(path.join(out, "brief.json"), "utf8"));
  const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
  assert.equal(brief.mode, "invitation");
  assert.deepEqual(brief.sections, ["cover", "story", "details", "rsvp", "music", "thanks"]);
  assert.match(html, /婚礼邀请函/);
  assert.doesNotMatch(html, /婚礼已圆满落幕/);
  assert.doesNotMatch(html, /Wedding memories/);
  assert.match(html, /id="continue"[^>]*hidden[^>]*>继续查看电子请柬/);
});

test("retrospective mode is explicit and does not become the default", () => {
  const { assets, out } = fixture();
  const brief = path.join(path.dirname(out), "retrospective.json");
  fs.writeFileSync(brief, JSON.stringify({ mode: "recap", workflow: { briefConfirmed: true } }));
  const result = run(["--assets", assets, "--out", out, "--brief", brief]);
  assert.equal(result.status, 0, result.stderr);

  const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
  assert.match(html, /婚礼已圆满落幕/);
  assert.match(html, /Wedding memories/);
  assert.match(html, /继续查看电子请柬/);
});

test("empty asset directories generate pending records instead of inventing facts", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "wedding-empty-"));
  const assets = path.join(root, "materials");
  const out = path.join(root, "generated");
  fs.mkdirSync(assets);
  const result = run(["--assets", assets, "--out", out]);
  assert.equal(result.status, 0, result.stderr);

  const manifest = JSON.parse(fs.readFileSync(path.join(out, "asset-manifest.json"), "utf8"));
  const brief = JSON.parse(fs.readFileSync(path.join(out, "brief.json"), "utf8"));
  assert.deepEqual(manifest.items, []);
  assert.ok(manifest.warnings.some((warning) => /no supported assets/i.test(warning)));
  assert.equal(brief.event.date, null);
  assert.equal(brief.couple.partnerA.name, null);
  assert.equal(brief.authorization.publish, false);
});

test("rejects malformed briefs without modifying source materials", () => {
  const { assets, out } = fixture();
  const brief = path.join(path.dirname(out), "bad.json");
  fs.writeFileSync(brief, "{bad");
  const result = run(["--assets", assets, "--out", out, "--brief", brief]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /JSON|brief/i);
  assert.equal(fs.existsSync(path.join(assets, "photos", "first.jpg")), true);
});

test("renders confirmed couple and event facts into the invitation", () => {
  const { assets, out } = fixture();
  const brief = path.join(path.dirname(out), "confirmed.json");
  fs.writeFileSync(brief, JSON.stringify({
    couple: { partnerA: { name: "Alice" }, partnerB: { name: "Bob" }, story: { relationshipArc: "从朋友到爱人" } },
    event: { date: "2030-05-20", dateConfirmed: true, format: "晚宴", venue: { shortName: "花园厅", address: "幸福路 1 号" } },
    authorization: { assets: "approved", publish: false }
  }));
  const result = run(["--assets", assets, "--out", out, "--brief", brief]);
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
  for (const fact of ["Alice", "Bob", "从朋友到爱人", "2030-05-20", "花园厅", "幸福路 1 号"]) assert.match(html, new RegExp(fact));
  assert.doesNotMatch(html, /brief\.json 中标记为 null/);
});

test("deep-merges partial briefs while retaining pending defaults", () => {
  const { assets, out } = fixture();
  const brief = path.join(path.dirname(out), "partial.json");
  fs.writeFileSync(brief, JSON.stringify({
    couple: { partnerA: { name: "Alice" } },
    authorization: { publish: true }
  }));
  const result = run(["--assets", assets, "--out", out, "--brief", brief]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(fs.readFileSync(path.join(out, "brief.json"), "utf8"));
  assert.equal(parsed.couple.partnerA.name, "Alice");
  assert.equal(parsed.couple.partnerB.name, null);
  assert.equal(parsed.authorization.assets, "pending");
  assert.equal(parsed.authorization.publish, true);
});

test("honors disabled music and RSVP interaction flags", () => {
  const { assets, out } = fixture();
  const brief = path.join(path.dirname(out), "disabled-interactions.json");
  fs.writeFileSync(brief, JSON.stringify({ interaction: { music: "false", rsvp: "false" } }));
  const result = run(["--assets", assets, "--out", out, "--brief", brief]);
  assert.equal(result.status, 0, result.stderr);
  const script = fs.readFileSync(path.join(out, "app.js"), "utf8");
  assert.match(script, /if \(audioUrl && musicEnabled\)/);
  assert.match(script, /if \(musicEnabled\) saveLocal/);
  assert.match(script, /if \(rsvpEnabled\) saveLocal/);
});

test("encodes asset URL segments for browser-safe gallery paths", () => {
  const { assets, out } = fixture();
  fs.writeFileSync(path.join(assets, "photos", "engagement photo #1.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const result = run(["--assets", assets, "--out", out]);
  assert.equal(result.status, 0, result.stderr);
  const script = fs.readFileSync(path.join(out, "app.js"), "utf8");
  assert.match(script, /assets\/photos\/engagement%20photo%20%231\.png/);
});

test("uses confirmed gallery paths and preserves source manifest labels", () => {
  const { assets, out } = fixture();
  fs.writeFileSync(path.join(assets, "reference.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  fs.writeFileSync(path.join(assets, "manifest.json"), JSON.stringify({ items: [
    { path: "photos/first.jpg", role: "gallery-image", privacy: "private-demo-material", license: "demo-only", notes: "keep private" },
    { path: "reference.png", role: "visual-reference", privacy: "design-reference", license: "reference only" }
  ] }));
  const brief = path.join(path.dirname(out), "gallery.json");
  fs.writeFileSync(brief, JSON.stringify({ gallery: { paths: ["photos/first.jpg"] } }));

  const result = run(["--assets", assets, "--out", out, "--brief", brief]);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(fs.readFileSync(path.join(out, "asset-manifest.json"), "utf8"));
  const selected = manifest.items.find((item) => item.path === "photos/first.jpg");
  assert.equal(selected.assetRole, "gallery-image");
  assert.equal(selected.privacy, "private-demo-material");
  assert.equal(selected.license, "demo-only");
  const script = fs.readFileSync(path.join(out, "app.js"), "utf8");
  assert.match(script, /photos\/first\.jpg/);
  assert.doesNotMatch(script, /reference\.png/);
});

test("keeps local RSVP identity updates and optional singer input explicit", () => {
  const { assets, out } = fixture();
  const brief = path.join(path.dirname(out), "interactions.json");
  fs.writeFileSync(brief, JSON.stringify({ interaction: { rsvp: true, music: true } }));
  const result = run(["--assets", assets, "--out", out, "--brief", brief]);
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
  const script = fs.readFileSync(path.join(out, "app.js"), "utf8");
  assert.match(html, /name="singer"/);
  assert.match(script, /findIndex/);
  assert.match(script, /guestName/);
  assert.match(script, /contactSuffix/);
  assert.match(script, /已更新本机演示数据/);
});

test("records portable generator limitations in the release record", () => {
  const { assets, out } = fixture();
  const result = run(["--assets", assets, "--out", out]);
  assert.equal(result.status, 0, result.stderr);
  const release = JSON.parse(fs.readFileSync(path.join(out, "release-record.json"), "utf8"));
  assert.ok(release.pending.some((item) => /production RSVP/i.test(item)));
  assert.ok(release.pending.some((item) => /auto-play|自动播放/i.test(item)));
  assert.ok(release.pending.some((item) => /share card|分享卡片/i.test(item)));
});
