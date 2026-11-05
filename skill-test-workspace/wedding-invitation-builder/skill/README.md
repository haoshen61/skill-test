# Wedding Invitation Builder skill

This package is a portable skill plus a standard-library generator. Copy the `wedding-invitation-builder` directory into the skill directory of the harness you use, or invoke its `SKILL.md` explicitly. The generated invitation does not depend on this repository.

The portable command (run from any working directory) is:

```text
node <skill-directory>/scripts/create-invitation.js --assets <asset-directory> --out <output-directory>
```

Use the skill in a new conversation with an empty workspace containing only user-provided materials. The agent should ask for missing facts, scan the materials, generate the brief and manifest, and run the local tests before discussing deployment. Provider-specific release steps are conditional and documented in `references/provider-release.md`.

The package currently contains no dsh adapter. Its core command is intentionally shell- and harness-neutral so a future adapter can pass the same `--assets`, `--out`, and optional `--brief` arguments without changing the output contract.
