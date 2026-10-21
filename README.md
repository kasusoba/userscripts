# userscripts

Small userscripts for Tampermonkey / Violentmonkey.

## IG activity: open posts in new tab

On Instagram's "Your activity" pages (likes, comments, reposts), the post tiles aren't real links, so you can't open them in a new tab and clicking one throws away your scroll position. This script opens each clicked post in a background tab and keeps you where you were.

- Click, Cmd/Ctrl+click or middle click a post: opens in a new background tab.
- Set `ALWAYS_NEW_TAB = false` at the top to keep plain clicks normal.

**Install:** with Tampermonkey installed, open
[ig-activity-new-tab.user.js](https://raw.githubusercontent.com/kasusoba/userscripts/main/ig-activity-new-tab.user.js).
Updates install automatically.

## Updating a script

Bump `@version` in the header and push. Tampermonkey only picks up changes when the version goes up.
