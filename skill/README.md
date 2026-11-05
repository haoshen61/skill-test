# Wedding Invitation Builder skill

This package is a portable skill plus a standard-library generator. Copy the `wedding-invitation-builder` directory into the skill directory of the harness you use, or invoke its `SKILL.md` explicitly. The generated invitation does not depend on this repository.

The portable command (run from any working directory) is:

```text
node <skill-directory>/scripts/create-invitation.js --assets <asset-directory> --out <output-directory>
```

After the conversation confirms the facts, pass a brief with `--brief <file>`. For a mixed asset folder, include `gallery.paths` with the manually selected wedding images. An optional source `manifest.json` supplies privacy, license, role, and usage labels for `asset-manifest.json`; it does not grant public publication.

Use the skill in a new conversation with an empty workspace containing only user-provided materials. The agent should classify future invitation vs explicit retrospective, ask for missing facts one at a time, stop for brief confirmation, scan the materials, generate the brief and manifest, and run the local tests before discussing deployment. Provider-specific release steps are conditional and documented in `references/provider-release.md`.

The local RSVP form updates the same browser record when `guestName` and `contactSuffix` match. The local management page has no authentication, and the release record keeps production RSVP idempotency and cloud storage pending. Point-song requests include an optional singer field.

The package currently contains no dsh adapter. Its core command is intentionally shell- and harness-neutral so a future adapter can pass the same `--assets`, `--out`, and optional `--brief` arguments without changing the output contract.
