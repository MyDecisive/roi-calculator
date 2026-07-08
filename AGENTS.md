# Agent Context

Use this file as the entrypoint for Codex, Claude Code, and other coding agents working in this
repository.

## Repo Goal

Maintain the MyDecisive ROI Calculator as a React/TypeScript micro-front-end package that can be
installed into a Vite React app and previewed through a GitHub Pages demo.

## Required Context

- Use the repo-local Codex skill at `.codex/skills/mdai-roi-module/SKILL.md` when changing package
  API, calculator behavior, example rate assumptions, styling, tests, or GitHub Pages deployment.
- Use `.agents/roi-module-builder.md` as the portable agent prompt for Codex or Claude Code.
- Treat `archive/mdai-roi-calculator.legacy.html` as read-only historical context unless the user
  explicitly asks to update the legacy single-file embed.

## Feature Request Handling

Users should be able to describe a capability in plain language, such as "users should be able to
compare two vendors" or "add a region pricing selector." Agents must translate that request through
the `mdai-roi-module` skill instead of requiring the user to paste a special maintenance prompt.

Expected outcome for feature work:

- Implement the requested user capability.
- Update focused UI/math/style/package files as needed.
- Add or update unit tests for calculator logic changes.
- Update README or agent context when usage or workflow changes.
- Run `npm run validate`.

## Code Boundaries

- Public package exports live in `src/index.ts`.
- React UI lives in `src/RoiCalculator.tsx`.
- Calculator formulas, default config/input values, exported math types, and formatters live in
  `src/roiCalculatorMath.ts`.
- Unit tests live next to source as `src/*.test.ts`.
- Component styles live in `src/roi-calculator.css` and must stay scoped under `#mdai-roi`.
- Demo-only code lives in `demo/`.
- GitHub Actions live in `.github/workflows/`.

## Consumer Dependency Options

- Published package: install `@mydecisive/roi-calculator`.
- Published package versions: use `@mydecisive/roi-calculator@latest` for the latest published
  package or `@mydecisive/roi-calculator@0.1.0` to pin a known version.
- Local submodule: use `"@mydecisive/roi-calculator": "file:vendor/roi-calculator"` in the
  consuming app. The `file:` value points to a local folder in that app, usually a git submodule.
  Integration docs should include host-app scripts for `roi:submodule:init`,
  `roi:submodule:tag`, `roi:submodule:latest`, `roi:submodule:install`, `roi:submodule:build`,
  `roi:submodule:verify`, and `roi:submodule:prepare`, plus a `prebuild` hook or equivalent.
- GitHub direct dependency: use `"@mydecisive/roi-calculator": "github:mydecisive/roi-calculator#main"`.
  Prefer pinned tags such as `"github:mydecisive/roi-calculator#0.1.0"` for production installs.
  This requires committed `dist/` output or a `prepare` script that builds the library during install.

## Validation

Run `npm run validate` before considering work complete. It runs typecheck, lint, unit tests, the
library build, and the demo build.

Pull requests into `main` run `.github/workflows/ci.yml`; GitHub branch protection should require
the `Validate` workflow before merge.
