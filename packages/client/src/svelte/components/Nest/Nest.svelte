<script lang="ts">
  import { player } from "@svelte/modules/state/base/stores"
  import { TRAIT_LABELS } from "../Spawn/stores"
  import {
    BASE_REALITY_PROMPT,
    BASE_STYLE_GUIDELINES,
    BASE_ROOM_PROMPT,
  } from "./constants"
  import { parseJSONFromContent } from "@modules/utils"
  import Spinner from "../Spinner/Spinner.svelte"

  let busy = false
  let outcome: any
  let narrative = ""
  let inRoom = false

  let realityPrompt = BASE_REALITY_PROMPT
  let styleGuidelines = BASE_STYLE_GUIDELINES
  let roomPrompt = BASE_ROOM_PROMPT

  const generateRatPrompt = () => {
    return JSON.stringify({
      medulla: $player.brain.traitA,
      cereberus: $player.brain.traitB,
      deathDrive: $player.brain.traitC,
      pinealGland: $player.brain.traitD,
    })
  }

  const submit = async () => {
    inRoom = true
    busy = true
    narrative = ""
    outcome = {}
    // const url = "http://localhost:3030/api/generate"
    const url = "https://reality-model-1.mc-infra.com/api/generate"

    const formData = new URLSearchParams()
    formData.append("realityPrompt", realityPrompt)
    formData.append("styleGuidelines", styleGuidelines)
    formData.append("roomPrompt", roomPrompt)
    formData.append("ratPrompt", generateRatPrompt())

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const res = await response.json()
      console.log("res", res)
      // const data = JSON.parse(res.data)
      // console.log(data[0])
      outcome = parseJSONFromContent(res.message.text)
      console.log(outcome)
      narrative = outcome.narrative

      busy = false
    } catch (err) {
      // console.error(err)
      outcome = "An error occurred. Please try again."
      busy = false
    }
  }
</script>

{#if !inRoom && $player?.brain}
  <!-- STATS -->
  <div class="nest">
    <div class="avatar">
      <img src="/images/rat.jpg" alt="rat" />
    </div>
    <div class="brain-stats">
      <div class="header">THE RAT</div>
      <div class="trait">
        <strong>{TRAIT_LABELS[0]}</strong> (intelligence and weakness):
        <strong>{$player.brain.traitA}</strong>
      </div>
      <div class="trait">
        <strong>{TRAIT_LABELS[1]}</strong> (aggression and idiot-rage):
        <strong>{$player.brain.traitB}</strong>
      </div>
      <div class="trait">
        <strong>{TRAIT_LABELS[2]}</strong> (fearlessness and carelessness):
        <strong>{$player.brain.traitC}</strong>
      </div>
      <div class="trait">
        <strong>{TRAIT_LABELS[3]}</strong> (psychic abilities / paranoia):
        <strong>{$player.brain.traitD}</strong>
      </div>
    </div>
  </div>
  <!-- ROOM LIST -->
  <div class="room-list">
    <div class="room-item">
      <button on:click={submit} disabled={busy}>ROOM 1</button>
      <div class="room-info">
        <textarea bind:value={roomPrompt}></textarea>
      </div>
    </div>
  </div>
{/if}

{#if inRoom}
  <div class="room">
    <h1>ROOM 1</h1>
    <div class="room-info">{roomPrompt}</div>
    {#if narrative}
      <div class="narrative">
        <pre>{narrative}</pre>
        <div class="outcome">{outcome.isAlive ? "RAT LIVES" : "RAT DIES"}</div>
      </div>
      <button on:click={() => (inRoom = false)}>Return to nest</button>
    {:else}
      <div class="loader">RAT ENTERING ROOM 1...</div>
      <Spinner />
    {/if}
  </div>
{/if}

<style>
  .nest {
    text-align: center;
    padding: 10px;
    background: rgb(88, 88, 88);
    color: white;
    width: 100%;
    font-family: "courier new", monospace;
  }

  .room {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgb(60, 60, 60);
    padding: 20px;
  }

  .header {
    font-weight: bold;
    margin-bottom: 1em;
  }

  .trait {
    margin-bottom: 1em;
  }

  button {
    padding: 40px;
    font-size: 32px;
    margin-top: 20px;
    cursor: pointer;
  }

  .room-item {
    display: flex;
    width: 100%;

    button {
      width: 50%;
      padding: 40px;
      font-size: 32px;
      margin-top: 20px;
    }
  }

  .room-info {
    padding: 20px;
    background: rgb(211, 255, 79);
    color: black;
    margin-top: 20px;
    font-size: 12px;
  }

  .narrative {
    padding: 20px;
    background: yellow;
    color: black;
    margin-top: 20px;
  }

  .outcome {
    font-weight: bold;
    background: black;
    color: white;
    margin-top: 20px;
  }

  textarea {
    width: 500px;
    height: 100%;
    padding: 4px;
  }

  .loader {
    margin-top: 20px;
    margin-bottom: 20px;
  }
</style>
