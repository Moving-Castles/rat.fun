<script lang="ts">
  import { busy, sendAddTripBalance } from "$lib/modules/action-manager/index.svelte"
  import { playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { BigButton, SmallSpinner } from "$lib/components/Shared"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { errorHandler } from "$lib/modules/error-handling"

  let {
    tripId,
    onclose
  }: {
    tripId: string
    onclose: () => void
  } = $props()

  const MIN_AMOUNT = 1

  let amountValue = $state(MIN_AMOUNT)
  let isSubmitting = $state(false)

  const isBusy = $derived(busy.AddTripBalance.current !== 0 || isSubmitting)

  const maxAmount = $derived($playerERC20Balance)

  const isValidAmount = $derived(amountValue >= MIN_AMOUNT && amountValue <= maxAmount)

  const handleInputChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    const value = Number(input.value.replace(/,/g, ""))
    if (!isNaN(value)) {
      amountValue = Math.max(0, Math.floor(value))
    }
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !isBusy) {
      onclose()
    }
  }

  const handleSubmit = async () => {
    if (!isValidAmount || isBusy) return

    isSubmitting = true
    try {
      await sendAddTripBalance(tripId, BigInt(amountValue))
      onclose()
    } catch (error) {
      errorHandler(error)
    } finally {
      isSubmitting = false
    }
  }

  const setMaxAmount = () => {
    amountValue = maxAmount
  }
</script>

<svelte:window onkeydown={onKeyDown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="modal-backdrop"
  onclick={e => {
    if (e.target === e.currentTarget && !isBusy) {
      onclose()
    }
  }}
>
  <div class="modal-content">
    <div class="add-balance-modal">
      {#if isBusy}
        <h2>{UI_STRINGS.addingTripBalance}</h2>
        <div class="loading-spinner">
          <SmallSpinner />
        </div>
        <p>{UI_STRINGS.transactionInProgress}</p>
      {:else}
        <h2>{UI_STRINGS.addTripBalance}</h2>

        <p class="description">{UI_STRINGS.addTripBalanceDescription}</p>

        <div class="current-balance">
          <span class="label">{UI_STRINGS.yourBalance}:</span>
          <span class="value">{maxAmount.toLocaleString()} {CURRENCY_SYMBOL}</span>
        </div>

        <div class="input-group">
          <label for="amount-input">
            <span class="highlight">{UI_STRINGS.amountToAdd}</span>
          </label>
          <div class="input-row">
            <input
              id="amount-input"
              class="amount-input"
              type="number"
              min={MIN_AMOUNT}
              max={maxAmount}
              oninput={handleInputChange}
              value={amountValue}
            />
            <button class="max-button" onclick={setMaxAmount} type="button">MAX</button>
          </div>
          {#if amountValue < MIN_AMOUNT}
            <span class="error">{UI_STRINGS.minimumAmount(MIN_AMOUNT)}</span>
          {:else if amountValue > maxAmount}
            <span class="error">{UI_STRINGS.insufficientBalance}</span>
          {/if}
        </div>

        <div class="submit-button">
          <BigButton
            text={UI_STRINGS.addBalance}
            onclick={handleSubmit}
            disabled={!isValidAmount || isBusy}
          />
        </div>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  .modal-backdrop {
    background: var(--background-dark-transparent);
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    overscroll-behavior: none;
    z-index: var(--z-modal);

    @media (max-width: 800px) {
      background: var(--background);
    }
  }

  .modal-content {
    position: relative;
    z-index: 1;
    overflow-x: hidden;
    overflow-y: auto;
    max-height: 90dvh;

    @media (max-width: 800px) {
      width: 100dvw;
      max-height: 100dvh;
    }
  }

  .add-balance-modal {
    width: 400px;
    max-width: 100%;
    display: flex;
    flex-flow: column nowrap;
    background-image: url("/images/texture-3.png");
    background-size: 200px;
    border: 1px solid var(--color-grey-mid);
    padding: 30px;
    gap: 20px;

    @media (max-width: 800px) {
      width: 100dvw;
      border: none;
      padding: 20px;
    }

    h2 {
      font-size: var(--font-size-large);
      margin: 0;
      color: var(--color-white);
      text-align: center;
    }

    .description {
      font-size: var(--font-size-normal);
      color: var(--color-grey-light);
      text-align: center;
      margin: 0;
      font-family: var(--typewriter-font-stack);
      line-height: 1.5;
    }

    .current-balance {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: var(--background);
      border: 1px solid var(--color-border);

      .label {
        font-family: var(--typewriter-font-stack);
        color: var(--color-grey-light);
      }

      .value {
        font-family: var(--special-font-stack);
        color: var(--foreground);
        font-size: var(--font-size-large);
      }
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 10px;

      label {
        .highlight {
          background: var(--color-grey-light);
          padding: 5px;
          color: var(--background);
        }
      }

      .input-row {
        display: flex;
        gap: 10px;
        align-items: stretch;
      }

      .amount-input {
        flex: 1;
        background: var(--foreground);
        padding: 10px;
        color: var(--background);
        font-family: var(--special-font-stack);
        font-size: var(--font-size-large);
        border: none;
        outline: none;

        &:focus {
          border: none;
          outline: none;
        }

        /* Hide number input spinners */
        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        -moz-appearance: textfield;
      }

      .max-button {
        background: var(--color-grey-mid);
        color: var(--foreground);
        border: none;
        padding: 10px 15px;
        font-family: var(--special-font-stack);
        cursor: pointer;

        &:hover {
          background: var(--color-grey-light);
          color: var(--background);
        }
      }

      .error {
        color: var(--color-error);
        font-family: var(--typewriter-font-stack);
        font-size: var(--font-size-small);
      }
    }

    .submit-button {
      display: flex;
      flex-flow: column nowrap;
      gap: 12px;
      align-items: center;
      margin-top: 10px;
      height: 120px;
    }

    .loading-spinner {
      font-size: var(--font-size-large);
      margin: 20px 0;
      text-align: center;
    }

    p {
      text-align: center;
      color: var(--color-grey-light);
      margin: 0;
    }
  }
</style>
