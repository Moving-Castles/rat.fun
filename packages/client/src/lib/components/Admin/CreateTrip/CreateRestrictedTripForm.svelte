<script lang="ts">
  import { gameConfig } from "$lib/modules/state/stores"
  import { playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { CharacterCounter, BigButton } from "$lib/components/Shared"
  import { busy } from "$lib/modules/action-manager/index.svelte"
  import { typeHit } from "$lib/modules/sound"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { MIN_TRIP_CREATION_COST, DEFAULT_SUGGESTED_TRIP_CREATION_COST } from "@server/config"
  import { isPhone } from "$lib/modules/ui/state.svelte"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  let {
    tripDescription = $bindable(""),
    tripCreationCost = $bindable(DEFAULT_SUGGESTED_TRIP_CREATION_COST),
    fixedMinValueToEnter = $bindable(100),
    overrideMaxValuePerWinPercentage = $bindable(100),
    textareaElement = $bindable<HTMLTextAreaElement | null>(null),
    selectedFolderTitle,
    onFolderSelect,
    onSubmit,
    placeholder
  }: {
    tripDescription: string
    tripCreationCost: number
    fixedMinValueToEnter: number
    overrideMaxValuePerWinPercentage: number
    textareaElement: HTMLTextAreaElement | null
    selectedFolderTitle?: string
    onFolderSelect?: () => void
    onSubmit: () => void
    placeholder: string
  } = $props()

  // Floor values to ensure they're integers
  let flooredTripCreationCost = $derived(Math.floor(tripCreationCost))
  let flooredMinValueToEnter = $derived(Math.floor(fixedMinValueToEnter))

  // Calculate max win amount based on percentage and creation cost
  let maxWinAmount = $derived(
    Math.floor((flooredTripCreationCost * overrideMaxValuePerWinPercentage) / 100)
  )

  // Prompt has to be between 1 and MAX_TRIP_PROMPT_LENGTH characters
  let invalidTripDescriptionLength = $derived(
    tripDescription.length < 1 || tripDescription.length > $gameConfig.maxTripPromptLength
  )

  // Validation for challenge trip parameters
  let invalidMinValueToEnter = $derived(flooredMinValueToEnter <= 0)
  let invalidMaxWinPercentage = $derived(
    overrideMaxValuePerWinPercentage <= 0 || overrideMaxValuePerWinPercentage > 100
  )

  // Disabled if:
  // - Trip description is invalid
  // - Trip creation is busy
  // - Trip creation cost is less than minimum
  // - Player has insufficient balance
  // - No folder is selected (when folder selection is enabled)
  // - Min value to enter is invalid
  // - Max win percentage is invalid
  const disabled = $derived(
    invalidTripDescriptionLength ||
      busy.CreateTrip.current !== 0 ||
      flooredTripCreationCost < MIN_TRIP_CREATION_COST ||
      $playerERC20Balance < flooredTripCreationCost ||
      (onFolderSelect && !selectedFolderTitle) ||
      invalidMinValueToEnter ||
      invalidMaxWinPercentage
  )
</script>

<div class="controls">
  <!-- TRIP DESCRIPTION -->
  <div class="form-group">
    <label for="trip-description">
      <span class="highlight">{UI_STRINGS.tripDescription}</span>
      <CharacterCounter
        currentLength={tripDescription.length}
        maxLength={$gameConfig.maxTripPromptLength}
      />
    </label>
    <textarea
      disabled={busy.CreateTrip.current !== 0}
      id="trip-description"
      rows={$isPhone ? 3 : 4}
      {placeholder}
      oninput={typeHit}
      bind:value={tripDescription}
      bind:this={textareaElement}
    ></textarea>

    {#if selectedFolderTitle && onFolderSelect}
      <div class="folder-select">
        <span class="highlight">Trip Category</span>
        <div>
          <button onclick={onFolderSelect} class="select-folder-button">
            {selectedFolderTitle} <span class="big">×</span>
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- CHALLENGE TRIP PARAMETERS -->
  <div class="challenge-params">
    <div class="challenge-header">
      <span class="highlight">Challenge Trip Settings</span>
    </div>

    <div class="param-grid">
      <!-- TRIP CREATION COST -->
      <div class="param-group">
        <label for="creation-cost">
          <span class="param-label">Creation Cost</span>
        </label>
        <div class="param-input-wrapper">
          <input
            id="creation-cost"
            type="number"
            class="param-input"
            min={MIN_TRIP_CREATION_COST}
            max={$playerERC20Balance}
            oninput={typeHit}
            onblur={e => {
              const value = Number((e.target as HTMLInputElement).value)
              if (value < MIN_TRIP_CREATION_COST) {
                tripCreationCost = MIN_TRIP_CREATION_COST
              } else if (value > $playerERC20Balance) {
                tripCreationCost = $playerERC20Balance
              }
            }}
            bind:value={tripCreationCost}
          />
          <span class="param-unit">{CURRENCY_SYMBOL}</span>
        </div>
      </div>

      <!-- MIN RAT VALUE TO ENTER -->
      <div class="param-group">
        <label for="min-value">
          <span class="param-label">Min Rat Value</span>
        </label>
        <div class="param-input-wrapper">
          <input
            id="min-value"
            type="number"
            class="param-input"
            class:invalid={invalidMinValueToEnter}
            min={1}
            oninput={typeHit}
            onblur={e => {
              const value = Number((e.target as HTMLInputElement).value)
              if (value < 1) {
                fixedMinValueToEnter = 1
              }
            }}
            bind:value={fixedMinValueToEnter}
          />
          <span class="param-unit">{CURRENCY_SYMBOL}</span>
        </div>
      </div>

      <!-- MAX WIN PERCENTAGE -->
      <div class="param-group">
        <label for="max-win-pct">
          <span class="param-label">Max Win %</span>
        </label>
        <div class="param-input-wrapper">
          <input
            id="max-win-pct"
            type="number"
            class="param-input"
            class:invalid={invalidMaxWinPercentage}
            min={1}
            max={100}
            oninput={typeHit}
            onblur={e => {
              const value = Number((e.target as HTMLInputElement).value)
              if (value < 1) {
                overrideMaxValuePerWinPercentage = 1
              } else if (value > 100) {
                overrideMaxValuePerWinPercentage = 100
              }
            }}
            bind:value={overrideMaxValuePerWinPercentage}
          />
          <span class="param-unit">%</span>
        </div>
      </div>
    </div>
  </div>

  <!-- CALCULATED/DISPLAY VALUES -->
  <div class="calculated-values">
    <div class="value-box">
      <div class="value-label">MIN RISK</div>
      <div class="value-amount">
        <span>{flooredMinValueToEnter} {CURRENCY_SYMBOL}</span>
      </div>
    </div>
    <div class="value-box">
      <div class="value-label">MAX WIN</div>
      <div class="value-amount">
        <span>{maxWinAmount} {CURRENCY_SYMBOL}</span>
      </div>
    </div>
  </div>
</div>

<!-- ACTIONS -->
<div class="actions">
  <BigButton
    text="Create Challenge Trip"
    type="create_trip"
    cost={flooredTripCreationCost}
    {disabled}
    onclick={onSubmit}
  />
</div>

<style lang="scss">
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"] {
    appearance: textfield;
    -moz-appearance: textfield;
  }

  .folder-select {
    display: flex;
    flex-flow: column nowrap;
    gap: 8px;
  }

  .select-folder-button {
    font-size: var(--font-size-medium);
    white-space: nowrap;
    font-family: var(--special-font-stack);
    line-height: 32px;
    display: flex;
    gap: 4px;
    align-items: center;

    .big {
      font-size: var(--font-size-mascot);
      line-height: 20px;
      display: block;
      transform: translateY(-2px);
    }
  }

  .controls {
    display: flex;
    justify-self: start;
    gap: 12px;
    flex-flow: column nowrap;
    flex: 1;
  }

  .highlight {
    background: var(--color-grey-mid);
    padding: 5px;
    color: var(--background);
  }

  .form-group {
    display: flex;
    flex-flow: column nowrap;
    gap: 8px;

    label {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    textarea {
      width: 100%;
      padding: 5px;
      border: none;
      background: var(--foreground);
      font-family: var(--special-font-stack);
      font-size: var(--font-size-medium);
      border-radius: 0;
      resize: none;
      outline-color: var(--color-grey-light);
      outline-width: 1px;
    }
  }

  .challenge-params {
    display: flex;
    flex-flow: column nowrap;
    gap: 12px;

    .challenge-header {
      display: flex;
      align-items: center;
    }

    .param-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;

      @media (max-width: 800px) {
        grid-template-columns: 1fr;
        gap: 8px;
      }
    }

    .param-group {
      display: flex;
      flex-flow: column nowrap;
      gap: 4px;

      .param-label {
        font-family: var(--typewriter-font-stack);
        font-size: var(--font-size-small);
        color: var(--color-grey-light);
      }

      .param-input-wrapper {
        display: flex;
        align-items: center;
        gap: 4px;
        background: var(--foreground);
        padding: 4px 8px;

        .param-input {
          flex: 1;
          background: transparent;
          color: var(--background);
          font-family: var(--special-font-stack);
          font-size: var(--font-size-large);
          border: none;
          width: 100%;
          text-align: left;
          outline: none;

          &.invalid {
            color: var(--color-bad);
          }

          &:focus {
            border: none;
            outline: none;
          }
        }

        .param-unit {
          font-family: var(--special-font-stack);
          font-size: var(--font-size-normal);
          color: var(--background);
          opacity: 0.7;
        }
      }
    }
  }

  .calculated-values {
    display: flex;
    gap: 0;
    flex: 1;

    .value-box {
      flex: 1;
      padding: 10px;
      border: 1px solid var(--color-border);
      background: var(--background);
      display: flex;
      flex-flow: column nowrap;
      justify-content: stretch;
      position: relative;

      .value-label {
        font-family: var(--typewriter-font-stack);
        font-size: var(--font-size-small);
        color: var(--color-grey-light);
        position: absolute;
        top: 8px;
        left: 8px;
      }

      .value-amount {
        font-family: var(--special-font-stack);
        font-size: var(--font-size-large);
        color: var(--foreground);
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;

        @media screen and (min-width: 800px) {
          font-size: 42px;
        }
      }
    }
  }

  .actions {
    display: flex;
    flex-flow: column nowrap;
    gap: 12px;
    overflow: hidden;
    height: 160px;
  }
</style>
