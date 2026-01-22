

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.gd7T7Ahb.js","_app/immutable/chunks/Bv2VagYC.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DvviWBzy.js","_app/immutable/chunks/B1xHZ6Rf.js","_app/immutable/chunks/BYqD9XY9.js","_app/immutable/chunks/DGawb1rh.js","_app/immutable/chunks/C4OIfkoW.js"];
export const stylesheets = ["_app/immutable/assets/0.DFMZ9AMv.css"];
export const fonts = [];
