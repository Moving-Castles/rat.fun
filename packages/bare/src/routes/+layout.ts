import type { LayoutLoad } from './$types';
import { getEnvironment, getWalletType } from '$lib/modules/network';
import { getNetworkConfig } from '$lib/mud/getNetworkConfig';

export const prerender = true

export const load: LayoutLoad = async ({ url }) => {
  const environment = getEnvironment(url);
  const networkConfig = getNetworkConfig(environment, url);
	const walletType = getWalletType(url);

	return {
		environment: environment,
		walletType: walletType,
    networkConfig
	};
};
