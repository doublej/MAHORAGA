export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.DHu4NrMQ.js",app:"_app/immutable/entry/app.GQkGH5PP.js",imports:["_app/immutable/entry/start.DHu4NrMQ.js","_app/immutable/chunks/D2m8NTbY.js","_app/immutable/chunks/BMldKSzV.js","_app/immutable/chunks/CX1Vrt1c.js","_app/immutable/entry/app.GQkGH5PP.js","_app/immutable/chunks/BMldKSzV.js","_app/immutable/chunks/BS5HiHz8.js","_app/immutable/chunks/Dvq9GajI.js","_app/immutable/chunks/CX1Vrt1c.js","_app/immutable/chunks/CobWLHRY.js","_app/immutable/chunks/BX5sa-_w.js","_app/immutable/chunks/BonPI4V-.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/settings",
				pattern: /^\/settings\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
