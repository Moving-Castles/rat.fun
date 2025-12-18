<script lang="ts">
  import { gameConfig } from "$lib/modules/state/stores"
  import { playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { getTripMaxValuePerWin, getTripMinRatValueToEnter } from "$lib/modules/state/utils"
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
    textareaElement = $bindable<HTMLTextAreaElement | null>(null),
    selectedFolderTitle,
    onFolderSelect,
    onSubmit,
    placeholder
  }: {
    tripDescription: string
    tripCreationCost: number
    textareaElement: HTMLTextAreaElement | null
    selectedFolderTitle?: string
    onFolderSelect?: () => void
    onSubmit: () => void
    placeholder: string
  } = $props()

  let sliderStep = $derived(Number($playerERC20Balance) > 1000 ? 50 : 10)
  let sliderMax = $derived(Math.floor($playerERC20Balance / sliderStep) * sliderStep)

  // Floor the trip creation cost to ensure it's an integer
  let flooredTripCreationCost = $derived(Math.floor(tripCreationCost))

  // 10% of trip creation cost
  let minRatValueToEnter = $derived(getTripMinRatValueToEnter(flooredTripCreationCost))
  // Portion of trip creation cost
  let maxValuePerWin = $derived(
    getTripMaxValuePerWin(flooredTripCreationCost, flooredTripCreationCost)
  )

  // Prompt has to be between 1 and MAX_TRIP_PROMPT_LENGTH characters
  let invalidTripDescriptionLength = $derived(
    tripDescription.length < 1 || tripDescription.length > $gameConfig.maxTripPromptLength
  )

  // Disabled if:
  // - Trip description is invalid
  // - Trip creation is busy
  // - Max value per win is not set
  // - Min rat value to enter is not set
  // - Trip creation cost is less than minimum
  // - Player has insufficient balance
  // - No folder is selected (when folder selection is enabled)
  const disabled = $derived(
    invalidTripDescriptionLength ||
      busy.CreateTrip.current !== 0 ||
      !$maxValuePerWin ||
      !$minRatValueToEnter ||
      flooredTripCreationCost < MIN_TRIP_CREATION_COST ||
      $playerERC20Balance < flooredTripCreationCost ||
      (onFolderSelect && !selectedFolderTitle)
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
      rows={$isPhone ? 3 : 6}
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

  <!-- TRIP CREATION COST SLIDER -->
  <div class="slider-group">
    <div class="slider-header">
      <label for="trip-creation-cost-slider">
        <span class="highlight">{UI_STRINGS.tripCreationCostLabel}</span>
      </label>
      <input
        class="cost-display"
        onblur={e => {
          const value = Number((e.target as HTMLInputElement).value)
          if (value < MIN_TRIP_CREATION_COST || value > $playerERC20Balance) {
            tripCreationCost = Math.min(
              $playerERC20Balance,
              Math.max(MIN_TRIP_CREATION_COST, value)
            )
          }
        }}
        bind:value={tripCreationCost}
        type="number"
      />
    </div>
    <div class="slider-container">
      <div class="slider-label">
        <span class="slider-min">
          {Math.min($playerERC20Balance, MIN_TRIP_CREATION_COST)}
          {CURRENCY_SYMBOL}
        </span>
      </div>
      <input
        type="range"
        id="trip-creation-cost-slider"
        class="cost-slider"
        step={sliderStep}
        min={Math.min($playerERC20Balance, MIN_TRIP_CREATION_COST)}
        max={sliderMax}
        oninput={typeHit}
        bind:value={tripCreationCost}
      />
      <div class="slider-label">
        <span class="slider-max">{sliderMax} {CURRENCY_SYMBOL}</span>
      </div>
    </div>
  </div>

  <!-- CALCULATED VALUES -->
  <div class="calculated-values">
    <div class="value-box">
      <div class="value-label">MIN RISK</div>
      <div class="value-amount">
        <span>{$minRatValueToEnter} {CURRENCY_SYMBOL}</span>
      </div>
    </div>
    <div class="value-box">
      <div class="value-label">MAX WIN</div>
      <div class="value-amount">
        <span>{$maxValuePerWin} {CURRENCY_SYMBOL}</span>
      </div>
    </div>
  </div>
</div>

<!-- ACTIONS -->
<div class="actions">
  <BigButton
    text="Create Trip"
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

  .slider-group {
    display: flex;
    flex-flow: column nowrap;
    gap: 8px;
    width: 100%;

    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cost-display {
      background: var(--foreground);
      color: var(--background);
      font-family: var(--special-font-stack);
      font-size: var(--font-size-large);
      border: none;
      width: 100px;
      text-align: center;
      outline: none;
      &:focus {
        border: none;
        outline: none;
      }
    }
  }

  .slider-container {
    display: flex;
    gap: 8px;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;

    .cost-slider {
      width: 400px;
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
        height: 50px;
        background: var(--color-grey-mid);
        border: 2px solid var(--background);
        cursor: pointer;
      }

      &::-moz-range-thumb {
        width: 20px;
        height: 50px;
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

    .slider-label {
      display: flex;
      justify-content: space-between;
      font-family: var(--special-font-stack);
      font-size: var(--font-size-large);
      color: var(--foreground);
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
