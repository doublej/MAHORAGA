

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.CPnw2Tf4.js","_app/immutable/chunks/DLW7Edu-.js","_app/immutable/chunks/C2Snk8yw.js","_app/immutable/chunks/CTRDKxTZ.js","_app/immutable/chunks/DRprj456.js"];
export const stylesheets = ["_app/immutable/assets/0.DQ3AbLpw.css"];
export const fonts = [];
