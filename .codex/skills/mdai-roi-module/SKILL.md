---
name: mdai-roi-module
description: Build, package, validate, and maintain the MyDecisive ROI Calculator React micro-front-end. Use when a user asks for a feature, capability, expected outcome, calculator behavior change, example rate assumption change, copy/style update, unit-test change, Vite library packaging change, GitHub Pages demo deployment change, or integration instructions for a Vite/React consuming app.
---

# MyDecisive ROI Module

## Capability Requests

Users can request capabilities in plain language. Treat requests like "users should be able to...",
"add support for...", "expected outcome...", or "make the calculator..." as feature work for this
module.

For each capability request:

1. Restate the intended user capability internally before editing.
2. Identify affected surfaces: math, UI, styles, package API, demo, tests, README, agent context, CI, or Pages.
3. Preserve the package import contract unless the user explicitly asks to change it.
4. Implement the smallest coherent change that delivers the capability.
5. Add or update unit tests for changed formulas, defaults, inputs, outputs, or formatters.
6. Update README and agent guidance when the user-facing workflow or maintenance workflow changes.
7. Run `npm run validate` before completing work.

Expected outcomes for a feature request:

- The calculator behavior matches the requested capability.
- The demo can be used to review the behavior.
- Tests cover new or changed calculator logic.
- Documentation explains new usage or integration details.
- Public exports remain stable unless intentionally changed.

## Workflow

1. Inspect `AGENTS.md`, `README.md`, `package.json`, `vite.config.js`, `src/RoiCalculator.tsx`, `src/roiCalculatorMath.ts`, `src/RoiCalculator.test.ts`, `src/roi-calculator.css`, and relevant `demo/` files before editing.
2. Keep the public package API small and stable: `RoiCalculator`, `calculateRoi`, `DEFAULT_CONFIG`, `DEFAULT_INPUTS`, and formatting helpers export from `src/index.ts`.
3. Preserve host-app isolation. Component styles must remain scoped under `#mdai-roi`; demo-only styles belong in `demo/styles.css`.
4. Keep pricing logic deterministic and tested in `src/roiCalculatorMath.ts`. UI code should call the helper rather than duplicating formulas.
5. Treat `archive/mdai-roi-calculator.legacy.html` as read-only historical context. Do not edit it unless the user explicitly asks to update the legacy single-file embed.
6. Update README usage examples when props, package scripts, publishing, or GitHub Pages behavior changes.

## Build Targets

- Package build: `npm run build` or `npm run build:lib`
- GitHub Pages demo build: `npm run build:demo` or `npm run build:pages`
- Unit tests: `npm test`
- Full validation: `npm run validate`
- Local demo: `npm run dev`

When dependencies are missing, run `npm install` first. If network access is blocked, ask for approval to install dependencies.

## Integration Rules

- Assume the primary consumer is a Vite React app.
- Document consumer usage as:
  - `import { RoiCalculator } from '@mydecisive/roi-calculator';`
  - `import '@mydecisive/roi-calculator/style.css';`
- Document dependency source options explicitly:
  - Published package: `@mydecisive/roi-calculator`
  - Local submodule: `"@mydecisive/roi-calculator": "file:vendor/roi-calculator"`
  - GitHub direct dependency: `"@mydecisive/roi-calculator": "github:mydecisive/roi-calculator#main"`
- Explain that `file:vendor/roi-calculator` points to a local folder in the consuming app, not a registry.
- For submodule integration docs, include host-app package scripts for init, install, build, verify, prepare, and a `prebuild` hook or equivalent:
  - `roi:submodule:init`
  - `roi:submodule:install`
  - `roi:submodule:build`
  - `roi:submodule:verify`
  - `roi:submodule:prepare`
- For GitHub direct installs, ensure `dist/` is committed or add a `prepare` script that builds the library during install.
- Keep React and React DOM as peer dependencies.
- Do not add a router, state library, CSS framework, or design system unless the user asks for one.
- Prefer prop-based customization over environment variables for host-app behavior.
- Prefer `.ts` and `.tsx` source files for package code.

## UI Rules

- Keep inputs, slider, result cards, CTA links, and "How this is estimated" visible and usable at desktop and mobile widths.
- Treat default rates as public example planning assumptions, not official pricing or quotes.
- Avoid changing example rate constants silently; update README and visible estimate copy when model assumptions change.
- Preserve accessible labels, keyboard support, and Escape/outside-click behavior for popovers.
- Keep brand copy concise and product-specific.

## GitHub Pages

The Pages workflow builds the demo app from `main`. If the repository name changes, update `GITHUB_PAGES_BASE` or `vite.config.js` so Vite emits paths with the correct base.

## Merge Checks

Pull requests into `main` must run `.github/workflows/ci.yml`, which executes `npm run validate`.
When behavior or formulas change, add or update Vitest coverage in `src/*.test.ts`.
