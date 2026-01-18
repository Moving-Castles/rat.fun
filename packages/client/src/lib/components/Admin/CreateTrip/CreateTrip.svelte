<script lang="ts">
  import { gameConfig, challengeInfo } from "$lib/modules/state/stores"
  import { playerERC20Allowance } from "$lib/modules/erc20Listener/stores"
  import { openAllowanceModal } from "$lib/modules/ui/allowance-modal.svelte"
  import { busy, sendCreateTrip } from "$lib/modules/action-manager/index.svelte"
  import { errorHandler } from "$lib/modules/error-handling"
  import { CharacterLimitError, InputValidationError } from "@ratfun/common/error-handling"
  import { DEFAULT_SUGGESTED_TRIP_CREATION_COST } from "@server/config"
  import { staticContent } from "$lib/modules/content"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { FEATURES } from "$lib/config/features"
  import { nope } from "$lib/modules/moderation"
  import { playSound } from "$lib/modules/sound"
  import { formatCountdown } from "@ratfun/shared-utils"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import CreateTripForm from "./CreateTripForm.svelte"
  import CreateRestrictedTripForm from "./CreateRestrictedTripForm.svelte"

  let {
    ondone,
    onsubmit,
    onclose,
    savedTripDescription
  }: {
    ondone: () => void
    onsubmit?: (data: { prompt: string; cost: number }) => void
    onclose?: (currentDescription: string) => void
    savedTripDescription?: string
  } = $props()

  // Trip type selection: "challenge" | "regular" | null
  let tripType = $state<"challenge" | "regular" | null>(null)

  // svelte-ignore state_referenced_locally
  let tripDescription: string = $state(savedTripDescription ?? "")
  let textareaElement: HTMLTextAreaElement | null = $state(null)
  let tripCreationCost = $state(DEFAULT_SUGGESTED_TRIP_CREATION_COST)

  // Floor the trip creation cost to ensure it's an integer
  let flooredTripCreationCost = $derived(Math.floor(tripCreationCost))

  // Get default folder IDs (use first available folder for each type)
  let regularFolderId = $derived($staticContent.tripFolders.find(f => !f.restricted)?._id ?? "")
  let challengeFolderId = $derived($staticContent.tripFolders.find(f => f.restricted)?._id ?? "")

  // Check for foul language
  let tripDescriptionIncludesFoulLanguage = $derived(
    nope.some(term => tripDescription.toLowerCase().includes(term))
  )

  // Challenge availability
  let canCreateChallenge = $derived($challengeInfo.canCreateNewChallenge)
  let challengeExpiryText = $derived(
    $challengeInfo.isActive ? formatCountdown($challengeInfo.timeRemainingMs) : null
  )

  const placeholder = `Describe the TRIP and what awaits the RAT. Death traps, shopping dungeons and unadulterated gambling are just a few ideas on how to squeeze value out of other RATS. Think beyond silicon.\n\nYou can use TRIPS to generate PSYCHO OBJECTS for your own RAT. But remember: other OPERATORS are watching.`

  const CHALLENGE_MIN_CREATION_COST = 5000

  const selectTripType = (type: "challenge" | "regular") => {
    playSound({ category: "ratfunUI", id: "click" })
    tripType = type
    // Set appropriate default cost based on trip type
    if (type === "challenge") {
      tripCreationCost = Math.max(CHALLENGE_MIN_CREATION_COST, tripCreationCost)
    }
  }

  async function onClick() {
    const folderId = tripType === "challenge" ? challengeFolderId : regularFolderId

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
      if (tripDescriptionIncludesFoulLanguage) {
        throw new InputValidationError(
          "Trip description contains inappropriate language",
          "tripDescription",
          tripDescription
        )
      }
      // Notify parent before sending
      onsubmit?.({ prompt: tripDescription, cost: flooredTripCreationCost })

      // Pass challenge trip parameters if this is a challenge
      if (tripType === "challenge") {
        await sendCreateTrip(
          tripDescription,
          flooredTripCreationCost,
          folderId,
          true, // isChallengeTrip
          100, // Fixed min value to enter
          100 // Fixed max win percentage
        )
      } else {
        await sendCreateTrip(tripDescription, flooredTripCreationCost, folderId)
      }
      ondone()
    } catch (error) {
      errorHandler(error)
      tripDescription = ""
    }
    tripDescription = ""
  }

  $effect(() => {
    // Focus the textarea when the component mounts
    if (textareaElement) {
      textareaElement.focus()
    }
  })

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onclose?.(tripDescription)
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
        onclose?.(tripDescription)
      }
    }}
  >
    <div class="modal-content">
      <div class="create-trip">
        {#if tripType === null}
          <!-- STEP 1: TYPE SELECTION -->
          <div class="type-selection">
            <!-- <div class="instructions">
              <span class="highlight">Create</span>
            </div> -->
            <div class="type-buttons">
              <!-- CHALLENGE BUTTON -->
              <button
                class="type-button challenge"
                class:disabled={!canCreateChallenge || !FEATURES.ENABLE_CHALLENGE_TRIPS}
                onclick={() =>
                  canCreateChallenge &&
                  FEATURES.ENABLE_CHALLENGE_TRIPS &&
                  selectTripType("challenge")}
              >
                <div class="type-title">CHALLENGE</div>
                {#if !canCreateChallenge && FEATURES.ENABLE_CHALLENGE_TRIPS}
                  <div class="unavailable-notice">
                    Active challenge expires in {challengeExpiryText}
                  </div>
                {/if}
                {#if !FEATURES.ENABLE_CHALLENGE_TRIPS}
                  <div class="unavailable-notice">Challenges coming soon</div>
                {/if}
              </button>

              <!-- REGULAR TRIP BUTTON -->
              <button class="type-button regular" onclick={() => selectTripType("regular")}>
                <div class="type-title">TRIP</div>
              </button>
            </div>
          </div>
        {:else if tripType === "challenge"}
          <CreateRestrictedTripForm
            bind:tripDescription
            bind:tripCreationCost
            bind:textareaElement
            onSubmit={onClick}
            {placeholder}
          />
        {:else}
          <CreateTripForm
            bind:tripDescription
            bind:tripCreationCost
            bind:textareaElement
            onSubmit={onClick}
            {placeholder}
          />
        {/if}
      </div>
    </div>
  </div>
{:else}
  <div class="create-trip">
    {#if tripType === "challenge"}
      <CreateRestrictedTripForm
        bind:tripDescription
        bind:tripCreationCost
        bind:textareaElement
        onSubmit={onClick}
        {placeholder}
      />
    {:else}
      <CreateTripForm
        bind:tripDescription
        bind:tripCreationCost
        bind:textareaElement
        onSubmit={onClick}
        {placeholder}
      />
    {/if}
  </div>
{/if}

<style lang="scss">
  .modal-content {
    height: 700px;
    max-height: 90dvh;

    @media (max-width: 800px) {
      height: auto;
      max-height: 90dvh;
      width: 100dvw;
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
      height: auto;
      min-height: 100%;
    }

    .type-selection {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-size: var(--font-size-medium);
      font-family: var(--special-font-stack);

      .type-buttons {
        display: flex;
        flex-flow: column nowrap;
        gap: 4px;
        flex: 1;

        @media (max-width: 800px) {
          grid-template-columns: 1fr;
          gap: 12px;
        }
      }

      .type-button {
        display: flex;
        height: 50%;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 16px;
        padding: 24px;
        background: var(--background);
        cursor: pointer;
        transition: all 0.15s ease;
        border: none;
        border-style: outset;
        border-width: 4px;
        border-color: var(--background-light-transparent);

        &:active:not(.disabled) {
          transform: scale(0.95);
        }

        &.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        cursor: pointer;

        &.challenge {
          background-color: var(--color-restricted-trip-folder);
          border: none;
          border-style: outset;
          border-width: 4px;
          border-color: var(--background-light-transparent);

          &:hover:not(.disabled) {
            background-color: var(--color-inventory-item-reverse-side);
          }

          .type-title {
            color: var(--background);
          }

          .unavailable-notice {
            font-family: var(--typewriter-font-stack);
            font-size: var(--font-size-small);
            color: var(--background);
            opacity: 0.9;
            text-align: center;
            padding: 8px;
            background: var(--background-semi-transparent);
          }
        }

        &.regular {
          position: relative;
          // font-family: var(--special-font-stack);
          // font-size: var(--font-size-medium);

          border-style: outset;
          border-color: var(--background-semi-transparent);
          // color: var(--foreground);

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          background: var(--color-grey-light);

          &:hover {
            background: var(--color-grey-lighter);
          }

          &::before {
            content: "";
            position: absolute;
            inset: 0;
            background-image: url("/images/spiral4.png");
            background-repeat: no-repeat;
            background-size: 200% 200%;
            background-position: center;
            opacity: 0.2;
            z-index: 0;
          }
        }

        .type-title {
          font-family: var(--special-font-stack);
          font-size: var(--font-size-super-large);
        }
      }
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
      align-items: flex-start;
    }
  }

  .modal-content {
    position: relative;
    z-index: 1;
    overflow-x: hidden;
    overflow-y: scroll;

    @media (max-width: 800px) {
      overflow-y: auto;
      max-height: 100dvh;
    }
  }
</style>
