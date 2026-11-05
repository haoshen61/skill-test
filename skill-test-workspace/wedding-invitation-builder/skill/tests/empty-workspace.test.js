const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const assert = require("node:assert/strict");

const skillRoot = path.resolve(__dirname, "..");
const cli = path.join(skillRoot, "scripts", "create-invitation.js");

test("runs when the workspace contains only user materials", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "wedding-empty-workspace-"));
  const workspace = path.join(root, "materials only");
  const output = path.join(root, "generated");
  fs.mkdirSync(workspace);
  fs.writeFileSync(path.join(workspace, "portrait.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  fs.writeFileSync(path.join(workspace, "music.mp3"), "ID3");

  const result = spawnSync(process.execPath, [cli, "--assets", workspace, "--out", output], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(fs.readdirSync(workspace).sort(), ["music.mp3", "portrait.png"]);
  for (const file of ["asset-manifest.json", "brief.json", "release-record.json", "index.html", "styles.css", "app.js", "admin.html", "admin.js"]) {
    assert.equal(fs.existsSync(path.join(output, file)), true, `missing ${file}`);
  }
  const release = JSON.parse(fs.readFileSync(path.join(output, "release-record.json"), "utf8"));
  assert.equal(release.authorization.publish, false);
  assert.equal(JSON.stringify(release).includes("API_KEY"), false);
});

test("refuses a destructive output path without deleting source materials", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "wedding-output-guard-"));
  const workspace = path.join(root, "materials");
  fs.mkdirSync(workspace);
  const sourceFile = path.join(workspace, "portrait.png");
  fs.writeFileSync(sourceFile, Buffer.from([0x89, 0x50, 0x4e, 0x47]));

  const result = spawnSync(process.execPath, [cli, "--assets", workspace, "--out", workspace], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /output directory/i);
  assert.equal(fs.existsSync(sourceFile), true);
});
