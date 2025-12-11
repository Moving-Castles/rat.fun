<script lang="ts">
  import { gameConfig } from "$lib/modules/state/stores"
  import { playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { getTripMaxValuePerWin, getTripMinRatValueToEnter } from "$lib/modules/state/utils"
  import { CharacterCounter, BigButton, ResizableText } from "$lib/components/Shared"
  import { playerERC20Allowance } from "$lib/modules/erc20Listener/stores"
  import { openAllowanceModal } from "$lib/modules/ui/allowance-modal.svelte"
  import { busy, sendCreateTrip } from "$lib/modules/action-manager/index.svelte"
  import { typeHit } from "$lib/modules/sound"
  import { errorHandler } from "$lib/modules/error-handling"
  import { CharacterLimitError, InputValidationError } from "@ratfun/common/error-handling"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { MIN_TRIP_CREATION_COST, DEFAULT_SUGGESTED_TRIP_CREATION_COST } from "@server/config"
  import { staticContent } from "$lib/modules/content"
  import { isPhone } from "$lib/modules/ui/state.svelte"
  import { TripFolders } from "$lib/components/Trip"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { playerIsWhitelisted } from "$lib/modules/state/stores"
  import { nope } from "$lib/modules/moderation"

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
  let sliderStep = $derived(Number($playerERC20Balance) > 1000 ? 50 : 10)
  let sliderMax = $derived(Math.floor($playerERC20Balance / sliderStep) * sliderStep)

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
  let tripDescriptionIncludesFoulLanguage = $derived(
    nope.some(term => tripDescription.toLowerCase().includes(term))
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
  // - Trip contains offensive terms
  const disabled = $derived(
    invalidTripDescriptionLength ||
      busy.CreateTrip.current !== 0 ||
      !$maxValuePerWin ||
      !$minRatValueToEnter ||
      flooredTripCreationCost < MIN_TRIP_CREATION_COST ||
      $playerERC20Balance < flooredTripCreationCost ||
      !selectedFolderId ||
      tripDescriptionIncludesFoulLanguage
  )

  const placeholder = `Describe the TRIP and what awaits the RAT. Death traps, shopping dungeons and unadulterated gambling are just a few ideas on how to squeeze value out of other RATS. Think beyond silicon.\n\nYou can use TRIPS to generate PSYCHO OBJECTS for your own RAT. But remember: other OPERATORS are watching.`

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
            <div class="instructions">
              <span class="highlight">Trip Category</span>
            </div>
            <TripFolders
              onselect={folderId => {
                selectedFolderId = folderId
                currentStep = "details"
              }}
              folders={availableFolders}
              {foldersCounts}
              showCounts={false}
            ></TripFolders>
          </div>
        {:else}
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

              <div class="folder-select">
                <span class="highlight">Trip Category</span>
                <div>
                  <button
                    onclick={() => {
                      currentStep = "folder"
                    }}
                    class="select-folder-button"
                    >{selectedFolderTitle} <span class="big">×</span></button
                  >
                </div>
              </div>
            </div>

            <!-- TRIP CREATION COST SLIDER -->
            <div class="slider-group">
              <div class="slider-header">
                <label for="trip-creation-cost-slider">
                  <span class="highlight">Trip Creation Cost</span>
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
                  <span class="slider-max">{sliderMax}</span>
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
          rows={$isPhone ? 3 : 6}
          {placeholder}
          oninput={typeHit}
          bind:value={tripDescription}
          bind:this={textareaElement}
        ></textarea>
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
            <span class="slider-min"
              >{Math.min($playerERC20Balance, MIN_TRIP_CREATION_COST)} {CURRENCY_SYMBOL}
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

  .folder-select {
    display: flex;
    flex-flow: column nowrap;
    gap: 8px;
  }

  .instructions {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 10px;
    font-family: var(--typewriter-font-stack);
    font-size: var(--font-size-normal);
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

  .create-trip {
    height: 100%;
    width: 600px;
    max-width: 100%;
    display: flex;
    flex-flow: column nowrap;
    gap: 12px;
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
      font-size: var(--font-size-medium);
      font-family: var(--special-font-stack);

      > :global(.tiles) {
        flex: 1;
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
  }

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
    overflow-y: scroll;

    @media (max-width: 800px) {
      overflow-y: auto;
    }
  }
</style>
