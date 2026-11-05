# Portable runtime

This skill is intentionally independent of a repository. The directory supplied by the user may contain only photos, illustrations, audio, or reference images. Do not require `README.md`, `AGENTS.md`, `package.json`, a Git checkout, a cloud login, or a framework.

## Invocation contract

The harness must provide the absolute path of the skill directory and the current workspace. Run:

```text
node <skill-directory>/scripts/create-invitation.js --assets <workspace> --out <workspace>/.wedding-invitation
```

The script uses Node's built-in modules only. On Windows, pass each argument separately; do not build a shell command by interpolating filenames. On a POSIX shell, quote paths containing spaces. A harness that cannot expose a skill directory should copy `scripts/`, `templates/`, and this reference into a temporary tool directory before invoking Node; it must leave the user's asset directory unchanged.

If the workspace includes `manifest.json`, matching entries contribute role, privacy, license, descriptions, usage labels, and notes to the generated asset manifest. A confirmed brief may include `gallery.paths`; only those normalized image paths become gallery slides, while all supported files may still be copied for local review.

## Asset rules

Supported image extensions are `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, and `.avif`. Supported audio extensions are `.mp3`, `.m4a`, `.ogg`, `.wav`, and `.aac`. Paths are normalized to `/` in the manifest. Hidden files, `.env*`, `.cloudbase`, `.tcb`, `.git`, unsupported files, and symlinks are skipped. Every item starts with `privacy: pending` and `license: unknown`; the agent must obtain approval before treating an item as public.

## Generated contract

The output directory contains:

- `asset-manifest.json`: relative asset paths, role, byte size, source, privacy, license, and warnings.
- `brief.json`: confirmed facts, design choices, interaction flags, and authorization status.
- `release-record.json`: source, backend, frontend, checks, pending items, and rollback fields. It contains no credentials.
- `index.html`, `styles.css`, `app.js`: a static future-invitation-first page that renders the confirmed couple profile and named wedding theme. When enabled in `brief.json`, RSVP and configured `interaction.guestContributions` forms save only to browser `localStorage`; matching RSVP identity fields update the local demo record, but this does not prove production concurrency or authentication. Set `interaction.backgroundMusic` for audio. Point-song is an optional contribution shorthand when `interaction.musicRequest` is supplied, not a default. Set `mode: "recap"` or `mode: "retrospective"` explicitly for a completed-wedding thank-you entry.
- `admin.html`, `admin.js`: a local-only view/export of RSVP and configured guest contribution records. It has no authentication and must never be presented as a production admin page.
- `assets/`: copies of classified assets selected by the scanner for local review. The manifest keeps each item at `privacy: pending` until the user approves publication.

If the asset directory is empty, generate the same files with an empty manifest and pending facts. If the brief is malformed, exit nonzero before changing the output. Re-running replaces only the output directory. A normal run should carry a confirmed brief with `workflow.briefConfirmed: true`; a run without it is a draft preview and must retain a pending brief-confirmation item. The generated release record lists portable-generator limitations such as production RSVP storage, auto-play and low-volume cross-browser behavior, share cards, notice pages, cloud backends, and image processing.

## Validation

Run from the skill directory:

```text
node --test tests/*.test.js
```

For a manual preview, use any available static server, for example `python -m http.server 4173 --directory <workspace>/.wedding-invitation`, or inspect the generated HTML directly when no server is available. Check `/index.html` at a narrow phone viewport and a desktop viewport. Do not claim production validation from this local check.
