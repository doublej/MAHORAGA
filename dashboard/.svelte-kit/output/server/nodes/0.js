

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.CV17C0XU.js","_app/immutable/chunks/Dvq9GajI.js","_app/immutable/chunks/BMldKSzV.js","_app/immutable/chunks/DpuPE-1g.js","_app/immutable/chunks/BX5sa-_w.js"];
export const stylesheets = ["_app/immutable/assets/0.DrmU_-aW.css"];
export const fonts = [];
