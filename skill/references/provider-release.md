# Provider release boundary

The portable generator stops at a local static invitation. A provider is chosen only from the user's explicit target and authorization. Never infer a CloudBase environment, Cloudflare account, Worker, Pages project, domain, API key, or deployment permission from filenames or asset metadata.

## Before any backend release

1. Confirm the target, current source commit, and the operation the user authorized.
2. Inspect the existing schema/configuration and apply only missing migrations in dependency order. On Windows, pass complete multiline SQL through a Node argument array with `execFileSync(..., { shell: false })`; do not send it through `npx.cmd` or a shell-interpolated string.
3. Keep existing function environment variables. A function-code update does not rotate or import local secrets. Configuration and credential rotation are separate operations that must preserve unrelated keys.
4. Verify the deployed action contract before publishing a client that calls it. For large photos, use authenticated metadata preparation, a browser binary upload to signed storage, and authenticated completion/cancellation. Verify actual size, MIME, and image signature before publication; preserve an object when completion is ambiguous so the user can retry.
5. Add the real browser origin to CORS/security domains without replacing existing rules. Keep storage private. A local mock does not prove signatures or CORS.

## Cloudflare Workers Static Assets

If the user names an existing Worker Static Assets target, build the generator output or project allowlist and upload the contents with `index.html` and `_headers` at the archive root. The directory name `dist/cloudflare-pages` is historical and does not imply a Pages project. Wait for a Ready deployment and verify the live domain, assets, CSP/CORS, recap entry, mobile layout, loading state, and invitation reveal. Git push, archive creation, and selecting a file are not deployment evidence.

## Release record

Record source commit and remote commit separately from migration/configuration state, function revision, static deployment ID/time, URL, checks, and rollback version. Mark skipped or blocked operations explicitly. Never place passwords, API keys, signed URLs, session tokens, or raw function environment details in the record.
