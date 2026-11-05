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
  assert.deepEqual(brief.sections, ["cover", "story", "details", "rsvp", "guest-notes", "thanks"]);
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

test("renders personalized couple profiles and wedding theme without internal delivery notes", () => {
  const { assets, out } = fixture();
  const brief = path.join(path.dirname(out), "personalized.json");
  fs.writeFileSync(brief, JSON.stringify({
    couple: {
      partnerA: { name: "Alice", occupation: "建筑师", mbti: "INTJ" },
      partnerB: { name: "Bob", occupation: "陶艺师", mbti: "ENFP" },
      story: { relationshipArc: "从一场雨后的散步开始", confirmedCopy: "一个画城市，一个捏泥土。" }
    },
    design: {
      theme: { name: "雨后陶土", description: "把城市线条和手作温度放进同一张邀请函。" },
      texture: "湿润纸张",
      composition: "细线地图与陶土色块"
    }
  }));
  const result = run(["--assets", assets, "--out", out, "--brief", brief]);
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
  for (const fact of ["建筑师", "INTJ", "陶艺师", "ENFP", "一个画城市，一个捏泥土。", "雨后陶土", "湿润纸张", "细线地图与陶土色块"]) {
    assert.match(html, new RegExp(fact));
  }
  assert.doesNotMatch(html, /这是一个可运行的本地入口；RSVP、点歌和生产发布仍需单独确认和配置。/);
});

