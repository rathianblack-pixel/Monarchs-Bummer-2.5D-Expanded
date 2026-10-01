'use strict';
/* =========================================================
   SETTINGS (persist separately)
   ========================================================= */
const Settings = Object.assign({ master: .8, music: .55, amb: .6, sfx: .8, text: 1, shake: 1, flashes: true }, (() => { try { return JSON.parse(localStorage.getItem(CONFIG.SET_KEY)) || {}; } catch (e) { return {}; } })());
function saveSettings() { try { localStorage.setItem(CONFIG.SET_KEY, JSON.stringify(Settings)); } catch (e) { } Audio.applyVolumes(); }
