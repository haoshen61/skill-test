# Wedding Invitation Builder Skill Implementation Plan (archived)

> This is the historical implementation plan. The current contract is in [`skill/SKILL.md`](../../skill/SKILL.md): future invitation is the default, and retrospective mode is opt-in.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the wedding invitation design into an installable, dependency-light skill that can inspect a directory containing only user-provided assets and generate a runnable mobile-first invitation with auditable artifacts.

**Architecture:** The skill entrypoint is a concise `SKILL.md` with provider-neutral instructions. A pure Node standard-library tool scans assets, validates a user-approved brief, and generates a self-contained static site plus JSON records; no project files, secrets, cloud SDKs, or harness-specific APIs are required. Templates and schemas are bundled beside the skill, while deployment guidance remains conditional and provider-neutral.

**Tech Stack:** Markdown skill contract, Node.js 20+ standard library, HTML/CSS/JavaScript templates, Node `node:test`.

**Spec:** `docs/WEDDING_INVITATION_SKILL_DESIGN.md` Draft 0.3

## Global Constraints

- The skill must work when the workspace contains only user-provided image/audio assets.
- It must never invent uncertain names, dates, addresses, permissions, licenses, or deployment targets.
- The generated page starts with a future invitation; an explicit recap brief may use a thank-you/review entry and invitation reveal. Loading, empty, and failure gallery states remain distinct.
- User uploads and source assets are not copied into a production static bundle unless the user explicitly approves their use.
- Secrets are represented by status and location only; no secret value is read into generated artifacts or logs.
- CloudBase, Cloudflare, Pages, Workers, or another provider is optional and never selected from an asset scan alone.
- Node scripts use only built-in modules and accept portable POSIX/Windows paths.

## Review Focus

- Empty asset directory: produce a clear missing-assets result and a usable brief template without crashing.
- Mixed paths and unsupported files: normalize paths, ignore unsupported files, and preserve relative asset identity.
- Uncertain facts: mark them as pending instead of fabricating copy.
- Large or private assets: report metadata and permissions without copying or publishing them.
- Generation rerun: replace only the selected output directory and keep the source asset directory untouched.

### Task 1: Establish failing generator contracts

**Files:**
- Create: `skills/wedding-invitation-builder/tests/generator.test.js`
- Create: `skills/wedding-invitation-builder/package.json`

**Interfaces:**
- Consumes: a temporary asset directory and a temporary output directory.
- Produces: assertions for `asset-manifest.json`, `brief.json`, `release-record.json`, `index.html`, `styles.css`, and `app.js`.

- [x] **Step 1: Write tests** for a JPEG/PNG/MP3 asset scan, unsupported file filtering, empty-directory reporting, and generated entry text/loading-state markers.
- [x] **Step 2: Run `node --test skills/wedding-invitation-builder/tests/generator.test.js`** and confirm it fails because the generator entrypoint is absent.

### Task 2: Implement the portable generator

**Files:**
- Create: `skills/wedding-invitation-builder/scripts/create-invitation.js`
- Create: `skills/wedding-invitation-builder/templates/index.html`
- Create: `skills/wedding-invitation-builder/templates/styles.css`
- Create: `skills/wedding-invitation-builder/templates/app.js`
- Create: `skills/wedding-invitation-builder/templates/brief.example.json`
- Create: `skills/wedding-invitation-builder/templates/release-record.example.json`

**Interfaces:**
- `node scripts/create-invitation.js --assets <dir> --out <dir> [--brief <file>]`
- `scanAssets(assetRoot) -> { items, warnings }`
- `createProject({ assetRoot, outputRoot, brief }) -> { files, warnings }`

- [x] **Step 1:** Normalize relative paths to `/`, classify safe image/audio extensions, and record byte size, media role, source path, privacy `pending`, and license `unknown`.
- [x] **Step 2:** Load an optional brief, otherwise write `brief.json` from the template with `pending` values; reject malformed JSON with a nonzero exit code.
- [x] **Step 3:** Copy classified assets under `assets/` for local review and emit a manifest, release record, and static files; never copy `.env*`, `.cloudbase`, `.tcb`, hidden credential files, or unsupported files.
- [x] **Step 4:** Render the future invitation page by default, with accessible focus behavior and neutral gallery loading state; leave RSVP/deployment disabled until configured. Retrospective rendering is explicit.
- [x] **Step 5:** Run the focused tests and confirm all pass.

### Task 3: Write the installable skill contract and references

**Files:**
- Create: `skills/wedding-invitation-builder/SKILL.md`
- Create: `skills/wedding-invitation-builder/references/portable-runtime.md`
- Create: `skills/wedding-invitation-builder/references/provider-release.md`
- Create: `skills/wedding-invitation-builder/agents/openai.yaml`

**Interfaces:**
- Consumes: user request, asset directory, and generated tool outputs.
- Produces: a brief, generated project, validation report, and explicit pending/authorized release state.

- [x] **Step 1:** Define triggering description, input/output contract, missing-facts questions, and the portable run command.
- [x] **Step 2:** Route asset-only work to `portable-runtime.md`; route CloudBase/Cloudflare work to `provider-release.md` only when the user supplies/authorizes a target.
- [x] **Step 3:** Document Codex/Claude-like directory installation without assuming their APIs; keep the core command usable from any shell harness.
- [x] **Step 4:** Add UI metadata without changing automatic invocation defaults.

### Task 4: Add independent empty-workspace pressure tests and validation

**Files:**
- Create: `skills/wedding-invitation-builder/tests/empty-workspace.test.js`
- Create: `skills/wedding-invitation-builder/examples/minimal-brief.json`

**Interfaces:**
- Consumes: only copied demo assets and the portable generator.
- Produces: a repeatable no-project-files validation command.

- [x] **Step 1:** Copy a subset of demo assets into a temporary directory and run the generator with no README, AGENTS, package manifest, or source project.
- [x] **Step 2:** Assert output contains the four JSON artifacts and static entry files, while source assets remain unchanged.
- [x] **Step 3:** Run the bundled skill validator and all skill tests.
- [x] **Step 4:** Review generated output for secrets, absolute source paths, and invented event facts.

### Task 5: Integrate, review, and publish the skill package

**Files:**
- Modify: `README.md`
- Modify: `tests/skill-assets.test.js`
- Modify: `docs/WEDDING_INVITATION_SKILL_DESIGN.md`

- [x] **Step 1:** Add the package to the project skill-assets contract without bundling production uploads or high-resolution originals.
- [x] **Step 2:** Run the full project test suite, the skill validator, and the empty-workspace command.
- [x] **Step 3:** Run an independent review against a fresh prompt and only the skill package plus assets.
- [x] **Step 4:** Commit and push the package; verify local, tracking, and remote hashes.
