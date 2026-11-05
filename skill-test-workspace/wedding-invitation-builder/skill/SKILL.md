---
name: wedding-invitation-builder
description: Use when creating or revising a mobile-first wedding invitation from a conversation and user-provided photos, illustrations, music, or design references, especially when the workspace has no application files yet.
---

# Wedding Invitation Builder

Turn a wedding invitation request and a directory of user-provided assets into a reviewable design brief, a small runnable static invitation, and an explicit release record.

## Start here

Treat the current conversation as the source of facts. Treat the workspace as an asset directory unless the user explicitly identifies an existing application. Scan assets before proposing layout. Ask only for facts that affect the output: names, confirmed date/time/venue, story, copy, asset permissions, interaction needs, and whether production release is authorized.

Do not invent a name, date, address, license, privacy permission, or deployment target. Mark unknown facts `null` or `pending`. Do not print or copy secrets.

## Portable generation

Read [references/portable-runtime.md](references/portable-runtime.md), then run the bundled standard-library generator. If the harness keeps the current working directory at the user's asset-only workspace, use the absolute skill path shown below; otherwise the command may be run from the skill directory:

```text
node <skill-directory>/scripts/create-invitation.js --assets <workspace> --out <workspace>/.wedding-invitation
```

Use `--brief <file>` only after the user has reviewed or supplied the facts. The generator ignores hidden files, credentials, unsupported files, and source directories it cannot classify. It writes `asset-manifest.json`, `brief.json`, `release-record.json`, `index.html`, `styles.css`, `app.js`, and classified copies under `assets/` for local review. It never edits the source asset directory, and it does not treat those copies as publicly approved.

The default visual contract is recap first: show “婚礼已圆满落幕”, thank every friend who cared, stayed close, or sent a blessing, show a paginated photo area, and reveal the original invitation after “继续查看电子请柬”. Keep loading, empty, and failed image states separate; a loading state must not flash a fallback portrait. Use a single column at phone widths, keyboard controls, visible focus, and reduced-motion support.

## Review and release

Open the generated directory with a static HTTP server and check a phone and desktop viewport. Review the JSON records and the source asset manifest before adding RSVP, music controls, a backend, or a production provider. Read [references/provider-release.md](references/provider-release.md) only when the user names and authorizes a provider. Git synchronization, backend migration/function updates, and static publishing are separate states in `release-record.json`.

Run the bundled tests from the skill directory. Report generated paths, pending facts, asset permission gaps, and skipped release stages. A runnable local invitation is complete when the brief, manifest, static files, and validation evidence exist; production is complete only after the provider's live checks are recorded.