test("renders a profession-led theme visual that connects profiles to motifs", () => {
  const { assets, out } = fixture();
  const brief = path.join(path.dirname(out), "profession-visual.json");
  fs.writeFileSync(brief, JSON.stringify({
    couple: {
      partnerA: { name: "沐宸", occupation: "城市规划师" },
      partnerB: { name: "若汐", occupation: "花艺师" }
    },
    design: {
      theme: { name: "城市路径与花瓣", description: "把规划的秩序和花艺的生长放在同一条路上。", motifs: ["城市路径", "植物弧线", "花瓣节点"] },
      visualLanguage: { partnerA: "route", partnerB: "bloom" },
      basePalette: { name: "浅米色纸张", colors: ["#F4EEE5"] },
      accentPalette: { colors: ["#6F5547", "#D9A9A0", "#9FB8CE"] }
    }
  }));
  const result = run(["--assets", assets, "--out", out, "--brief", brief]);
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
  const styles = fs.readFileSync(path.join(out, "styles.css"), "utf8");
  assert.match(html, /class="theme-visual"/);
  assert.match(html, /data-profile-a="城市规划师"/);
  assert.match(html, /data-profile-b="花艺师"/);
  assert.match(html, /data-mode-a="route"/);
  assert.match(html, /data-mode-b="bloom"/);
  assert.match(html, /城市路径/);
  assert.match(html, /植物弧线/);
  assert.match(html, /class="theme-route"/);
  assert.match(html, /class="theme-bloom"/);
  assert.match(html, /--theme-base-color:\s*#f4eee5/i);
  assert.match(styles, /@keyframes theme-route-draw/);
  assert.match(styles, /@keyframes theme-bloom-open/);
  assert.match(styles, /\.profile-panel, \.theme-panel\s*\{[^}]*min-width:\s*0/);
  assert.doesNotMatch(html, /code-window|typewriter/i);
});

test("generates a visual preference board when color direction is unresolved", () => {
  const { assets, out } = fixture();
  const result = run(["--assets", assets, "--out", out]);
  assert.equal(result.status, 0, result.stderr);
  const preferences = fs.readFileSync(path.join(out, "visual-preferences.html"), "utf8");
  assert.match(preferences, /选择视觉方向/);
  assert.match(preferences, /class="visual-preference-card"/);
  assert.match(preferences, /data-palette-id="paper-route"/);
  assert.match(preferences, /data-palette-id="moss-bloom"/);
  assert.match(preferences, /type="radio"/);
  assert.match(preferences, /localStorage/);
  assert.match(preferences, /复制选择/);
  assert.match(preferences, /confirmed:\s*true|confirmed\\":true/);
  assert.match(preferences, /prefers-reduced-motion/);
  assert.match(preferences, /try\s*\{[\s\S]*localStorage\.setItem/);
  assert.match(preferences, /catch\s*\{[\s\S]*浏览器未允许保存本地选择/);
});

test("marks the theme visual as pending until profile or theme facts exist", () => {
  const { assets, out } = fixture();
  const brief = path.join(path.dirname(out), "profile-without-visual-cue.json");
  fs.writeFileSync(brief, JSON.stringify({ couple: { partnerA: { name: "Alice", mbti: "INTJ" }, partnerB: { name: "Bob", mbti: "ENFP" } } }));
  const result = run(["--assets", assets, "--out", out, "--brief", brief]);
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
  assert.match(html, /data-pending="true"/);
  assert.match(html, /待补充新人 Profile 与婚礼主题/);
  assert.doesNotMatch(html, /新人 A与新人 B的职业隐喻/);
});

test("scopes visual preference storage and tolerates malformed saved JSON", () => {
  const { assets, out } = fixture();
  const result = run(["--assets", assets, "--out", out]);
  assert.equal(result.status, 0, result.stderr);
  const preferences = fs.readFileSync(path.join(out, "visual-preferences.html"), "utf8");
  assert.match(preferences, /weddingInvitation\.visualPreference\.[0-9a-f]+/i);
  assert.match(preferences, /function readSavedPreference\(\)/);
  assert.match(preferences, /try\s*\{[\s\S]*JSON\.parse/);
  assert.match(preferences, /catch\s*\{[\s\S]*return null/);
});

test("applies a confirmed visual preference palette to the theme visual", () => {
  const { assets, out } = fixture();
  const brief = path.join(path.dirname(out), "selected-visual-preference.json");
  fs.writeFileSync(brief, JSON.stringify({
    couple: { partnerA: { occupation: "建筑师" }, partnerB: { occupation: "花艺师" } },
    design: {
      theme: { name: "苔痕花期", motifs: ["枝叶", "路径"] },
      visualPreference: { id: "moss-bloom", label: "苔痕花期", colors: ["#E8E5D9", "#425246", "#C98F82", "#D8C08A"], selectionMode: "visual", confirmed: true }
    }
  }));
  const result = run(["--assets", assets, "--out", out, "--brief", brief]);
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
  const release = JSON.parse(fs.readFileSync(path.join(out, "release-record.json"), "utf8"));
  assert.match(html, /--theme-base-color:#e8e5d9/);
  assert.match(html, /--theme-ink-color:#425246/);
  assert.doesNotMatch(release.pending.join("\n"), /visual preference selection/i);
});

test("does not treat an unconfirmed visual preference as selected", () => {
  const { assets, out } = fixture();
  const brief = path.join(path.dirname(out), "pending-visual-preference.json");
  fs.writeFileSync(brief, JSON.stringify({ design: { visualPreference: { id: "moss-bloom", colors: ["#000000"], confirmed: false } } }));
  const result = run(["--assets", assets, "--out", out, "--brief", brief]);
  assert.equal(result.status, 0, result.stderr);
  const preferences = fs.readFileSync(path.join(out, "visual-preferences.html"), "utf8");
  const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
  assert.doesNotMatch(preferences, /value="moss-bloom" checked/);
  assert.match(preferences, /const briefSelectionConfirmed = false/);
  assert.doesNotMatch(html, /--theme-base-color:#000000/);
});

test("renders configured guest contribution forms without assuming a song request", () => {
  const { assets, out } = fixture();
  const brief = path.join(path.dirname(out), "guest-contribution.json");
  fs.writeFileSync(brief, JSON.stringify({
    interaction: {
      rsvp: true,
      music: false,
      guestContributions: [{
        id: "blessing",
        title: "给新人写一句话",
        description: "把想说的话留在婚礼纪念册里。",
        submitLabel: "保存祝福",
        storageKey: "weddingInvitation.blessing",
        fields: [
          { name: "name", label: "署名", type: "text", required: true, maxLength: 80 },
          { name: "message", label: "祝福", type: "textarea", required: true, maxLength: 500 }
        ]
      }]
    }
  }));
  const result = run(["--assets", assets, "--out", out, "--brief", brief]);
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
  const script = fs.readFileSync(path.join(out, "app.js"), "utf8");
  const adminScript = fs.readFileSync(path.join(out, "admin.js"), "utf8");
  assert.match(html, /给新人写一句话/);
  assert.match(html, /保存祝福/);
  assert.match(script, /weddingInvitation\.blessing/);
  assert.doesNotMatch(html, /歌曲|歌手|点歌/);
  assert.match(adminScript, /给新人写一句话/);
});

test("isolates guest contribution storage and protects reserved record keys", () => {
  const { assets, out } = fixture();
  const brief = path.join(path.dirname(out), "unsafe-contributions.json");
  fs.writeFileSync(brief, JSON.stringify({
    interaction: {
      rsvp: true,
      guestContributions: [
        { id: "__proto__", storageKey: "weddingInvitationX.bad", fields: [{ name: "message", label: "留言" }] },
        { id: "blessing", storageKey: "weddingInvitation.rsvp", fields: [{ name: "message", label: "祝福" }] }
      ]
    }
  }));
  const result = run(["--assets", assets, "--out", out, "--brief", brief]);
  assert.equal(result.status, 0, result.stderr);
  const script = fs.readFileSync(path.join(out, "app.js"), "utf8");
  const serialized = script.match(/const guestContributions = (\[[\s\S]*?\]);\nconst recapMode/);
  assert.ok(serialized, "generated app should include guest contribution configuration");
  const contributions = JSON.parse(serialized[1]);
  assert.equal(contributions.length, 2);
  assert.equal(new Set(contributions.map((item) => item.id)).size, contributions.length);
  assert.equal(new Set(contributions.map((item) => item.storageKey)).size, contributions.length);
  assert.ok(contributions.every((item) => item.storageKey.startsWith("weddingInvitation.")));
  assert.ok(contributions.every((item) => item.storageKey !== "weddingInvitation.rsvp"));
  assert.ok(contributions.every((item) => !["__proto__", "constructor", "prototype"].includes(item.id)));
  const adminScript = fs.readFileSync(path.join(out, "admin.js"), "utf8");
  assert.match(adminScript, /Object\.create\(null\)/);
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
  fs.writeFileSync(brief, JSON.stringify({ interaction: { backgroundMusic: false, rsvp: false } }));
  const result = run(["--assets", assets, "--out", out, "--brief", brief]);
  assert.equal(result.status, 0, result.stderr);
  const script = fs.readFileSync(path.join(out, "app.js"), "utf8");
  const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
  assert.match(script, /if \(audioUrl && musicEnabled\)/);
  assert.match(script, /if \(rsvpEnabled\) saveLocal/);
  assert.match(script, /const guestContributions = \[\]/);
  assert.doesNotMatch(html, /点歌/);
});

test("keeps background music separate from guest point-song contributions", () => {
  const { assets, out } = fixture();
  const brief = path.join(path.dirname(out), "background-music.json");
  fs.writeFileSync(brief, JSON.stringify({
    interaction: { backgroundMusic: true, guestContributions: [] }
  }));
  const result = run(["--assets", assets, "--out", out, "--brief", brief]);
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
  const script = fs.readFileSync(path.join(out, "app.js"), "utf8");
  assert.match(script, /const musicEnabled = true/);
  assert.match(script, /if \(audioUrl && musicEnabled\)/);
  assert.doesNotMatch(html, /歌曲|歌手|点歌/);
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
  fs.writeFileSync(brief, JSON.stringify({ interaction: { rsvp: true, music: true, musicRequest: { singerOptional: true } } }));
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
