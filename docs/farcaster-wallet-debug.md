# Farcaster MiniApp Wallet - UnsupportedProviderMethodError Debug

## Error Summary

```
UnsupportedProviderMethodError: The provider does not support the requested method.
Details: The provider does not support the requested method.
Version: viem@2.39.0
```

Occurs when users connect with the Farcaster internal wallet (`xyz.farcaster.MiniAppWallet`) during the allowance approval flow.

---

## Root Cause Analysis

### The Problem

The error occurs when the **Farcaster MiniApp wallet** is used. The flow:

1. User connects via Farcaster MiniApp → wallet detected via `injected()` connector
2. User clicks "AUTHORIZE REWIRING" → `AllowanceLoading.svelte` mounts
3. Component calls `approveMax()` → `executeTransaction(WorldFunctions.Approve, ...)`
4. **Critical path**: Since `walletType === WALLET_TYPE.DRAWBRIDGE`, `useConnectorClient = true`
5. `prepareConnectorClientForTransaction()` is called → returns the raw wagmi connector client
6. `client.writeContract()` is called on the ERC20 contract for approval

### The Root Cause

The Farcaster MiniApp wallet (backed by Privy's embedded wallet) doesn't support certain RPC methods that viem's `writeContract` calls internally. Even when gas and nonce are pre-fetched via the public client, the `writeContract` call still fails.

The issue is that the generic `injected()` wagmi connector doesn't properly handle the Farcaster wallet's specific requirements. The official `@farcaster/miniapp-wagmi-connector` is designed to handle these edge cases.

### Evidence from Console Logs

```
[executeTransaction] Starting approve transaction
[executeTransaction] Estimating gas via public client...
[executeTransaction] Gas estimated: 46751
[executeTransaction] Nonce fetched: 0
[executeTransaction] Calling writeContract on wallet...
parseViemError UnsupportedProviderMethodError: The Provider does not support the requested method.
```

This shows the error happens **after** gas and nonce are fetched, during the actual `writeContract` call.

---

## Implemented Fixes

### Fix 1: Official Farcaster MiniApp Connector (IMPLEMENTED)

Installed `@farcaster/miniapp-wagmi-connector` and updated `getConnectors.ts` to detect Farcaster context and use the official connector.

**Detection methods:**

1. Check if SDK wallet provider is available
2. Check referrer for Farcaster domains (farcaster.xyz, warpcast.com)
3. Check window.ethereum for Farcaster wallet indicators

### Fix 2: Public Client for Gas/Nonce Estimation (IMPLEMENTED)

Updated `executeTransaction.ts` to use the public client (RPC transport) for:

- Gas estimation via `publicClient.estimateGas()`
- Nonce fetching via `publicClient.getTransactionCount()`

This avoids calling unsupported RPC methods on the wallet provider.

### Fix 3: Resilient Chain Switching (IMPLEMENTED)

Updated `connector.ts` to gracefully handle wallets that don't support `wallet_switchEthereumChain` or `wallet_addEthereumChain`.

### Fix 4: Replace viem writeContract with wagmi sendTransaction (IMPLEMENTED)

Even with the official Farcaster connector, fixes 1-3, viem's `writeContract` still fails because it calls internal RPC methods that the Privy embedded wallet doesn't support.

**Solution**: Use wagmi's `sendTransaction` with manually encoded function data instead of viem's `writeContract`. This bypasses viem's internal processing that causes the `UnsupportedProviderMethodError`.

```typescript
// Before (fails with Farcaster wallet)
tx = await client.writeContract({
  address: erc20Address,
  abi: erc20Abi,
  functionName: "approve",
  args: approveArgs,
  gas: gasEstimate,
  nonce
})

// After (works with Farcaster wallet)
const data = encodeFunctionData({
  abi: erc20Abi,
  functionName: "approve",
  args: approveArgs
})
const wagmiConfig = getWagmiConfig()
tx = await sendTransaction(wagmiConfig, {
  to: erc20Address,
  data,
  gas: gasEstimate,
  nonce
})
```

---

## Key Files Modified

| File                                                                          | Changes                                                     |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `packages/client/src/lib/modules/drawbridge/getConnectors.ts`                 | Added Farcaster MiniApp detection and official connector    |
| `packages/client/src/lib/modules/drawbridge/connector.ts`                     | Made chain switching resilient, added `getWagmiConfig()`    |
| `packages/client/src/lib/modules/on-chain-transactions/executeTransaction.ts` | Use wagmi `sendTransaction` instead of viem `writeContract` |

---

## Testing Notes

After deploying, check console logs for:

1. `[getConnectors] Detected Farcaster MiniApp context, using farcasterMiniApp connector` - confirms official connector is being used
2. `[executeTransaction] Gas estimated: X` - confirms gas estimation via public client works
3. `[executeTransaction] Nonce fetched: X` - confirms nonce fetching via public client works
4. `[executeTransaction] Calling sendTransaction via wagmi...` - confirms using wagmi instead of viem
5. `[executeTransaction] sendTransaction returned tx: 0x...` - confirms transaction succeeded

---

## Sources

- [Farcaster MiniApp Wallet Guide](https://miniapps.farcaster.xyz/docs/guides/wallets)
- [Farcaster MiniApp SDK Changelog](https://miniapps.farcaster.xyz/docs/sdk/changelog)
- [@farcaster/miniapp-wagmi-connector npm](https://www.npmjs.com/package/@farcaster/miniapp-wagmi-connector)
- [Viem FAQ on Wallet Client Limitations](https://viem.sh/docs/faq)
- [Viem writeContract](https://viem.sh/docs/contract/writeContract)
- [Viem sendTransaction](https://viem.sh/docs/actions/wallet/sendTransaction)
