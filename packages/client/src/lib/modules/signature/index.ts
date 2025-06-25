import { get } from 'svelte/store';
import { OFFCHAIN_VALIDATION_MESSAGE } from '@server/config';
import { transactionQueue } from '@latticexyz/common/actions';
import { store as accountKitStore } from '@latticexyz/account-kit/bundle';
import { publicNetwork, walletNetwork } from '$lib/modules/network';
import { addChain, switchChain } from 'viem/actions';
import { getChain } from '$lib/mud/utils';
import { createWalletClient, custom } from 'viem';

export async function getSignature() {
	const userAccountClient = accountKitStore?.getState()?.userAccountClient;

	let client;
	if (userAccountClient) {
		const preparedClient = await prepareUserAccountClient(userAccountClient);
		client = createWalletClient({
			account: preparedClient.account,
			chain: preparedClient.chain,
			transport: custom(preparedClient.transport)
		});
	} else {
		client = get(walletNetwork).walletClient;
	}

	console.log('client', client);

	const signature = await client.signMessage({
		message: OFFCHAIN_VALIDATION_MESSAGE
	});

	return signature;
}

async function prepareUserAccountClient(userAccountClient: any) {
	// User's wallet may switch between different chains, ensure the current chain is correct
	const expectedChainId = get(publicNetwork).config.chain.id;
	if (userAccountClient.chain.id !== expectedChainId) {
		try {
			await switchChain(userAccountClient, { id: expectedChainId });
		} catch (e) {
			await addChain(userAccountClient, { chain: getChain(expectedChainId) });
			await switchChain(userAccountClient, { id: expectedChainId });
		}
	}
	// MUD's `transactionQueue` extends the client with `writeContract` method
	return userAccountClient.extend(transactionQueue({}));
}
