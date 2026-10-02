'use strict';
/* =========================================================
   CONFIG
   ========================================================= */
const CONFIG = { W: 1280, H: 720, LW: 640, LH: 360, HOUR_SECONDS: 45, SAVE_KEY: 'dlb_save_v2', SET_KEY: 'dlb_settings_v2',
  // perf tuning (night): per-pixel sprite lights used on full HIGH after dark (day keeps 8), and how many cached art pieces may be re-captured per frame
  NIGHT_PIXEL_LIGHTS: 4, RECAPTURES_PER_FRAME: 2,
  VILLAGER_REDRAWS: 2, // HD village: villagers given a fresh drawing per frame (the rest re-use their last one)
  HD_SCALE: 1 }; // HD render resolution factor (.5-1). 1 = full HIGH; e.g. .8 renders 1024x576 for weak GPUs (slightly softer)
