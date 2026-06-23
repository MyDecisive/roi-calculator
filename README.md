# MyDecisive ROI Calculator

React micro-front-end for estimating observability cost savings with
[MyDecisive SmartHub](https://www.mydecisive.ai/platform).

The package exports an embeddable ROI calculator component for Vite/React apps and a GitHub Pages
demo used as a secondary validation tool for copy, behavior, and styling changes.

## Test the demo

Use the GitHub Pages demo to test the calculator:

[https://mydecisive.github.io/roi-calculator/](https://mydecisive.github.io/roi-calculator/)

The link is available after the `Deploy demo to GitHub Pages` workflow has run successfully from
`main`.

## Project shape

```text
.
├── demo/                    # Vite demo app for GitHub Pages
├── archive/
│   └── mdai-roi-calculator.legacy.html # Original single-file embed reference
├── src/
│   ├── RoiCalculator.tsx    # React component
│   ├── RoiCalculator.test.ts # Unit tests for calculation and formatting behavior
│   ├── roiCalculatorMath.ts # Pure calculator math and formatters
│   ├── index.ts             # Public package exports
│   └── roi-calculator.css   # Scoped component styles
├── vite.config.js           # Demo and library builds
└── package.json
```

## How styles work

The `#mdai-roi` rules are intentionally not copied into `demo/styles.css`.

There are two separate CSS entrypoints:

- `src/roi-calculator.css` is the package stylesheet. It contains the scoped `#mdai-roi` component
  styles and is imported by `src/index.ts`.
- `demo/styles.css` is only for the demo host page: body background, page grid, and demo heading.

In Vite dev mode, CSS imported from TypeScript is injected into the page by Vite. In a production
library build, Vite extracts the package stylesheet as:

```text
dist/roi-calculator.css
```

The package exposes that file as:

```tsx
import '@mydecisive/roi-calculator/style.css';
```

In the GitHub Pages demo build, Vite bundles both `demo/styles.css` and `src/roi-calculator.css`
into a hashed CSS asset under `dist/assets/`. It does not rewrite the source `demo/styles.css`.

## Development guide

Install dependencies:

```bash
npm install
```

Run the demo locally:

```bash
npm run dev
```

Open the URL Vite prints. For this repository, the app is served under the configured Pages base
path:

```text
http://localhost:5173/roi-calculator/
```

If port `5173` is taken, Vite will choose the next available port.

Run unit tests:

```bash
npm test
```

Run the full pre-merge check:

```bash
npm run validate
```

`npm run validate` runs typecheck, lint, unit tests, the library build, and the demo build.

Build only the importable package:

```bash
npm run build
```

Build only the GitHub Pages demo:

```bash
npm run build:demo
```

## Install into a Vite React app

From a published package:

```bash
npm install @mydecisive/roi-calculator
```

From this repository during local development:

```bash
npm install ../roi-calculator
```

From GitHub directly:

```bash
npm install github:mydecisive/roi-calculator
```

Or pin a branch, tag, or commit:

```bash
npm install github:mydecisive/roi-calculator#main
```

Use a GitHub dependency only when the repository can build itself during install or already contains
the built package output. For this package, that means either:

- keep `dist/` committed, or
- add a `prepare` script that runs the library build during install.

Without one of those, prefer the submodule flow below or publish the package to npm/GitHub Packages.

Use it in the consuming app:

```jsx
import { RoiCalculator } from '@mydecisive/roi-calculator';
import '@mydecisive/roi-calculator/style.css';

export function RoiPage() {
  return (
    <RoiCalculator
      config={{
        CTA_GET_STARTED_URL: 'https://mydecisive.ai/octant',
        CTA_CONTACT_URL: 'https://mydecisive.ai#contact-us'
      }}
    />
  );
}
```

The component CSS is scoped under `#mdai-roi` so it can live inside another website without taking
over host styles.

## Use as a git submodule in another Vite React app

Use this when the consuming app should track this repository directly instead of installing from a
registry.

From the consuming app repository:

```bash
git submodule add git@github.com:mydecisive/roi-calculator.git vendor/roi-calculator
git submodule update --init --recursive
```

Build the calculator package inside the submodule:

```bash
cd vendor/roi-calculator
npm install
npm run build
cd ../..
```

Reference the submodule as a local file dependency in the consuming app's `package.json`:

```json
{
  "dependencies": {
    "@mydecisive/roi-calculator": "file:vendor/roi-calculator"
  }
}
```

`file:vendor/roi-calculator` means "install this package from a local folder in the consuming
repository." In this example, the host app contains:

```text
my-vite-app/
├── package.json
└── vendor/
    └── roi-calculator/   # git submodule checkout
```

Install from the consuming app root:

```bash
npm install
```

Add host-app scripts that make submodule setup explicit. In the consuming app's `package.json`:

```json
{
  "scripts": {
    "roi:submodule:init": "git submodule update --init --recursive vendor/roi-calculator",
    "roi:submodule:install": "npm --prefix vendor/roi-calculator ci",
    "roi:submodule:build": "npm --prefix vendor/roi-calculator run build",
    "roi:submodule:verify": "git submodule status vendor/roi-calculator && test -f vendor/roi-calculator/package.json && test -f vendor/roi-calculator/dist/index.js && test -f vendor/roi-calculator/dist/roi-calculator.css",
    "roi:submodule:prepare": "npm run roi:submodule:init && npm run roi:submodule:install && npm run roi:submodule:build && npm run roi:submodule:verify",
    "prebuild": "npm run roi:submodule:prepare"
  }
}
```

What these scripts do:

- `roi:submodule:init` ensures the submodule checkout exists.
- `roi:submodule:install` installs this module's dependencies inside the submodule.
- `roi:submodule:build` generates the package `dist/` output used by the host app.
- `roi:submodule:verify` fails fast if the submodule is missing or the built package files are absent.
- `prebuild` makes the host app build fail before Vite runs if the submodule is not ready.

If the host app already has a `prebuild` script, call `npm run roi:submodule:prepare` from that
existing script instead of replacing it.

Use the component in the consuming Vite React app:

```tsx
import { RoiCalculator } from '@mydecisive/roi-calculator';
import '@mydecisive/roi-calculator/style.css';

export function ObservabilityRoiRoute() {
  return (
    <RoiCalculator
      initialInputs={{
        logGB: 1200,
        filterPct: 65
      }}
      config={{
        CTA_GET_STARTED_URL: '#contact-us',
        CTA_CONTACT_URL: '#contact-us'
      }}
    />
  );
}
```

When the submodule changes, rebuild it and reinstall or refresh the dependency in the consuming app:

```bash
cd vendor/roi-calculator
npm run build
cd ../..
npm install
```

For CI in the consuming app, make sure the checkout step includes submodules and builds this package
before building the host app:

```yaml
- uses: actions/checkout@v4
  with:
    submodules: recursive
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm
- run: npm ci
  working-directory: vendor/roi-calculator
- run: npm run build
  working-directory: vendor/roi-calculator
- run: npm run roi:submodule:verify
- run: npm ci
- run: npm run build
```

The submodule dependency uses the package's built `dist/` output. That is why `npm run build` inside
`vendor/roi-calculator` is required before the host app imports it.

## Configuration API

`RoiCalculator` accepts:

| Prop | Purpose |
| --- | --- |
| `config` | Overrides example rate assumptions and CTA links. |
| `initialInputs` | Overrides default calculator input values. |
| `onChange` | Receives `(results, inputs)` whenever users change a value. |
| `className` | Adds a class to the scoped root element. |
| `id` | Overrides the default root id, `mdai-roi`. Keep the default unless multiple calculators render on one page. |

Default example rate assumptions:

```js
export const DEFAULT_CONFIG = {
  RATE_LOG_GB: 2.5,
  RATE_TRACE_IN_MM: 2.5,
  RATE_TRACE_OUT_MM: 1.27,
  RATE_HOST: 15,
  RATE_CONTAINER: 1,
  DAYS_PER_MONTH: 30,
  CTA_GET_STARTED_URL: 'https://mydecisive.ai/octant',
  CTA_CONTACT_URL: 'https://mydecisive.ai#contact-us'
};
```

These defaults are example planning rates, not official pricing or a quote. Pass `config` from the
host app to use current campaign, customer, or vendor assumptions.

The package also exports `calculateRoi`, `DEFAULT_CONFIG`, `DEFAULT_INPUTS`, and formatting helpers
for tests or host-app analytics.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` deploys the Vite demo from `main`.

Repository settings needed once:

1. Enable GitHub Pages.
2. Set the source to GitHub Actions.
3. Confirm the repository name matches the Vite base path in `vite.config.js`.

If the live page loads `index.html` but browser devtools shows a 404 for `/demo/main.tsx` or
`/demo/main.jsx`, GitHub Pages is serving the raw repository branch instead of the workflow artifact.
Fix it by changing **Settings → Pages → Build and deployment → Source** to **GitHub Actions**, then
rerun the `Deploy demo to GitHub Pages` workflow.

If the repository is not named `roi-calculator`, set the Pages base path in the workflow:

```yaml
- run: GITHUB_PAGES_BASE=/your-repo-name/ npm run build:pages
```

## Merge checks

Pull requests into `main` run `.github/workflows/ci.yml`, which executes:

```bash
npm run validate
```

Enable branch protection in GitHub and require the `Validate` workflow before merging to `main`.

## Publishing

Build before publishing:

```bash
npm run validate
npm publish --access restricted
```

If this stays private, install it through a private npm registry or directly from Git:

```bash
npm install git+ssh://git@github.com:mydecisive/roi-calculator.git
```

## Prompt-driven maintenance

This repo is organized so Codex or Claude Code can edit the micro-front-end from ordinary feature
requests. Users should not need to paste a long maintenance prompt every time.

Agents should use the repo-local skill at:

```text
.codex/skills/mdai-roi-module/SKILL.md
```

Use the agent context entrypoint at:

```text
AGENTS.md
```

The skill tells agents where the code lives, how package integration works, what validation is
required, and what outcomes are expected for a feature request.

### User feature request format

A user can ask for a capability in plain language:

```text
Add a feature that lets users choose separate filtering percentages for logs and traces.
```

For clearer outcomes, include:

```text
Capability: Users can choose separate filtering percentages for logs and traces.
Expected outcome: The calculator updates savings independently for log and trace filtering, the demo shows both controls, unit tests cover the math, and the README explains the new inputs.
```

Agents should then:

1. Use the `mdai-roi-module` skill.
2. Identify whether the change touches UI, math, styling, packaging, docs, or CI.
3. Update the focused files for that surface.
4. Add or update unit tests when formulas, defaults, inputs, or outputs change.
5. Update README/agent context when usage, integration, or development workflow changes.
6. Run `npm run validate`.

### Maintenance map

Use these files as the source of truth:

- Component behavior lives in `src/RoiCalculator.tsx`.
- Calculator math, config defaults, result/input types, and formatters live in `src/roiCalculatorMath.ts`.
- Visual styling lives in `src/roi-calculator.css`.
- Unit tests live beside source in `src/*.test.ts`; math tests should import `src/roiCalculatorMath.ts` directly.
- Demo-only layout lives in `demo/`.
- Packaging and Pages behavior live in `package.json`, `vite.config.js`, and `.github/workflows/pages.yml`.
- The archived `archive/mdai-roi-calculator.legacy.html` file is retained only as historical
  reference for the original single-file embed.

## License

See [LICENSE](LICENSE).
