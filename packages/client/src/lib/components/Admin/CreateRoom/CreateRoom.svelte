<script lang="ts">
  import { gameConfig } from "$lib/modules/state/stores"
  import { playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { getRoomMaxValuePerWin, getRoomMinRatValueToEnter } from "$lib/modules/state/utils"
  import { CharacterCounter, BigButton } from "$lib/components/Shared"
  import { sendCreateRoom } from "$lib/modules/action-manager/index.svelte"
  import { typeHit } from "$lib/modules/sound"
  import { errorHandler } from "$lib/modules/error-handling"
  import { CharacterLimitError, InputValidationError } from "$lib/modules/error-handling/errors"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { MIN_ROOM_CREATION_COST } from "@server/config"
  import { collapsed } from "$lib/modules/ui/state.svelte"

  let {
    ondone,
    onsubmit
  }: {
    ondone: () => void
    onsubmit?: (data: { prompt: string; cost: number }) => void
  } = $props()

  let roomDescription: string = $state("")
  let busy: boolean = $state(false)

  // let mixer = getMixerState()

  // Prompt has to be between 1 and MAX_ROOM_PROMPT_LENGTH characters
  let invalidRoomDescriptionLength = $derived(
    roomDescription.length < 1 || roomDescription.length > $gameConfig.maxRoomPromptLength
  )

  let roomCreationCost = $state(200)

  // Floor the room creation cost to ensure it's an integer
  let flooredRoomCreationCost = $derived(Math.floor(roomCreationCost))

  // 10% of room creation cost
  let minRatValueToEnter = $derived(getRoomMinRatValueToEnter(flooredRoomCreationCost))
  // Portion of room creation cost
  let maxValuePerWin = $derived(
    getRoomMaxValuePerWin(flooredRoomCreationCost, flooredRoomCreationCost)
  )

  // Disabled if:
  // - Room description is invalid
  // - Room creation is busy
  // - Max value per win is not set
  // - Min rat value to enter is not set
  // - Room creation cost is less than minimum
  // - Player has insufficient balance
  const disabled = $derived(
    invalidRoomDescriptionLength ||
      busy ||
      !$maxValuePerWin ||
      !$minRatValueToEnter ||
      flooredRoomCreationCost < MIN_ROOM_CREATION_COST ||
      $playerERC20Balance < flooredRoomCreationCost
  )

  const placeholder =
    "You're creating a trip that can modify items, and tokens of rats that enter. Your trip balance decreases whenever a rat gains something, and increases when your trip takes something. You can withdraw remaining balance from your trip."

  async function onClick() {
    busy = true
    try {
      // Validate room description before sending
      if (!roomDescription || roomDescription.trim() === "") {
        throw new InputValidationError(
          "Trip description cannot be empty",
          "roomDescription",
          roomDescription
        )
      }
      if (roomDescription.length > $gameConfig.maxRoomPromptLength) {
        throw new CharacterLimitError(
          roomDescription.length,
          $gameConfig.maxRoomPromptLength,
          "room description"
        )
      }
      // Notify parent before sending
      onsubmit?.({ prompt: roomDescription, cost: flooredRoomCreationCost })
      await sendCreateRoom(roomDescription, flooredRoomCreationCost)
      ondone()
    } catch (error) {
      errorHandler(error)
      roomDescription = ""
    }
    roomDescription = ""
  }
</script>

{#if !busy}
  <div class="create-room" class:collapsed={$collapsed}>
    <div class="controls">
      <!-- ROOM DESCRIPTION -->
      <div class="form-group">
        <label for="room-description">
          <span class="highlight">Trip Description</span>
          <CharacterCounter
            currentLength={roomDescription.length}
            maxLength={$gameConfig.maxRoomPromptLength}
          />
        </label>
        <textarea
          disabled={busy}
          id="room-description"
          rows={$collapsed ? 12 : 6}
          {placeholder}
          oninput={typeHit}
          bind:value={roomDescription}
        ></textarea>
      </div>

      <!-- ROOM CREATION COST SLIDER -->
      <div class="slider-group">
        <label for="room-creation-cost-slider">
          <span class="highlight">TRIP CREATION COST</span>
          <input
            class="cost-display"
            onblur={e => {
              const value = Number(e.target.value)
              if (value < MIN_ROOM_CREATION_COST || value > $playerERC20Balance) {
                roomCreationCost = Math.min(
                  $playerERC20Balance,
                  Math.max(MIN_ROOM_CREATION_COST, value)
                )
              }
            }}
            bind:value={roomCreationCost}
            type="number"
          />
        </label>
        <div class="slider-container">
          <input
            type="range"
            id="room-creation-cost-slider"
            class="cost-slider"
            step={Math.floor($playerERC20Balance / 40)}
            min={Math.min($playerERC20Balance, MIN_ROOM_CREATION_COST)}
            max={$playerERC20Balance}
            oninput={e => {
              // playSample(Number(e.target.value) / Number($playerERC20Balance))
            }}
            bind:value={roomCreationCost}
          />
          <div class="slider-labels">
            <span class="slider-min"
              >{CURRENCY_SYMBOL}{Math.min($playerERC20Balance, MIN_ROOM_CREATION_COST)}</span
            >
            <span class="slider-max">{CURRENCY_SYMBOL}{$playerERC20Balance}</span>
          </div>
        </div>
      </div>

      <!-- CALCULATED VALUES -->
      <div class="calculated-values">
        <div class="value-box">
          <div class="value-label">
            MIN RAT VALUE TO TRIP {#if import.meta.env.DEV}BALLS{/if}
          </div>
          <div class="value-amount">{CURRENCY_SYMBOL}{$minRatValueToEnter}</div>
        </div>
        <div class="value-box">
          <div class="value-label">MAX VALUE PER WIN</div>
          <div class="value-amount">{CURRENCY_SYMBOL}{$maxValuePerWin}</div>
        </div>
      </div>
    </div>

    <!-- ACTIONS -->
    <div class="actions">
      <BigButton text="Create trip" cost={flooredRoomCreationCost} {disabled} onclick={onClick} />
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
    -moz-appearance: textfield; /* Firefox */
  }

  .create-room {
    height: 100%;
    width: 600px;
    display: flex;
    flex-flow: column nowrap;
    background-image: url("/images/texture-3.png");
    background-size: 200px;
    justify-content: space-between;

    .controls {
      display: flex;
      justify-self: start;
      gap: 8px;
      flex-flow: column nowrap;
    }

    .form-group {
      padding: 1rem;
      display: block;
      margin-bottom: 15px;
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
      padding-left: 1rem;
      padding-right: 1rem;
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
      padding-left: 1rem;
      padding-right: 1rem;
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
          font-weight: bold;
        }
      }
    }

    .actions {
      display: flex;
      flex-flow: column nowrap;
      gap: 12px;
      overflow: hidden;
      height: 80px;
    }
  }
</style>
