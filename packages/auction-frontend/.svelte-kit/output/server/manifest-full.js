export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["_redirects","documents/privacy-notice.pdf","documents/sale-terms.pdf","documents/white-paper.pdf","fonts/index.css","images/dust.png","images/favicon.png","images/logo.png","images/mascot/bubble2.png","images/mascot/mascot-layer-1.png","images/mascot/mascot-layer-2.png","images/mascot/mascot-layer-3.png","images/mascot/mascot-layer-4.png","images/pfp.png","sitemap.xml","sounds/ratfun/ui/bigButton-down.mp3","sounds/ratfun/ui/bigButton-up.mp3","sounds/ratfun/ui/boing.mp3","sounds/ratfun/ui/smallButton-down.mp3","sounds/ratfun/ui/smallButton-up.mp3","sounds/ratfun/ui/tick.mp3"]),
	mimeTypes: {".pdf":"application/pdf",".css":"text/css",".png":"image/png",".xml":"text/xml",".mp3":"audio/mpeg"},
	_: {
		client: {start:"_app/immutable/entry/start.BPGBr0e0.js",app:"_app/immutable/entry/app.BeEW8uRe.js",imports:["_app/immutable/entry/start.BPGBr0e0.js","_app/immutable/chunks/C4OIfkoW.js","_app/immutable/chunks/DvviWBzy.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/entry/app.BeEW8uRe.js","_app/immutable/chunks/BYqD9XY9.js","_app/immutable/chunks/DvviWBzy.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/B1xHZ6Rf.js","_app/immutable/chunks/DsnmJJEf.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
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
