import { x as ensure_array_like, w as attr_class, y as stringify, F as attr } from "../../../chunks/index.js";
import { P as Panel, S as StatusIndicator, d as dashboard } from "../../../chunks/Panel.js";
import { l as escape_html } from "../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const SECTIONS = [
      { id: "connection", label: "Connection" },
      { id: "trading", label: "Trading" },
      { id: "risk", label: "Risk" },
      { id: "llm", label: "LLM" },
      { id: "options", label: "Options" },
      { id: "crypto", label: "Crypto" },
      { id: "stale", label: "Stale Positions" }
    ];
    let activeSection = "connection";
    let backendUrl = localStorage.getItem("mahoraga_backend_url") || "";
    let apiToken = localStorage.getItem("mahoraga_api_token") || "";
    $$renderer2.push(`<div class="min-h-screen bg-hud-bg flex"><nav class="w-48 shrink-0 border-r border-hud-line p-4 sticky top-0 h-screen"><a href="/" class="hud-label hover:text-hud-primary transition-colors block mb-6">← DASHBOARD</a> <h2 class="text-sm font-light text-hud-text-bright mb-4">SETTINGS</h2> <ul class="space-y-1"><!--[-->`);
    const each_array = ensure_array_like(SECTIONS);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let section = each_array[$$index];
      $$renderer2.push(`<li><button${attr_class(`w-full text-left px-2 py-1.5 text-[11px] transition-colors ${stringify(activeSection === section.id ? "text-hud-text-bright bg-hud-line/30" : "text-hud-text-dim hover:text-hud-text")}`)}>${escape_html(section.label)}</button></li>`);
    }
    $$renderer2.push(`<!--]--></ul></nav> <main class="flex-1 max-w-4xl p-6 pb-20 space-y-6"><section id="section-connection">`);
    Panel($$renderer2, {
      title: "CONNECTION",
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="space-y-4"><div><label class="hud-label block mb-1">Backend URL</label> <input type="text" class="hud-input w-full"${attr("value", backendUrl)} placeholder="Leave empty for relative /api (default)"/> <p class="text-[9px] text-hud-text-dim mt-1">E.g. https://mahoraga.jurrejan.workers.dev/agent — leave empty for local dev.</p></div> <div><label class="hud-label block mb-1">API Token</label> <input type="password" class="hud-input w-full"${attr("value", apiToken)} placeholder="Enter MAHORAGA_API_TOKEN"/> <p class="text-[9px] text-hud-text-dim mt-1">Your MAHORAGA_API_TOKEN from Cloudflare secrets. Required for all API access.</p></div> <div class="flex items-center gap-4"><button class="hud-button">Save Connection</button> `);
        StatusIndicator($$renderer3, {
          status: dashboard.error ? "error" : dashboard.status ? "active" : "inactive",
          label: dashboard.error ? "DISCONNECTED" : dashboard.status ? "CONNECTED" : "UNKNOWN"
        });
        $$renderer3.push(`<!----></div></div>`);
      }
    });
    $$renderer2.push(`<!----></section> `);
    {
      $$renderer2.push("<!--[!-->");
      Panel($$renderer2, {
        title: "LOADING",
        children: ($$renderer3) => {
          $$renderer3.push(`<p class="text-hud-text-dim text-[11px]">Waiting for config from backend...</p>`);
        }
      });
    }
    $$renderer2.push(`<!--]--></main></div>`);
  });
}
export {
  _page as default
};
