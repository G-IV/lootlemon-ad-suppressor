# LootLemon Ad Suppressor

A [Tampermonkey](https://www.tampermonkey.net/) userscript that removes sidebar ad containers and suppresses floating video ads on [lootlemon.com](https://lootlemon.com).

## What it does

- Removes sidebar "advertisement" containers as soon as they appear.
- Detects and removes floating video ad popups (e.g. Primis player containers).
- Falls back to clicking known close buttons on video ads it can't remove outright.
- Watches the page for DOM changes and SPA navigation so ads are suppressed continuously, not just on initial load.
- Injects a small CSS safety net to hide known ad elements immediately, before JavaScript even runs its first pass.

## Requirements

- **Google Chrome** (or any Chromium-based browser)
- The **[Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)** extension

## Installation

1. Install the [Tampermonkey extension](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) for Chrome.
2. Click the Tampermonkey icon in your browser toolbar and select **Dashboard**.
3. Go to the **Utilities** tab, and under "Import from file", choose [`Ad Suppressor/lootlemon-ad-suppressor.user.js`](<./Ad Suppressor/lootlemon-ad-suppressor.user.js>) from this repository.
   - Alternatively, open the **Editor** tab, click **Create a new script**, delete the placeholder contents, and paste in the full contents of [`lootlemon-ad-suppressor.user.js`](<./Ad Suppressor/lootlemon-ad-suppressor.user.js>).
4. Save the script (File > Save, or `Ctrl+S` / `Cmd+S`).
5. Make sure the script is enabled in your Tampermonkey dashboard.

## Usage

Once installed and enabled, simply browse to [lootlemon.com](https://lootlemon.com). The script runs automatically on page load (`@run-at document-start`) and requires no configuration or interaction.

## Updating

To update the script after pulling new changes from this repo, open the updated [`lootlemon-ad-suppressor.user.js`](<./Ad Suppressor/lootlemon-ad-suppressor.user.js>), copy its contents, and paste it into the script's editor in your Tampermonkey dashboard, replacing the previous version. Then save.

## Project structure

```
Ad Suppressor/
├── lootlemon-ad-suppressor.user.js   # The Tampermonkey userscript
└── html element samples/             # Reference HTML snippets used to identify ad elements
```

## Notes

- The script targets `*://lootlemon.com/*` and `*://*.lootlemon.com/*` only.
- Debug logging is disabled by default. To enable it for troubleshooting, open the script in Tampermonkey and change `const DEBUG = false;` to `const DEBUG = true;` near the top of the file, then check your browser console.
