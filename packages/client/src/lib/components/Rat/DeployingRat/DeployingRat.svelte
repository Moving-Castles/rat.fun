<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { fade } from "svelte/transition"
  import { rat, playerHasLiveRat } from "$lib/modules/state/stores"
  import { waitForPropertyChangeFrom } from "$lib/modules/state/utils"
  import { sendCreateRat } from "$lib/modules/action-manager/index.svelte"
  import { generateRatName, lastNameFragments, firstNameFragments } from "./ratNameGenerator"
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { PropertyChangeTimeoutError, RatError } from "$lib/modules/error-handling/errors"
  import { errorHandler } from "$lib/modules/error-handling"
  import { getRandomNumber, getRandomElement } from "$lib/modules/utils"
  import { erc20BalanceListenerActive } from "$lib/modules/erc20Listener/stores"
  import { refetchBalance } from "$lib/modules/erc20Listener"
  import { playSound } from "$lib/modules/sound"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  import { LockButton, SmallSpinner } from "$lib/components/Shared"

  // Pre-generate the final name
  const initialName = generateRatName()
  let { firstName, lastName, ratNumber } = $state(initialName)
  let finalName = $derived(`${firstName}_${lastName}_${ratNumber}`)
  let oldName = $state("")

  let deploymentDone = $state(false)
  let waitingForDeployment = $state(false)

  let currentSlot = $state(0) // 0, 1, 2 for the three slots
  let slot0Stopped = $state(false)
  let slot1Stopped = $state(false)
  let slot2Stopped = $state(false)
  let slotMachineDone = $state(false)

  // Slot machine state
  let firstNameDisplay = $state("")
  let lastNameDisplay = $state("")
  let numberDisplay = $state("")

  // Track previous selections to avoid consecutive duplicates
  let previousFirstName = $state("")
  let previousLastName = $state("")
  let previousNumber = $state("")

  let firstNameInterval: ReturnType<typeof setInterval> | null = null
  let lastNameInterval: ReturnType<typeof setInterval> | null = null
  let ratNumberInterval: ReturnType<typeof setInterval> | null = null
  let slotMachineTimeout: ReturnType<typeof setTimeout> | null = null
  let checkInterval: ReturnType<typeof setInterval> | null = null

  // Helper function to get random element that's different from previous
  function getRandomElementAvoidingPrevious<T>(array: T[], previous: T): T {
    if (array.length === 1) return array[0]

    const filteredArray = array.filter(item => item !== previous)
    return getRandomElement(filteredArray)
  }

  // Helper function to get random number that's different from previous
  function getRandomNumberAvoidingPrevious(min: number, max: number, previous: string): string {
    let newNumber: number
    do {
      newNumber = getRandomNumber(min, max)
    } while (newNumber.toString() === previous)
    return newNumber.toString()
  }

  function startSlotMachine() {
    // Start flickering for all slots
    firstNameInterval = setInterval(() => {
      if (!slot0Stopped) {
        const newFirstName = getRandomElementAvoidingPrevious(firstNameFragments, previousFirstName)
        firstNameDisplay = newFirstName
        previousFirstName = newFirstName
      }
    }, 100)

    lastNameInterval = setInterval(() => {
      if (!slot1Stopped) {
        const newLastName = getRandomElementAvoidingPrevious(lastNameFragments, previousLastName)
        lastNameDisplay = newLastName
        previousLastName = newLastName
      }
    }, 100)

    ratNumberInterval = setInterval(() => {
      if (!slot2Stopped) {
        const newNumber = getRandomNumberAvoidingPrevious(100, 999, previousNumber)
        numberDisplay = newNumber
        previousNumber = newNumber
        playSound({ category: "ratfunUI", id: "wheelTick" })
      }
    }, 100)
  }

  function stopSlot(slotIndex: number) {
    if (currentSlot !== slotIndex) return

    // Set the appropriate slot as stopped
    if (slotIndex === 0) {
      slot0Stopped = true
      clearInterval(firstNameInterval!)
      firstNameDisplay = firstName
    } else if (slotIndex === 1) {
      slot1Stopped = true
      clearInterval(lastNameInterval!)
      lastNameDisplay = lastName
    } else if (slotIndex === 2) {
      slot2Stopped = true
      clearInterval(ratNumberInterval!)
      numberDisplay = ratNumber.toString()
    }

    // Move to next slot
    currentSlot++

    // If all slots are stopped, check if we can transition
    if (currentSlot >= 3) {
      slotMachineDone = true

      // Wait a moment to show the final name, then check if we can transition
      slotMachineTimeout = setTimeout(() => {
        checkTransition()
      }, 1000)
    }
  }

  async function startDeployment() {
    // Check if the rat was already made, and we are just waiting for the user to click buttons
    if ($playerHasLiveRat) {
      const [first, last, num] = $rat.name.split("_")
      firstName = first
      lastName = last
      ratNumber = Number(num)
      deploymentDone = true
      return // return before calling create rat
    }

    // Store the old name for use in waitForPropertyChangeFrom
    oldName = $rat?.name ?? ""

    // Send transaction
    await sendCreateRat(finalName)

    try {
      // Make sure new rat is available to avoid flash of old info
      // await waitForPropertyChange(player, "currentRat", oldRatId, 10000)
      deploymentDone = true
    } catch (error) {
      if (error instanceof PropertyChangeTimeoutError || error instanceof RatError) {
        errorHandler(error)
      }
      console.error("Timeout waiting for rat creation:", error)
    }
  }

  function checkTransition() {
    if (deploymentDone) {
      done()
    } else {
      waitingForDeployment = true
      // User finished slot machine before deployment, wait for deployment
      checkInterval = setInterval(() => {
        if (deploymentDone) {
          clearInterval(checkInterval!)
          checkInterval = null
          done()
        }
      }, 100)
    }
  }

  async function done() {
    // Update balance after deployment
    await refetchBalance()

    // Resume erc20 balance listener
    erc20BalanceListenerActive.set(true)

    playSound({ category: "ratfunUI", id: "ratHello" })

    // Await rat name to have changed FROM oldName
    await waitForPropertyChangeFrom(rat, "name", oldName, 10000)

    // Transition to has rat state
    ratState.state.transitionTo(RAT_BOX_STATE.HAS_RAT)
  }

  onMount(async () => {
    // Pause erc20 balance listener so we can control the update
    erc20BalanceListenerActive.set(false)
    startSlotMachine()
    await startDeployment()
  })

  onDestroy(() => {
    // Clean up all timeouts and intervals when component is unmounted
    if (firstNameInterval) {
      clearInterval(firstNameInterval)
      firstNameInterval = null
    }
    if (lastNameInterval) {
      clearInterval(lastNameInterval)
      lastNameInterval = null
    }
    if (ratNumberInterval) {
      clearInterval(ratNumberInterval)
      ratNumberInterval = null
    }
    if (slotMachineTimeout) {
      clearTimeout(slotMachineTimeout)
      slotMachineTimeout = null
    }
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
  })
