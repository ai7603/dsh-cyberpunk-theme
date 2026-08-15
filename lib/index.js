//#region src/host-index.js
/**
* Permanent plugin entry (host half). The theme is a pure browser concern;
* this no-op node half exists so the package is a valid DSH loader entry
* (a `dsh.client` package still resolves through its package main). The
* dynamic-plugin flow keeps the optional `harness.handle('ping')` half in
* `src/host.js` for the status-strip heartbeat; the bundled client uses its
* browser-connectivity bridge instead, so no host service is needed here.
*/
/** Stable Cordis plugin name (the cordis.patch.yml entry id). */
const name = "cyberpunk-2077";
/**
* Plugin body — deliberately empty.
* @param ctx - host plugin context (unused by design).
*/
function apply(ctx) {}
//#endregion
export { apply, name };
