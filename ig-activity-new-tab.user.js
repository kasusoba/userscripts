// ==UserScript==
// @name         IG activity: open posts in new tab
// @namespace    local.ig-activity-new-tab
// @version      1.3
// @description  On Instagram "Your activity" pages (likes, comments, etc.), clicking a post opens it in a new tab so you keep your scroll position.
// @match        https://www.instagram.com/*
// @run-at       document-start
// @grant        GM_openInTab
// @grant        unsafeWindow
// @homepageURL  https://github.com/kasusoba/userscripts
// @updateURL    https://raw.githubusercontent.com/kasusoba/userscripts/main/ig-activity-new-tab.user.js
// @downloadURL  https://raw.githubusercontent.com/kasusoba/userscripts/main/ig-activity-new-tab.user.js
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  // true: every click on a post opens a new tab.
  // false: only Cmd/Ctrl+click and middle click do; a plain click behaves like normal.
  const ALWAYS_NEW_TAB = true;

  const w = unsafeWindow;
  const BLOCK = 'ig-activity-new-tab: navigation redirected';
  let armedUntil = 0;
  let openedFor = null;

  const onActivityPage = () => w.location.pathname.startsWith('/your_activity/');

  // The grid items are <div role="button"> with a thumbnail inside, no real link.
  // The post URL only exists once Instagram calls history.pushState after the click.
  const isPostTile = (el) => {
    const tile = el && el.closest && el.closest('[role="button"]');
    return tile && tile.querySelector('img') ? tile : null;
  };

  const arm = () => { armedUntil = Date.now() + 1500; openedFor = null; };

  const origPush = w.history.pushState;
  w.history.pushState = function (state, title, url) {
    // Throwing aborts Instagram's route change, so the list stays where it is.
    if (url && openInTab(url)) throw new Error(BLOCK);
    return origPush.apply(this, arguments);
  };

  // Open a post link in a new tab if a click on a tile just asked for it. True when it did.
  function openInTab(url) {
    if (Date.now() >= armedUntil) return false;
    const path = new URL(String(url), w.location.origin).pathname;
    if (!/^\/(p|reel|tv)\//.test(path)) return false;
    const full = w.location.origin + path;
    if (openedFor !== full) {
      openedFor = full;
      GM_openInTab(full, { active: false, insert: true });
    }
    return true;
  }

  // After about two dozen aborted route changes, Instagram gives up on them and loads the
  // post as a whole new page instead. The Navigation API (Chrome, Edge) can cancel that too.
  if (w.navigation) {
    w.navigation.addEventListener('navigate', (e) => {
      if (e.destination.sameDocument || e.userInitiated || !e.cancelable) return;
      const dest = new URL(e.destination.url);
      if (dest.origin === w.location.origin && openInTab(dest.href)) e.preventDefault();
    });
  }

  w.addEventListener('error', (e) => {
    if (String(e.message).includes(BLOCK)) e.preventDefault();
  });
  w.addEventListener('unhandledrejection', (e) => {
    if (String(e.reason && e.reason.message).includes(BLOCK)) e.preventDefault();
  });

  // Hand cursor on post tiles. Scoped with a class on <html> that tracks the current page.
  const style = document.createElement('style');
  style.textContent = 'html.ig-activity-page [role="button"]:has(img), html.ig-activity-page [role="button"]:has(img) * { cursor: pointer !important; }';
  document.documentElement.appendChild(style);
  const syncPageClass = () => document.documentElement.classList.toggle('ig-activity-page', onActivityPage());
  syncPageClass();
  setInterval(syncPageClass, 500);

  // Normal and Cmd/Ctrl clicks.
  w.addEventListener('click', (e) => {
    if (!onActivityPage() || !isPostTile(e.target)) return;
    if (ALWAYS_NEW_TAB || e.metaKey || e.ctrlKey) arm();
  }, true);

  // Middle click: Instagram ignores it, so replay it as a normal click.
  w.addEventListener('auxclick', (e) => {
    if (e.button !== 1 || !onActivityPage()) return;
    const tile = isPostTile(e.target);
    if (!tile) return;
    e.preventDefault();
    arm();
    tile.click();
  }, true);
  w.addEventListener('mousedown', (e) => {
    // Stop the autoscroll cursor on middle click over a tile.
    if (e.button === 1 && onActivityPage() && isPostTile(e.target)) e.preventDefault();
  }, true);
})();
