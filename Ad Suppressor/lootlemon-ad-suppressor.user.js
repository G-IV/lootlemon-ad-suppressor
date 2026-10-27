// ==UserScript==
// @name         LootLemon Ad Suppressor
// @namespace    https://lootlemon.com/
// @version      1.0.0
// @description  Removes sidebar ad containers and suppresses floating video ads on LootLemon.
// @author       You
// @match        *://lootlemon.com/*
// @match        *://*.lootlemon.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const DEBUG = false;
  const SWEEP_INTERVAL_MS = 2500;
  const SWEEP_STOP_AFTER_CLEAN_PASSES = 20;

  const counters = {
    sidebarRemoved: 0,
    videoRemoved: 0,
    closeClicked: 0,
    sweeps: 0,
  };

  let cleanSweepPasses = 0;
  let sweepTimer = null;

  function log(...args) {
    if (!DEBUG) return;
    console.log('[LootLemon Ad Suppressor]', ...args);
  }

  function hideAndRemove(el) {
    if (!el || !el.isConnected) return false;

    try {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('opacity', '0', 'important');
      el.remove();
      return true;
    } catch (err) {
      log('Failed to remove element:', err);
      return false;
    }
  }

  function isAdvertisementLabelText(text) {
    const normalized = (text || '').trim().toLowerCase();
    return normalized === 'advertisement' || normalized === 'advertisment';
  }

  function removeAdvertisementParents(root = document) {
    const matches = root.querySelectorAll?.('div');
    if (!matches || matches.length === 0) return 0;

    let removed = 0;
    for (const label of matches) {
      if (!isAdvertisementLabelText(label.textContent)) continue;

      // Prefer removing the outer ad wrapper when present.
      const target =
        label.closest('div.db_sidebar') ||
        label.closest('aside') ||
        label.parentElement ||
        label;

      if (hideAndRemove(target)) {
        removed += 1;
      }
    }

    if (removed > 0) {
      counters.sidebarRemoved += removed;
      log('Removed advertisement parent elements:', removed);
    }

    return removed;
  }

  function isLikelyFloatingAd(el) {
    if (!el || !(el instanceof HTMLElement)) return false;

    const computed = window.getComputedStyle(el);
    const z = Number.parseInt(computed.zIndex, 10);
    const fixed = computed.position === 'fixed';

    return fixed && Number.isFinite(z) && z >= 1000000;
  }

  function removeVideoPopups(root = document) {
    const matches = root.querySelectorAll?.('div[id^="primis_player"]');
    if (!matches || matches.length === 0) return 0;

    let removed = 0;
    for (const el of matches) {
      if (isLikelyFloatingAd(el) || el.id.startsWith('primis_player')) {
        if (hideAndRemove(el)) {
          removed += 1;
        }
      }
    }

    if (removed > 0) {
      counters.videoRemoved += removed;
      log('Removed video popup containers:', removed);
    }

    return removed;
  }

  function clickVideoCloseFallback(root = document) {
    const candidates = [
      '#harzsgqwhvqzstny3qs7yaf3',
      '#harzsgqwhvqzstny3qs7',
      'div[id*="Sekindo"][id*="close" i]',
      'button[aria-label*="close" i]',
      '[role="button"][aria-label*="close" i]',
      'svg[aria-label*="close" i]',
    ];

    for (const selector of candidates) {
      const btn = root.querySelector?.(selector);
      if (!btn || !(btn instanceof HTMLElement)) continue;

      btn.click();
      counters.closeClicked += 1;
      log('Clicked fallback close control:', selector);
      return 1;
    }

    return 0;
  }

  function runSuppressionPass(root = document) {
    let actions = 0;

    actions += removeAdvertisementParents(root);
    actions += removeVideoPopups(root);

    // If we did not remove a known Primis container, try close-control fallback.
    if (actions === 0) {
      actions += clickVideoCloseFallback(root);
    }

    return actions;
  }

  function startPeriodicSweep() {
    if (sweepTimer !== null) return;

    sweepTimer = window.setInterval(() => {
      counters.sweeps += 1;
      const actions = runSuppressionPass(document);

      if (actions === 0) {
        cleanSweepPasses += 1;
      } else {
        cleanSweepPasses = 0;
      }

      if (cleanSweepPasses >= SWEEP_STOP_AFTER_CLEAN_PASSES) {
        stopPeriodicSweep();
      }
    }, SWEEP_INTERVAL_MS);
  }

  function stopPeriodicSweep() {
    if (sweepTimer === null) return;
    window.clearInterval(sweepTimer);
    sweepTimer = null;
    log('Stopped periodic sweep after clean passes.', { ...counters });
  }

  function observeMutations() {
    const observer = new MutationObserver((mutations) => {
      let relevant = false;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;

          if (
            node.matches('div.db_sidebar') ||
            node.matches('div.harzsgqwhvvy7y0qv13fs7') ||
            node.matches('div[id^="primis_player"]') ||
            node.textContent?.toLowerCase().includes('advertisement') ||
            node.textContent?.toLowerCase().includes('advertisment') ||
            node.querySelector('div.db_sidebar') ||
            node.querySelector('div.harzsgqwhvvy7y0qv13fs7') ||
            node.querySelector('div[id^="primis_player"]')
          ) {
            relevant = true;
            break;
          }
        }

        if (relevant) break;
      }

      if (relevant) {
        runSuppressionPass(document);
      }
    });

    const attach = () => {
      if (!document.body) {
        window.requestAnimationFrame(attach);
        return;
      }
      observer.observe(document.body, { childList: true, subtree: true });
      runSuppressionPass(document);
    };

    attach();
  }

  function hookNavigationRescan() {
    const rescan = () => {
      cleanSweepPasses = 0;
      runSuppressionPass(document);
      startPeriodicSweep();
    };

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      window.setTimeout(rescan, 50);
      return result;
    };

    history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      window.setTimeout(rescan, 50);
      return result;
    };

    window.addEventListener('popstate', () => window.setTimeout(rescan, 50));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        window.setTimeout(rescan, 50);
      }
    });
  }

  function injectSafetyCss() {
    const style = document.createElement('style');
    style.id = 'lootlemon-ad-suppressor-style';
    style.textContent = [
      'div.db_sidebar { display: none !important; }',
      'div.harzsgqwhvvy7y0qv13fs7 { display: none !important; }',
      'div[id^="primis_player"] { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }',
    ].join('\n');

    const mount = () => {
      const head = document.head || document.documentElement;
      if (!head) {
        window.requestAnimationFrame(mount);
        return;
      }
      if (!document.getElementById(style.id)) {
        head.appendChild(style);
      }
    };

    mount();
  }

  function init() {
    injectSafetyCss();
    runSuppressionPass(document);
    observeMutations();
    startPeriodicSweep();
    hookNavigationRescan();
    log('Initialized.', { ...counters });
  }

  init();
})();
