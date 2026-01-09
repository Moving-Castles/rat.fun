<script lang="ts">
  import { gameConfig } from "$lib/modules/state/stores"
  import { playerERC20Allowance } from "$lib/modules/erc20Listener/stores"
  import { openAllowanceModal } from "$lib/modules/ui/allowance-modal.svelte"
  import { busy, sendCreateTrip } from "$lib/modules/action-manager/index.svelte"
  import { errorHandler } from "$lib/modules/error-handling"
  import { CharacterLimitError, InputValidationError } from "@ratfun/common/error-handling"
  import { DEFAULT_SUGGESTED_TRIP_CREATION_COST } from "@server/config"
  import { staticContent } from "$lib/modules/content"
  import { TripFolders } from "$lib/components/Trip"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { playerIsWhitelisted } from "$lib/modules/state/stores"
  import { FEATURES } from "$lib/config/features"
  import { nope } from "$lib/modules/moderation"
  import CreateTripForm from "./CreateTripForm.svelte"
  import CreateRestrictedTripForm from "./CreateRestrictedTripForm.svelte"

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

  // svelte-ignore state_referenced_locally
  let tripDescription: string = $state(savedTripDescription ?? "")
  let textareaElement: HTMLTextAreaElement | null = $state(null)
  // svelte-ignore state_referenced_locally
  let selectedFolderId: string = $state(savedFolderId ?? "")
  // svelte-ignore state_referenced_locally
  let currentStep: "folder" | "details" = $state(savedFolderId ? "details" : "folder")
  let tripCreationCost = $state(DEFAULT_SUGGESTED_TRIP_CREATION_COST)

  // Challenge trip parameters (for restricted folders)
  let fixedMinValueToEnter = $state(100)
  let overrideMaxValuePerWinPercentage = $state(100)

  // Floor the trip creation cost to ensure it's an integer
  let flooredTripCreationCost = $derived(Math.floor(tripCreationCost))

  // Get available folders: all non-restricted, plus restricted if user is whitelisted AND challenge trips are enabled
  let availableFolders = $derived(
    $staticContent.tripFolders.filter(
      folder => !folder.restricted || ($playerIsWhitelisted && FEATURES.ENABLE_CHALLENGE_TRIPS)
    )
  )

  // Check if selected folder is restricted (challenge trip)
  let selectedFolder = $derived(availableFolders.find(f => f._id === selectedFolderId))
  let isRestrictedFolder = $derived(selectedFolder?.restricted ?? false)

  // Calculate folder counts (all non-depleted trips for display)
  let foldersCounts = $derived(
    availableFolders.map(() => 0) // Empty counts since this is for creation, not browsing
  )

  // Get selected folder title for header
  let selectedFolderTitle = $derived(
    availableFolders.find(f => f._id === selectedFolderId)?.title ?? ""
  )

  // Check for foul language
  let tripDescriptionIncludesFoulLanguage = $derived(
    nope.some(term => tripDescription.toLowerCase().includes(term))
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
      if (tripDescriptionIncludesFoulLanguage) {
        throw new InputValidationError(
          "Trip description contains inappropriate language",
          "tripDescription",
          tripDescription
        )
      }
      // Notify parent before sending
      onsubmit?.({ prompt: tripDescription, cost: flooredTripCreationCost })

      // Pass challenge trip parameters if this is a restricted folder
      if (isRestrictedFolder) {
        await sendCreateTrip(
          tripDescription,
          flooredTripCreationCost,
          selectedFolderId,
          true, // isChallengeTrip
          Math.floor(fixedMinValueToEnter),
          Math.floor(overrideMaxValuePerWinPercentage)
        )
      } else {
        await sendCreateTrip(tripDescription, flooredTripCreationCost, selectedFolderId)
      }
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
        {:else if isRestrictedFolder}
          <CreateRestrictedTripForm
            bind:tripDescription
            bind:tripCreationCost
            bind:fixedMinValueToEnter
            bind:overrideMaxValuePerWinPercentage
            bind:textareaElement
            {selectedFolderTitle}
            onFolderSelect={() => {
              currentStep = "folder"
            }}
            onSubmit={onClick}
            {placeholder}
          />
        {:else}
          <CreateTripForm
            bind:tripDescription
            bind:tripCreationCost
            bind:textareaElement
            {selectedFolderTitle}
            onFolderSelect={() => {
              currentStep = "folder"
            }}
            onSubmit={onClick}
            {placeholder}
          />
        {/if}
      </div>
    </div>
  </div>
{:else}
  <div class="create-trip">
    {#if isRestrictedFolder}
      <CreateRestrictedTripForm
        bind:tripDescription
        bind:tripCreationCost
        bind:fixedMinValueToEnter
        bind:overrideMaxValuePerWinPercentage
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
  .instructions {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 10px;
    font-family: var(--typewriter-font-stack);
    font-size: var(--font-size-normal);
  }

  .highlight {
    background: var(--color-grey-mid);
    padding: 5px;
    color: var(--background);
  }

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

    .folder-selection {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-size: var(--font-size-medium);
      font-family: var(--special-font-stack);

      @media (max-width: 800px) {
        overflow-y: auto;
      }

      > :global(.tiles) {
        flex: 1;

        @media (max-width: 800px) {
          flex: 0 1 auto;
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
