// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '@latticexyz/account-kit/bundle' {
	export function mount(config: {
		wagmiConfig: unknown;
		accountKitConfig: {
			theme: string;
			worldAddress: string;
			erc4337: boolean;
			chainId: number;
			appInfo: { name: string };
		};
	}): void;
}

export {};
