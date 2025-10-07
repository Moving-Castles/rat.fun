<script lang="ts">
  import { onMount } from "svelte"
  import { player } from "$lib/modules/state/stores"
  import { waitForPropertyChange } from "$lib/modules/state/utils"
  import { sendCreateRat } from "$lib/modules/action-manager/index.svelte"
  import { generateRatName, lastNameFragments, firstNameFragments } from "./ratNameGenerator"
  import { sendDeployRatMessage } from "$lib/modules/off-chain-sync"
  import { transitionTo, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { PropertyChangeTimeoutError, RatError } from "$lib/modules/error-handling/errors"
  import { errorHandler } from "$lib/modules/error-handling"
  import { getRandomNumber, getRandomElement } from "$lib/modules/utils"
  import { erc20BalanceListenerActive } from "$lib/modules/erc20Listener/stores"
  import { refetchBalance } from "$lib/modules/erc20Listener"
  import { playSound } from "$lib/modules/sound"

  import { SmallButton } from "$lib/components/Shared"

  // Pre-generate the final name
  const { firstName, lastName, number } = generateRatName()
  const finalName = `${firstName}_${lastName}_${number}`

  let deploymentDone = $state(false)
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
  let numberInterval: ReturnType<typeof setInterval> | null = null

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

    numberInterval = setInterval(() => {
      if (!slot2Stopped) {
        const newNumber = getRandomNumberAvoidingPrevious(100, 999, previousNumber)
        numberDisplay = newNumber
        previousNumber = newNumber
        playSound("ratfunUI", "tick")
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
      clearInterval(numberInterval!)
      numberDisplay = number.toString()
    }

    // Move to next slot
    currentSlot++

    // If all slots are stopped, check if we can transition
    if (currentSlot >= 3) {
      slotMachineDone = true

      // Wait a moment to show the final name, then check if we can transition
      setTimeout(() => {
        checkTransition()
      }, 1000)
    }
  }

  async function startDeployment() {
    const oldRatId = $player?.currentRat ?? ""
    await sendCreateRat(finalName)

    try {
      // Make sure new rat is available to avoid flash of old info
      await waitForPropertyChange(player, "currentRat", oldRatId, 10000)
      sendDeployRatMessage()
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
      // User finished slot machine before deployment, wait for deployment
      const checkInterval = setInterval(() => {
        if (deploymentDone) {
          clearInterval(checkInterval)
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
    playSound("ratfunUI", "ratHello")
    // Transition to has rat state
    transitionTo(RAT_BOX_STATE.HAS_RAT)
  }

  onMount(async () => {
    // Pause erc20 balance listener so we can control the update
    erc20BalanceListenerActive.set(false)
    startSlotMachine()
    await startDeployment()
  })
</script>

<div class="deploying-rat">
  <div class="slot-container">
    <div class="slot-box">
      <div class="slot-display" class:locked={slot0Stopped}>{firstNameDisplay}</div>
      {#if !slotMachineDone}
        <SmallButton disabled={currentSlot !== 0} onclick={() => stopSlot(0)} text="Stop" />
      {/if}
    </div>

    <div class="slot-box">
      <div class="slot-display" class:locked={slot1Stopped}>{lastNameDisplay}</div>
      {#if !slotMachineDone}
        <SmallButton disabled={currentSlot !== 1} onclick={() => stopSlot(1)} text="Stop" />
      {/if}
    </div>

    <div class="slot-box">
      <div class="slot-display" class:locked={slot2Stopped}>{numberDisplay}</div>
      {#if !slotMachineDone}
        <SmallButton disabled={currentSlot !== 2} onclick={() => stopSlot(2)} text="Stop" />
      {/if}
    </div>
  </div>
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

        .slot-display {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          background: white;
          color: black;
          width: 100%;
          height: 6em;
          margin-bottom: 2em;

          &.locked {
            background: black;
            color: white;
          }
        }
      }
    }
  }
</style>
