---
name: wedding-invitation-builder
description: Use when creating or revising a mobile-first wedding invitation from a conversation and user-provided photos, illustrations, music, or design references, especially when the workspace has no application files yet.
---

# Wedding Invitation Builder

Turn a wedding invitation request and a directory of user-provided assets into a reviewable design brief, a small runnable static invitation, and an explicit release record.

## Start here

Treat the current conversation as the source of facts. Treat the workspace as an asset directory unless the user explicitly identifies an existing application. Scan assets before proposing layout. Ask only for facts that affect the output: names and optional profile cues, confirmed date/time/venue, story, copy, visual theme, personalized guest information, asset permissions, interaction needs, and whether production release is authorized.

Do not invent a name, date, address, license, privacy permission, or deployment target. Mark unknown facts `null` or `pending`. Do not print or copy secrets.

## Required workflow and stage gates

Follow these stages in order. The `workflow` object in `brief.json` and `release-record.json` is the machine-readable progress record. A stage is not complete because the agent has discussed it; it is complete only when its evidence exists.

### 1. Classify the experience

Ask whether the user is making a future invitation, a retrospective/thank-you page, or both. **Future invitation is the default.** Use `mode: "recap"` or `mode: "retrospective"` only after the user explicitly requests a completed-wedding review. Do not put “婚礼已圆满落幕”, a thank-you-first hero, or a hidden invitation behind a recap gate in an ordinary future invitation.

### 2. Collect facts

Ask one question at a time, in this order: event date/time/timezone and format; venue short name, room and address; couple names and optional identity cues; relationship copy; visual theme and preferences; which guest information or messages would be meaningful beyond RSVP; asset permissions; Git/backend/domain and release scope. Echo each answer and mark conflicts instead of guessing.

### 3. Draft the brief

Create a draft containing `mode`, `couple`, `event`, `design`, `sections`, `gallery`, `interaction`, `authorization`, and `workflow`. Preserve profile cues under `couple.partnerA`/`couple.partnerB` and the named theme under `design.theme`; keep unknown facts `null` or `pending`. Store personalized non-RSVP prompts in `interaction.guestContributions` as an array of `{ id, title, description, submitLabel, storageKey, fields }` objects. Set `workflow.phase` to `brief-draft` and list unresolved questions in the brief or a companion note.

### 4. Review assets and permissions

Scan and show the source manifest before using images or audio. Confirm which files may be copied, transformed, shown in the gallery, or used only as private references. Set `workflow.assetsReviewed` only after the user answers; a manifest entry is not publication permission.

### 5. Confirm the brief

Present the complete design brief, selected gallery paths, copy, interaction contract, and pending items. **STOP and wait for an explicit confirmation** such as “确认/按这个生成”. Only then set `workflow.briefConfirmed: true` and `workflow.phase: "brief-confirmed"`. If the user changes a fact, return to stages 2–5 and do not generate the previous brief.

### 6. Generate the local invitation

Run the portable generator with the confirmed brief. The default output is a future invitation; recap behavior is opt-in through `mode`. The invitation renders the confirmed couple profile, story copy, and named visual theme instead of leaving those facts only in JSON. Rendered guest pages contain invitation content rather than internal delivery caveats; local-storage and production boundaries stay in `release-record.json`, the admin demo, and the evidence. Keep the source workspace unchanged. A draft generated before stage 5 is only a preview for inspection and must not be presented as the confirmed delivery.

### 7. Run mobile and desktop QA

Serve the generated directory and inspect a narrow phone viewport plus a desktop viewport. Check no overflow/overlap, the rendered profile and theme, loading/empty/failed gallery states, selected gallery paths, keyboard/focus behavior, reduced motion, form validation, local RSVP update behavior, each configured guest contribution, and music fallback. Record commands, viewport sizes, and outcomes in the release record or final evidence. **STOP before release** if a check fails.

### 8. Handle release authorization

Separate local preview, Git synchronization, backend changes, and static publication. Ask for the target and explicit production authorization before deployment. `workflow.releaseAuthorized` and `authorization.publish` must remain false when the user only asked for a demo. Read provider-specific instructions only after the user names and authorizes a provider; never infer production permission from a configured login or remote repository.

## Portable generation

Read [references/portable-runtime.md](references/portable-runtime.md), then run the bundled standard-library generator. If the harness keeps the current working directory at the user's asset-only workspace, use the absolute skill path shown below; otherwise the command may be run from the skill directory:

```text
node <skill-directory>/scripts/create-invitation.js --assets <workspace> --out <workspace>/.wedding-invitation
```

Use `--brief <file>` only after the user has reviewed or supplied the facts. The generator ignores hidden files, credentials, unsupported files, and source directories it cannot classify. It writes `asset-manifest.json`, `brief.json`, `release-record.json`, `index.html`, `styles.css`, `app.js`, and classified copies under `assets/` for local review. It never edits the source asset directory, and it does not treat those copies as publicly approved.

When the asset workspace contains a `manifest.json`, the generator carries its per-file role, privacy, license, usage, and notes into `asset-manifest.json` while keeping media type separate. After manual review, set `gallery.paths` in the confirmed brief to the wedding images that may appear in the runtime gallery. The scanner may copy every supported source item for local review, but only the explicitly selected paths become gallery slides.

When RSVP is enabled, the local demo updates an existing record matching `guestName` and `contactSuffix`; this is a browser-local demonstration of the conversation contract. Production authentication, concurrency safety, and cloud persistence remain pending. For other guest information, configure `interaction.guestContributions` with personalized fields such as a blessing, meal preference, transportation need, or photo request. Each configured contribution gets its own local-storage key and form; the generator does not assume that guests should request songs. Use `interaction.backgroundMusic` for background audio. A legacy point-song brief remains supported when it supplies `interaction.musicRequest`, but it is not the default.

The default visual contract is a future invitation: show the invitation title and confirmed event information first, then the couple profile/story, named wedding theme, selected gallery, RSVP, configured guest contributions, and an optional thank-you section. Keep loading, empty, and failed image states separate; a loading state must not flash a fallback portrait. Use a single column at phone widths, keyboard controls, visible focus, and reduced-motion support. Only an explicit `mode: "recap"` or `mode: "retrospective"` switches to a completed-wedding thank-you hero and invitation reveal.

## Review and release

Open the generated directory with a static HTTP server and check a phone and desktop viewport. Review the JSON records and the source asset manifest before adding RSVP, music controls, a backend, or a production provider. Read [references/provider-release.md](references/provider-release.md) only when the user names and authorizes a provider. Git synchronization, backend migration/function updates, and static publishing are separate states in `release-record.json`.

Run the bundled tests from the skill directory. Report generated paths, pending facts, asset permission gaps, and skipped release stages. A runnable local invitation is complete when the brief, manifest, static files, and validation evidence exist; production is complete only after the provider's live checks are recorded.
