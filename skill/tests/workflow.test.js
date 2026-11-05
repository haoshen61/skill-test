const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const skillRoot = path.resolve(__dirname, "..");

test("documents an ordered workflow with confirmation and release gates", () => {
  const skill = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  const requiredStages = [
    "1. Classify the experience",
    "2. Collect facts",
    "3. Draft the brief",
    "4. Review assets and permissions",
    "5. Confirm the brief",
    "6. Generate the local invitation",
    "7. Run mobile and desktop QA",
    "8. Handle release authorization"
  ];
  let previous = -1;
  for (const stage of requiredStages) {
    const position = skill.indexOf(stage);
    assert.ok(position > previous, `missing or out-of-order workflow stage: ${stage}`);
    previous = position;
  }
  assert.match(skill, /future invitation|未来邀请函/i);
  assert.match(skill, /retrospective|回顾/);
  assert.match(skill, /STOP|停下|暂停/);
  assert.match(skill, /briefConfirmed/);
  assert.match(skill, /releaseAuthorized|publishAuthorized/);
  assert.match(skill, /guestContributions/);
  assert.match(skill, /Profile|profile|新人资料/i);
  assert.match(skill, /theme|主题/i);
  assert.match(skill, /visual-preferences\.html/);
  assert.match(skill, /visualPreference/);
  assert.match(skill, /visualLanguage/);
  assert.match(skill, /appearance|外观|视觉/i);
  assert.match(skill, /profession-aware|职业隐喻|职业线索/i);
});
