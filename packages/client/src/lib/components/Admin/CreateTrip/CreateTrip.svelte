<script lang="ts">
  import { gameConfig } from "$lib/modules/state/stores"
  import { playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { getTripMaxValuePerWin, getTripMinRatValueToEnter } from "$lib/modules/state/utils"
  import { CharacterCounter, BigButton } from "$lib/components/Shared"
  import { playerERC20Allowance } from "$lib/modules/erc20Listener/stores"
  import { openAllowanceModal } from "$lib/modules/ui/allowance-modal.svelte"
  import { busy, sendCreateTrip } from "$lib/modules/action-manager/index.svelte"
  import { typeHit } from "$lib/modules/sound"
  import { errorHandler } from "$lib/modules/error-handling"
  import { CharacterLimitError, InputValidationError } from "$lib/modules/error-handling/errors"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { MIN_TRIP_CREATION_COST, DEFAULT_SUGGESTED_TRIP_CREATION_COST } from "@server/config"
  import { staticContent } from "$lib/modules/content"
  import { isPhone } from "$lib/modules/ui/state.svelte"
  import { TripFolders } from "$lib/components/Trip"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings"
  import { playerIsWhitelisted } from "$lib/modules/state/stores"

  let {
    ondone,
    onsubmit,
    onclose,
    savedTripDescription,
    savedFolderId
  }: {
    ondone: () => void
    onsubmit?: (data: { prompt: string; cost: number }) => void
    onclose?: (currentDescription: string, currentFolderId: string) => void
    savedTripDescription?: string
    savedFolderId?: string
  } = $props()

  let tripDescription: string = $state(savedTripDescription ?? "")
  let textareaElement: HTMLTextAreaElement | null = $state(null)
  let selectedFolderId: string = $state(savedFolderId ?? "")
  let currentStep: "folder" | "details" = $state(savedFolderId ? "details" : "folder")

  // Get available folders: all non-restricted, plus restricted if user is whitelisted
  let availableFolders = $derived(
    $staticContent.tripFolders.filter(folder => !folder.restricted || $playerIsWhitelisted)
  )

  // Calculate folder counts (all non-depleted trips for display)
  let foldersCounts = $derived(
    availableFolders.map(() => 0) // Empty counts since this is for creation, not browsing
  )

  // Get selected folder title for header
  let selectedFolderTitle = $derived(
    availableFolders.find(f => f._id === selectedFolderId)?.title ?? ""
  )

  // Prompt has to be between 1 and MAX_TRIP_PROMPT_LENGTH characters
  let invalidTripDescriptionLength = $derived(
    tripDescription.length < 1 || tripDescription.length > $gameConfig.maxTripPromptLength
  )

  let tripCreationCost = $state(DEFAULT_SUGGESTED_TRIP_CREATION_COST)

  // Floor the trip creation cost to ensure it's an integer
  let flooredTripCreationCost = $derived(Math.floor(tripCreationCost))

  // 10% of trip creation cost
  let minRatValueToEnter = $derived(getTripMinRatValueToEnter(flooredTripCreationCost))
  // Portion of trip creation cost
  let maxValuePerWin = $derived(
    getTripMaxValuePerWin(flooredTripCreationCost, flooredTripCreationCost)
  )

  // Disabled if:
  // - Trip description is invalid
  // - Trip creation is busy
  // - Max value per win is not set
  // - Min rat value to enter is not set
  // - Trip creation cost is less than minimum
  // - Player has insufficient balance
  // - No folder is selected
  const disabled = $derived(
    invalidTripDescriptionLength ||
      busy.CreateTrip.current !== 0 ||
      !$maxValuePerWin ||
      !$minRatValueToEnter ||
      flooredTripCreationCost < MIN_TRIP_CREATION_COST ||
      $playerERC20Balance < flooredTripCreationCost ||
      !selectedFolderId
  )

  const placeholder = `Outline any expected subjective experiences or outcomes the rat
will have. Our hyper specialised Biological Intelligence Operating System will synthesize a trip based on your description.

Trips induce remote viewing trances in susceptible vermin.

During a trance rats might materialise psycho objects, transferring some value from your trip to their flesh. Shall a trip be too heroic and kill the rat you will collect its total value.`

  async function onClick() {
    // Check allowance before proceeding
    if ($playerERC20Allowance < flooredTripCreationCost) {
      openAllowanceModal(UI_STRINGS.insufficientAllowance)
      return
    }

    try {
      // Validate trip description before sending
      if (!tripDescription || tripDescription.trim() === "") {
        throw new InputValidationError(
          "Trip description cannot be empty",
          "tripDescription",
          tripDescription
        )
      }
      if (tripDescription.length > $gameConfig.maxTripPromptLength) {
        throw new CharacterLimitError(
          tripDescription.length,
          $gameConfig.maxTripPromptLength,
          "trip description"
        )
      }
      if (!selectedFolderId) {
        throw new InputValidationError(
          "Please select a category for your trip",
          "selectedFolderId",
          selectedFolderId
        )
      }
      // Notify parent before sending
      onsubmit?.({ prompt: tripDescription, cost: flooredTripCreationCost })
      await sendCreateTrip(tripDescription, flooredTripCreationCost, selectedFolderId)
      ondone()
    } catch (error) {
      errorHandler(error)
      tripDescription = ""
      selectedFolderId = ""
    }
    tripDescription = ""
    selectedFolderId = ""
  }

  $effect(() => {
    // Focus the textarea when the component mounts
    if (textareaElement) {
      textareaElement.focus()
    }
  })

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onclose?.(tripDescription, selectedFolderId)
    }
  }
