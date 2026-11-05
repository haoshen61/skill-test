# Portable runtime

This skill is intentionally independent of a repository. The directory supplied by the user may contain only photos, illustrations, audio, or reference images. Do not require `README.md`, `AGENTS.md`, `package.json`, a Git checkout, a cloud login, or a framework.

## Invocation contract

The harness must provide the absolute path of the skill directory and the current workspace. Run:

```text
node <skill-directory>/scripts/create-invitation.js --assets <workspace> --out <workspace>/.wedding-invitation
```

The script uses Node's built-in modules only. On Windows, pass each argument separately; do not build a shell command by interpolating filenames. On a POSIX shell, quote paths containing spaces. A harness that cannot expose a skill directory should copy `scripts/`, `templates/`, and this reference into a temporary tool directory before invoking Node; it must leave the user's asset directory unchanged.

## Asset rules

Supported image extensions are `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, and `.avif`. Supported audio extensions are `.mp3`, `.m4a`, `.ogg`, `.wav`, and `.aac`. Paths are normalized to `/` in the manifest. Hidden files, `.env*`, `.cloudbase`, `.tcb`, `.git`, unsupported files, and symlinks are skipped. Every item starts with `privacy: pending` and `license: unknown`; the agent must obtain approval before treating an item as public.

## Generated contract

The output directory contains:

- `asset-manifest.json`: relative asset paths, role, byte size, source, privacy, license, and warnings.
- `brief.json`: confirmed facts, design choices, interaction flags, and authorization status.
- `release-record.json`: source, backend, frontend, checks, pending items, and rollback fields. It contains no credentials.
- `index.html`, `styles.css`, `app.js`: a static recap-first invitation. When enabled in `brief.json`, RSVP and music forms save only to browser `localStorage`; they are local demos, not a production guest database.
- `admin.html`, `admin.js`: a local-only view/export of those browser records. It has no authentication and must never be presented as a production admin page.
- `assets/`: copies of classified assets selected by the scanner for local review. The manifest keeps each item at `privacy: pending` until the user approves publication.

If the asset directory is empty, generate the same files with an empty manifest and pending facts. If the brief is malformed, exit nonzero before changing the output. Re-running replaces only the output directory.

## Validation

Run from the skill directory:

```text
node --test tests/*.test.js
```

For a manual preview, use any available static server, for example `python -m http.server 4173 --directory <workspace>/.wedding-invitation`, or inspect the generated HTML directly when no server is available. Check `/index.html` at a narrow phone viewport and a desktop viewport. Do not claim production validation from this local check.
