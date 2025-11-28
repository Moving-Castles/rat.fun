<script lang="ts">
  import { busy, sendApprove } from "$lib/modules/action-manager/index.svelte"
  import { playerERC20Allowance } from "$lib/modules/erc20Listener/stores"
  import { refetchAllowance } from "$lib/modules/erc20Listener"
  import { BigButton, SmallSpinner } from "$lib/components/Shared"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { errorHandler } from "$lib/modules/error-handling"

  let {
    onclose,
    warningMessage
  }: {
    onclose: () => void
    warningMessage?: string
  } = $props()

  // Max allowance value for slider (use a large but reasonable number)
  const MAX_SLIDER_VALUE = 1_000_000

  // Default to MAX value
  let allowanceValue = $state(MAX_SLIDER_VALUE)
  let isSettingAllowance = $state(false)

  // Determine if we're in a busy state
  const isBusy = $derived(busy.Approve.current !== 0 || isSettingAllowance)

  // Display value for the input (shows "MAX" when at max)
  const displayValue = $derived(allowanceValue >= MAX_SLIDER_VALUE ? "MAX" : String(allowanceValue))

  // Format large allowance values for display
  const formatAllowance = (value: number): string => {
    if (value >= MAX_SLIDER_VALUE) {
      return "MAX"
    }
    return value.toLocaleString()
  }

  // Handle input change for the allowance display
  const handleInputChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    const value = input.value.toUpperCase()

    if (value === "MAX" || value === "M" || value === "MA") {
      allowanceValue = MAX_SLIDER_VALUE
    } else {
      const numValue = Number(value.replace(/,/g, ""))
      if (!isNaN(numValue)) {
        allowanceValue = Math.min(MAX_SLIDER_VALUE, Math.max(0, numValue))
      }
    }
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onclose()
    }
  }

  const handleSetAllowance = async () => {
    isSettingAllowance = true
    try {
      await sendApprove(BigInt(Math.floor(allowanceValue)))
      await refetchAllowance()
      onclose()
    } catch (error) {
      errorHandler(error)
    } finally {
      isSettingAllowance = false
    }
  }

  const handleRevokeAllowance = async () => {
    isSettingAllowance = true
    try {
      // Revoke by setting allowance to 0
      await sendApprove(0n)
      await refetchAllowance()
      onclose()
    } catch (error) {
      errorHandler(error)
    } finally {
      isSettingAllowance = false
    }
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
    <div class="manage-allowance">
      {#if isBusy}
        <!-- Loading State -->
        <h2>{UI_STRINGS.settingAllowance}</h2>
        <div class="loading-spinner">
          <SmallSpinner />
        </div>
        <p>{UI_STRINGS.transactionInProgress}</p>
      {:else}
        <!-- Initial State -->
        <h2>{UI_STRINGS.manageAllowance}</h2>

        {#if warningMessage}
          <div class="warning-message">
            {warningMessage}
          </div>
        {/if}

        <p class="description">{UI_STRINGS.manageAllowanceDescription}</p>

        <!-- Current Allowance -->
        <div class="current-allowance">
          <span class="label">{UI_STRINGS.currentAllowance}:</span>
          <span class="value">{formatAllowance($playerERC20Allowance)} {CURRENCY_SYMBOL}</span>
        </div>

        <!-- Allowance Slider -->
        <div class="slider-group">
          <label for="allowance-slider">
            <span class="highlight">{UI_STRINGS.newAllowance}</span>
            <input
              class="allowance-display"
              oninput={handleInputChange}
              value={displayValue}
              type="text"
            />
          </label>
          <div class="slider-container">
            <input
              type="range"
              id="allowance-slider"
              class="allowance-slider"
              step={Math.max(1, Math.floor(MAX_SLIDER_VALUE / 100))}
              min={0}
              max={MAX_SLIDER_VALUE}
              bind:value={allowanceValue}
            />
            <div class="slider-labels">
              <span class="slider-min">0 {CURRENCY_SYMBOL}</span>
              <span class="slider-max">MAX</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="approve-button">
          <BigButton
            text={UI_STRINGS.setAllowance}
            onclick={handleSetAllowance}
            disabled={isBusy}
          />
        </div>
        {#if $playerERC20Allowance > 0}
          <div class="revoke-button">
            <BigButton
              text={UI_STRINGS.revokeApproval}
              onclick={handleRevokeAllowance}
              tippyText={UI_STRINGS.revokeApprovalInstruction}
              type="danger"
            />
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  .modal-backdrop {
    background: rgba(0, 0, 0, 0.8);
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

  .manage-allowance {
    width: 500px;
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
      font-size: 24px;
      margin: 0;
      color: var(--color-white);
      text-align: center;
    }

    .description {
      font-size: 14px;
      color: var(--color-grey-light);
      text-align: center;
      margin: 0;
      font-family: var(--typewriter-font-stack);
      line-height: 1.5;
    }

    .warning-message {
      background: var(--color-error);
      color: var(--color-white);
      padding: 10px 15px;
      font-family: var(--typewriter-font-stack);
      font-size: var(--font-size-normal);
      text-align: center;
    }

    .current-allowance {
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

    .slider-group {
      display: block;
      width: 100%;

      label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;

        .highlight {
          background: var(--color-alert);
          padding: 5px;
          color: var(--background);
          font-weight: normal;
        }
      }

      .allowance-display {
        background: var(--foreground);
        padding: 5px;
        color: var(--background);
        font-weight: normal;
        font-family: var(--typewriter-font-stack);
        border: none;
        width: 100px;
        text-align: right;
        outline: none;

        &:focus {
          border: none;
          outline: none;
        }
      }
    }

    .slider-container {
      width: 100%;
      margin-top: 10px;

      .allowance-slider {
        width: 100%;
        height: 8px;
        background: var(--background);
        border: 1px solid var(--foreground);
        outline: none;
        -webkit-appearance: none;
        appearance: none;
        cursor: pointer;

        &::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: var(--color-alert);
          border: 2px solid var(--background);
          cursor: pointer;
        }

        &::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: var(--foreground);
          border: 2px solid var(--background);
          cursor: pointer;
          border-radius: 0;
        }

        &::-webkit-slider-track {
          background: var(--background);
          height: 8px;
        }

        &::-moz-range-track {
          background: var(--background);
          height: 8px;
          border: none;
        }
      }

      .slider-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 5px;
        font-family: var(--typewriter-font-stack);
        font-size: var(--font-size-small);
        color: var(--foreground);
      }
    }

    .approve-button {
      display: flex;
      flex-flow: column nowrap;
      gap: 12px;
      align-items: center;
      margin-top: 10px;
      height: 160px;
    }
    .revoke-button {
      display: flex;
      flex-flow: column nowrap;
      gap: 12px;
      align-items: center;
      margin-top: 10px;
      height: 100px;
    }

    .loading-spinner {
      font-size: 32px;
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
