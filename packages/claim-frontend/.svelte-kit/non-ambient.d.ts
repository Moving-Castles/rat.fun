
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>
		};
		Pathname(): "/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/_redirects" | "/fonts/index.css" | "/images/dust.png" | "/images/favicon.png" | "/images/logo.png" | "/images/mascot/bubble2.png" | "/images/mascot/mascot-layer-1.png" | "/images/mascot/mascot-layer-2.png" | "/images/mascot/mascot-layer-3.png" | "/images/mascot/mascot-layer-4.png" | "/images/pfp.png" | "/sitemap.xml" | "/sounds/ratfun/ui/bigButton-down.mp3" | "/sounds/ratfun/ui/bigButton-up.mp3" | "/sounds/ratfun/ui/boing.mp3" | "/sounds/ratfun/ui/smallButton-down.mp3" | "/sounds/ratfun/ui/smallButton-up.mp3" | "/sounds/ratfun/ui/tick.mp3" | string & {};
	}
}