<script lang="ts">
  import { formatUnits, type Hex, parseUnits } from "viem"
  import {
    type AuctionParams,
    CustomQuoter,
    type Permit2PermitData,
    swapExactSingle,
    isPermit2AllowedMaxRequired,
    permit2AllowMax,
    signPermit2ForUniversalRouter,
    balanceOf
  } from "doppler"
  import { BigButton } from "$lib/components/Shared"
  import { prepareConnectorClientForTransaction } from "$lib/modules/drawbridge/connector"
  import { userAddress } from "$lib/modules/drawbridge"
  import { publicNetwork } from "$lib/modules/network"
  import { onMount } from "svelte"
  import { signTypedData } from "viem/actions"

  let quoter = $state({} as CustomQuoter)
  let isExactOut = $state(false)
  let amountIn = $state<bigint | undefined>(undefined)
  let amountOut = $state<bigint | undefined>(undefined)
  let isPermit2Req = $state<boolean | null>(null)
  let permit = $state<Permit2PermitData | undefined>(undefined)
  let permitSignature = $state<Hex | undefined>(undefined)

  // TODO make this more reactive
  let numeraireBalance = $state<number | undefined>(undefined)
  let tokenBalance = $state<number | undefined>(undefined)

  let {
    auctionParams,
    spentAmount
  }: {
    auctionParams: AuctionParams
    spentAmount: bigint
  } = $props()

  onMount(async () => {
    // Quoter provides the expected amount user didn't specify (input for exact output, or output for exact input)
    quoter = new CustomQuoter(
      $publicNetwork.publicClient,
      $publicNetwork.publicClient.chain.id,
      auctionParams
    )

    isPermit2Req = await isPermit2AllowedMaxRequired(
      $publicNetwork.publicClient,
      $userAddress,
      auctionParams.numeraire.address
    )

    const unformattedNumeraireBalance = await balanceOf(
      $publicNetwork.publicClient,
      auctionParams.numeraire.address,
      $userAddress
    )
    numeraireBalance = Number(
      formatUnits(unformattedNumeraireBalance, auctionParams.numeraire.decimals)
    )

    const unformattedTokenBalance = await balanceOf(
      $publicNetwork.publicClient,
      auctionParams.token.address,
      $userAddress
    )
    tokenBalance = Number(formatUnits(unformattedTokenBalance, auctionParams.token.decimals))
  })

  function getAmountIn() {
    return !amountIn ? undefined : Number(formatUnits(amountIn, auctionParams.numeraire.decimals))
  }

  function setAmountIn(v: number | undefined) {
    isExactOut = false
    if (v === undefined || v === null) {
      amountIn = undefined
      amountOut = undefined
    } else {
      amountIn = parseUnits(v.toString(), auctionParams.numeraire.decimals)
      quoter.quoteExactInputV4(amountIn, true).then(result => {
        amountOut = result.amountOut
      })
    }

    permit = undefined
    permitSignature = undefined
  }

  function getAmountOut() {
    return !amountOut ? undefined : Number(formatUnits(amountOut, auctionParams.token.decimals))
  }

  function setAmountOut(v: number | undefined) {
    isExactOut = true
    if (v === undefined || v === null) {
      amountIn = undefined
      amountOut = undefined
    } else {
      amountOut = parseUnits(v.toString(), auctionParams.token.decimals)
      quoter.quoteExactOutputV4(amountOut, true).then(result => {
        amountIn = result.amountIn
      })
    }

    permit = undefined
    permitSignature = undefined
  }

  async function sendPermit2AllowMax() {
    const client = await prepareConnectorClientForTransaction()
    const { receipt } = await permit2AllowMax(
      $publicNetwork.publicClient,
      client,
      auctionParams.numeraire.address
    )
    if (receipt.status === "success") {
      isPermit2Req = false
    }
  }

  async function sendSignPermit2() {
    const client = await prepareConnectorClientForTransaction()
    // TODO ensure signTypedData in a less hacky way
    const extendedClient = (client as any).extend((client: any) => ({
      signTypedData: (args: any) => signTypedData(client, args)
    }))

    const amount = isExactOut ? amountOut : amountIn
    if (amount === undefined) throw new Error("amount is undefined")
    // For exact out give 10% padding to permit amount to account for price variance and imprecise conversion
    // (because permit is always for input currency)
    const amountPadded = isExactOut ? (amount * 110n) / 100n : amount
    const result = await signPermit2ForUniversalRouter(
      $publicNetwork.publicClient,
      extendedClient,
      auctionParams,
      amountPadded,
      {
        isOut: isExactOut
      }
    )
    permit = result.permit
    permitSignature = result.permitSignature
  }

  async function sendSwap() {
    if (!$userAddress) throw new Error("wallet not connected")

    const amount = isExactOut ? amountOut : amountIn
    if (amount === undefined) throw new Error("amount is undefined")

    const client = await prepareConnectorClientForTransaction()
    const swapResult = swapExactSingle($publicNetwork.publicClient, client, auctionParams, amount, {
      isOut: isExactOut,
      permit,
      permitSignature
    })
    console.log("swapResult:", swapResult)
  }
</script>

<div class="outer-container">
  <div>
    numeraire balance: {numeraireBalance}
  </div>
  <div>
    token balance: {tokenBalance}
  </div>
  <div>
    spent numeraire: {formatUnits(spentAmount, auctionParams.numeraire.decimals)} / {formatUnits(
      BigInt(auctionParams.spendLimitAmount),
      auctionParams.numeraire.decimals
    )}
  </div>

  numeraire:
  <input type="number" bind:value={getAmountIn, setAmountIn} />

  rat:
  <input type="number" bind:value={getAmountOut, setAmountOut} />

  {#if isPermit2Req}
    <BigButton
      text="allow permit2"
      onclick={() => {
        sendPermit2AllowMax()
      }}
    />
  {:else if !permit || !permitSignature}
    <BigButton
      disabled={!amountIn}
      text="sign permit"
      onclick={() => {
        sendSignPermit2()
      }}
    />
  {:else}
    <BigButton
      text="swap"
      onclick={() => {
        sendSwap()
      }}
    />
  {/if}
</div>

<style lang="scss">
  .outer-container {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;
  }
</style>