</script>

<div class="deploying-rat">
  <div class="slot-container">
    <div class="slot-box">
      <div class="slot-display" class:locked={slot0Stopped}>{firstNameDisplay}</div>
      <LockButton
        hidden={slotMachineDone}
        disabled={currentSlot !== 0}
        onclick={() => stopSlot(0)}
        text={UI_STRINGS.stop}
      />
    </div>

    <div class="slot-box">
      <div class="slot-display" class:locked={slot1Stopped}>{lastNameDisplay}</div>
      <LockButton
        hidden={slotMachineDone}
        disabled={currentSlot !== 1}
        onclick={() => stopSlot(1)}
        text={UI_STRINGS.stop}
      />
    </div>

    <div class="slot-box">
      <div class="slot-display" class:locked={slot2Stopped}>{numberDisplay}</div>
      <LockButton
        hidden={slotMachineDone}
        disabled={currentSlot !== 2}
        onclick={() => stopSlot(2)}
        text={UI_STRINGS.stop}
      />
    </div>
  </div>

  {#if waitingForDeployment}
    <div class="getting-rat-message" in:fade={{ duration: 200 }}>
      {UI_STRINGS.gettingRat}
      <SmallSpinner soundOn />
    </div>
  {/if}
</div>

<style lang="scss">
  .deploying-rat {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px;
    width: 100%;
    background-image: url("/images/texture-2.png");

    .slot-container {
      display: flex;
      width: 100%;

      .slot-box {
        width: 33.333%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        gap: 2rem;
        .slot-display {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          background: white;
          color: black;
          width: 100%;
          height: 100px;
          flex-shrink: 0;
          // margin-bottom: 2em;

          &.locked {
            background: black;
            color: white;
          }
        }
      }
    }

    .getting-rat-message {
      position: absolute;
      bottom: 20%;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px;
      font-size: var(--font-size-normal);
      color: var(--background);
      background: white;
    }
  }
</style>
