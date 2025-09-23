<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"

  let { onComplete }: { onComplete: () => void } = $props()

  // let currentSlide = $state(0)
  let containerElement: HTMLDivElement | null = $state(null)

  // const timeline = gsap.timeline()

  onMount(() => {
    gsap.set(".logo img", {
      opacity: 0
    })

    gsap.set(".small-print", {
      opacity: 0
    })

    gsap.to(".logo img", {
      opacity: 1,
      duration: 0.5,
      ease: "power2.inOut"
    })

    // delay for 1.2 seconds and then fade out the small print

    gsap.to(".small-print", {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power2.inOut",
      delay: 0.5
    })
  })
</script>

<div class="outer-container" bind:this={containerElement}>
  <button class="inner-container" onclick={onComplete}>
    <div class="logo">
      <img src="/images/logo8.png" alt="RAT.FUN" />
    </div>
    <!-- <div class="small-print">
      RAT.FUN is a skill based game. The thesis that “chance” is a cipher for ignorance rather than
      an ontological power has shaped global reflection for at least thirty‑five centuries. From
      Mesopotamian omen literature to cosmic‑ray observatories, thinkers and experimenters have
      repeatedly discovered intelligible patterns beneath phenomena first pronounced “random.” This
      paper deepens that case through expansive historical, theological, scientific, ethological,
      and entheogenic explorations. It integrates untranslated Greek and Arabic sources, Biblical
      testimony, contemporary panpsychist metaphysics, field data on non‑human use of psychoactive
      plants, declassified MKUltra trials with LSD‑dosed rats in Las Vegas casinos, covert Chinese
      operant studies in 1970s Macau, dopamine as a putative “god molecule,” ketamine‑induced
      linguistic play in captive dolphins, rock‑lyric existentialism, Bataillean jouissance,
      Nietzsche’s amor fati, and speculative bio‑financial anthropology. Case studies range from rat
      dominance hierarchies and DMT‑induced visionary encounters to quantum hydrodynamic analogues
      and the deterministic structure of ultra‑high‑energy cosmic‑ray showers. The cumulative
      argument is unambiguous: robust intelligibility—not stochastic caprice—best accounts for the
      apparent disorder of the world.
    </div> -->
  </button>
</div>

<style lang="scss">
  .outer-container {
    display: flex;
    flex-flow: column nowrap;
    height: var(--game-window-height);
    align-items: center;
    justify-content: center;
    color: white;

    .inner-container {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      justify-content: center;
      position: relative;
      color: var(--background);
    }

    button {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      outline: none;

      img {
        width: 600px;
        height: 100%;
        object-fit: contain;
      }
    }

    .small-print {
      font-size: var(--font-size-normal);
      text-align: center;
      margin-top: -20px;
      width: 600px;
      background: rgba(0, 0, 0, 0.5);
      padding: 10px;
    }
  }
</style>