</script>

<svelte:window onkeydown={onKeyDown} />

{#if busy.CreateTrip.current === 0}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="modal-backdrop"
    onclick={e => {
      if (e.target === e.currentTarget) {
        onclose?.(tripDescription, selectedFolderId)
      }
    }}
  >
    <div class="modal-content">
      <div class="create-trip">
        {#if currentStep === "folder"}
          <!-- STEP 1: FOLDER SELECTION -->
          <div class="folder-selection">
            <div class="form-group">
              <div>
                <span class="highlight">{UI_STRINGS.selectFolder}</span>
              </div>
            </div>
            <TripFolders
              onselect={folderId => {
                selectedFolderId = folderId
                currentStep = "details"
              }}
              folders={availableFolders}
              {foldersCounts}
              showCounts={false}
            />
          </div>
        {:else}
          <!-- STEP 2: TRIP DETAILS -->
          <div class="trip-header">
            <div class="header-text">
              {UI_STRINGS.creatingTripIn}: <span class="folder-name">{selectedFolderTitle}</span>
            </div>
            <button
              class="back-link"
              onclick={() => {
                currentStep = "folder"
              }}
            >
              {UI_STRINGS.back}
            </button>
          </div>
          <div class="controls">
            <!-- TRIP DESCRIPTION -->
            <div class="form-group">
              <label for="trip-description">
                <span class="highlight">Trip Description</span>
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
            </div>

            <!-- TRIP CREATION COST SLIDER -->
            <div class="slider-group">
              <label for="trip-creation-cost-slider">
                <span class="highlight">TRIP CREATION COST</span>
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
              </label>
              <div class="slider-container">
                <input
                  type="range"
                  id="trip-creation-cost-slider"
                  class="cost-slider"
                  step={Math.floor($playerERC20Balance / 40)}
                  min={Math.min($playerERC20Balance, MIN_TRIP_CREATION_COST)}
                  max={$playerERC20Balance}
                  oninput={e => {
                    // playSample(Number(e.target.value) / Number($playerERC20Balance))
                  }}
                  bind:value={tripCreationCost}
                />
                <div class="slider-labels">
                  <span class="slider-min">
                    {Math.min($playerERC20Balance, MIN_TRIP_CREATION_COST)}
                    {CURRENCY_SYMBOL}
                  </span>
                  <span class="slider-max">{$playerERC20Balance}{CURRENCY_SYMBOL}</span>
                </div>
              </div>
            </div>

            <!-- CALCULATED VALUES -->
            <div class="calculated-values">
              <div class="value-box">
                <div class="value-label">{UI_STRINGS.minRatValueToTrip.toUpperCase()}</div>
                <div class="value-amount">{$minRatValueToEnter} {CURRENCY_SYMBOL}</div>
              </div>
              <div class="value-box">
                <div class="value-label">{UI_STRINGS.maxValuePerWin.toUpperCase()}</div>
                <div class="value-amount">{$maxValuePerWin} {CURRENCY_SYMBOL}</div>
              </div>
            </div>
          </div>

          <!-- ACTIONS -->
          <div class="actions">
            <BigButton
              text="Create trip"
              type="create_trip"
              cost={flooredTripCreationCost}
              {disabled}
              onclick={onClick}
            />
          </div>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <div class="create-trip">
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
          rows={$isPhone ? 3 : 10}
          {placeholder}
          oninput={typeHit}
          bind:value={tripDescription}
          bind:this={textareaElement}
        ></textarea>
      </div>

      <!-- TRIP CREATION COST SLIDER -->
      <div class="slider-group">
        <label for="trip-creation-cost-slider">
          <span class="highlight">{UI_STRINGS.tripCreationCostLabel}</span>
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
        </label>
        <div class="slider-container">
          <input
            type="range"
            id="trip-creation-cost-slider"
            class="cost-slider"
            step={Math.floor($playerERC20Balance / 40)}
            min={Math.min($playerERC20Balance, MIN_TRIP_CREATION_COST)}
            max={$playerERC20Balance}
            bind:value={tripCreationCost}
          />
          <div class="slider-labels">
            <span class="slider-min"
              >{Math.min($playerERC20Balance, MIN_TRIP_CREATION_COST)} {CURRENCY_SYMBOL}
            </span>

            <span class="slider-max">{$playerERC20Balance} {CURRENCY_SYMBOL}</span>
          </div>
        </div>
      </div>

      <!-- CALCULATED VALUES -->
      <div class="calculated-values">
        <div class="value-box">
          <div class="value-label">MIN RAT VALUE TO TRIP</div>
          <div class="value-amount">{$minRatValueToEnter} {CURRENCY_SYMBOL}</div>
        </div>
        <div class="value-box">
          <div class="value-label">MAX VALUE PER WIN</div>
          <div class="value-amount">{$maxValuePerWin} {CURRENCY_SYMBOL}</div>
        </div>
      </div>
    </div>

    <!-- ACTIONS -->
    <div class="actions">
      <BigButton
        text="Create trip"
        type="create_trip"
        cost={flooredTripCreationCost}
        {disabled}
        onclick={onClick}
      />
    </div>
  </div>
{/if}

<style lang="scss">
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    /* display: none; <- Crashes Chrome on hover */
    -webkit-appearance: none;
    margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
  }

  input[type="number"] {
    appearance: textfield;
    -moz-appearance: textfield; /* Firefox */
  }

  .modal-content {
    height: 700px;
    max-height: 90dvh;

    @media (max-width: 800px) {
      height: 100dvh;
      max-height: 80dvh;
      width: 100dvw;
    }
  }

  .create-trip {
    height: 100%;
    width: 600px;
    max-width: 100%;
    display: flex;
    flex-flow: column nowrap;
    background-image: url("/images/texture-3.png");
    background-size: 200px;
    justify-content: space-between;
    border: 1px solid var(--color-grey-mid);
    padding: 10px;

    @media (max-width: 800px) {
      width: 100dvw;
      border: none;
    }

    .folder-selection {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      > :global(.tiles) {
        flex: 1;
      }
    }

    .trip-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid var(--color-grey-mid);
      margin-bottom: 8px;
      font-family: var(--typewriter-font-stack);
      font-size: var(--font-size-normal);

      .header-text {
        .folder-name {
          font-weight: bold;
        }
      }

      .back-link {
        background: none;
        border: none;
        color: var(--foreground);
        text-decoration: underline;
        cursor: pointer;
        font-family: var(--typewriter-font-stack);
        font-size: var(--font-size-normal);
        padding: 0;

        &:hover {
          opacity: 0.7;
        }
      }
    }

    .controls {
      display: flex;
      justify-self: start;
      gap: 8px;
      flex-flow: column nowrap;
    }

    .form-group {
      display: block;
      width: 100%;

      label {
        display: block;
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .highlight {
          background: var(--color-alert);
          padding: 5px;
          color: var(--background);
          font-weight: normal;
        }
      }

      textarea {
        width: 100%;
        padding: 5px;
        border: none;
        background: var(--foreground);
        font-family: var(--typewriter-font-stack);
        font-size: var(--font-size-normal);
        border-radius: 0;
        resize: none;
        outline-color: var(--color-alert);
        outline-width: 1px;
      }
    }

    .slider-group {
      display: block;
      width: 100%;

      .cost-display {
        background: var(--foreground);
        padding: 5px;
        color: var(--background);
        font-weight: normal;
        font-family: var(--typewriter-font-stack);
        border: none;
        width: 60px;
        text-align: right;
        border: none;
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

      .cost-slider {
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

    .calculated-values {
      display: flex;
      gap: 0;
      margin-bottom: 1rem;

      .value-box {
        flex: 1;
        padding: 10px;
        border: 1px solid var(--color-border);
        background: var(--background);

        .value-label {
          font-family: var(--typewriter-font-stack);
          font-size: var(--font-size-small);
          color: var(--color-grey-light);
          margin-bottom: 5px;
        }

        .value-amount {
          font-family: var(--typewriter-font-stack);
          font-size: var(--font-size-normal);
          color: var(--foreground);
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
  }

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
    overflow-y: scroll;

    @media (max-width: 800px) {
      overflow-y: auto;
    }
  }
</style>
