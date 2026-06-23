# ROI Module Builder Agent

Use this agent prompt when asking Codex or Claude Code to maintain the MyDecisive ROI Calculator
micro-front-end. Users should only need to describe the desired capability and expected outcome;
the agent should apply the repo-local `mdai-roi-module` skill and this context automatically.

## Default prompt

```text
You are maintaining the MyDecisive ROI Calculator React micro-front-end.

Use the repo-local mdai-roi-module skill for ordinary feature requests. Translate user capability
requests into implementation work without requiring the user to paste skill-specific instructions.

First inspect AGENTS.md, README.md, package.json, vite.config.js, src/RoiCalculator.tsx,
src/roiCalculatorMath.ts, src/RoiCalculator.test.ts, src/roi-calculator.css, and the relevant demo
files. Keep calculator formulas in roiCalculatorMath.ts, component UI in RoiCalculator, package
exports in src/index.ts, and demo-only layout in demo/.
Treat archive/mdai-roi-calculator.legacy.html as read-only historical context unless the user asks
to update the legacy single-file embed.

Preserve the Vite/React dependency contract:
- React and React DOM remain peer dependencies.
- Consumers import { RoiCalculator } from '@mydecisive/roi-calculator'.
- Consumers import '@mydecisive/roi-calculator/style.css'.
- Document all supported dependency sources when integration docs change: published package,
  `file:vendor/roi-calculator` local submodule, and GitHub direct dependency.
- Explain that `file:vendor/roi-calculator` points to a local folder in the consuming app.
- For submodule docs, include host-app package scripts that initialize, install, build, verify, and
  prepare the submodule before host builds.
- For GitHub direct dependencies, call out that `dist/` must be committed or a `prepare` script must
  build the package during install.

For any behavior, API, packaging, or deployment change, update README.md, add or update Vitest
coverage, and run npm run validate. If dependencies are missing, install them first or explain why
validation could not run.
```

## Capability request handling

When a user asks for a feature, identify:

- Capability: what the user should be able to do.
- Expected outcome: what should change in the demo/package/API/docs.
- Affected surfaces: math, UI, styles, tests, packaging, docs, Pages, or CI.
- Validation: which tests or builds prove the change works.

## Common tasks

- Add or adjust calculator inputs in `src/RoiCalculator.tsx`.
- Add or adjust calculator formulas, defaults, and formatters in `src/roiCalculatorMath.ts`.
- Add or update unit tests in `src/*.test.ts`.
- Keep styles scoped in `src/roi-calculator.css`.
- Update the Pages demo in `demo/`.
- Update package scripts and exports in `package.json`.
- Update deployment behavior in `.github/workflows/pages.yml`.
