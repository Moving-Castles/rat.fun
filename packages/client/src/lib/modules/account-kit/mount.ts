
import type { Chain } from 'viem';
import { ENVIRONMENT } from '$lib/mud/enums';
import { mount } from '@latticexyz/account-kit/bundle';
import { createConfig, http } from '@wagmi/core';
import { getNetworkConfig } from '$lib/mud/getNetworkConfig';
import { supportedChains } from '$lib/mud/supportedChains';
import { transportObserver } from '@latticexyz/common';
import { fallback, webSocket } from 'viem';

export function mountAccountKit(environment: ENVIRONMENT) {
    // Hack to fix:  "Failed to mount MUD Account Kit. ReferenceError: process is not defined"
    window.process = {
        ...window.process
    };

    const networkConfig = getNetworkConfig(environment);

    // Only include foundry chain in development
    const chains =
        environment === ENVIRONMENT.DEVELOPMENT
            ? supportedChains
            : supportedChains.filter((c) => c.id !== 31337);

    const wagmiConfig = createConfig({
        chains: chains as readonly [Chain, ...Chain[]],
        pollingInterval: 1_000,
        // TODO: how to properly set up a transport config for all chains supported as bridge sources?
        transports: Object.fromEntries(
            chains.map((chain) => {
                if (chain.rpcUrls.default.webSocket)
                    return [chain.id, transportObserver(fallback([webSocket(), http()]))];
                return [chain.id, transportObserver(http())];
            })
        )
    });

    mount({
        wagmiConfig,
        accountKitConfig: {
            theme: 'dark',
            worldAddress: networkConfig.worldAddress,
            erc4337: false,
            chainId: networkConfig.chainId,
            appInfo: {
                name: 'RAT.FUN'
            }
        }
    });
}