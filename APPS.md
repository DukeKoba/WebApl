# WebApl Application Inventory

## Active applications

| Directory | Role | Framework | Local URL |
| --- | --- | --- | --- |
| `insurance-compare/` | Insurance product comparison and analysis platform | Next.js | `http://localhost:3000` |
| `insurid/` | Insurance industry news publishing and editorial platform | Next.js | `http://localhost:3000/insurid` |
| `client/` + `server/` | Existing WebApl multi-product application | Vite + Express | `http://localhost:5173` |

## Legacy assets

| Directory | Role | Policy |
| --- | --- | --- |
| `insurance-news/` | Legacy static support/privacy pages for the former insurance news app | Keep for reference; do not add new product code |

## Placement rules

- Develop the insurance comparison product only in `insurance-compare/`.
- Develop the insurance news product only in `insurid/`.
- cocreo.jp itself is **not** in this repo. It is the Vercel project `insurid`, served from `02_Dev_MobApp/01_ToLaunch/CocreoWeb/`. `client/src/pages/cocreo/` here is superseded — do not add product code to it.
- The self-inspection tool (`docs/cocreo-selfcheck-product-design.md` Track A) lives in `CocreoWeb/src/app/selfcheck/`. Never commit 損保協会 distribution files (`*.docx`, `*.xlsx`) — the tool reads them from the user's own device by design.
- Do not create additional copies under `GitHub/ToLaunch` or `Vibecoding`.
- Build output (`.next/`, `dist/`, `build/`) and dependencies (`node_modules/`) are generated assets and are not committed.
- Keep each application's secrets in its own ignored environment file.

## Insurance Compare commands

```bash
cd /Volumes/SSD-DEV/Dev/WebApl/insurance-compare
npm run dev
```

The Vercel project link is retained in `insurance-compare/.vercel/` on the local machine.
