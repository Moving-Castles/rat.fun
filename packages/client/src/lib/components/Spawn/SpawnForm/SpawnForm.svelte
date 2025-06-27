<script lang="ts">
  import { BigButton } from "$lib/components/Shared"

  const { onComplete = () => {} } = $props<{
    onComplete: (name: string) => void
  }>()

  let name = $state("")

  const submitForm = () => {
    onComplete(name)
  }
</script>

<div class="container">
  <div class="main">
    <!-- INTRO TEXT -->
    <div class="content">
      <p class="header">
        <span class="inverted">Welcome to RAT.FUN</span>
      </p>
    </div>

    <!-- FORM -->
    <div class="form">
      <p>Sign with name to proceed.</p>
      <!-- INPUT -->
      <input
        type="text"
        placeholder="YOUR NAME"
        bind:value={name}
        onkeydown={e => e.key === "Enter" && submitForm()}
      />
      <BigButton text="SIGN" onclick={submitForm} disabled={!name} />
    </div>
  </div>
</div>

<style lang="scss">
  .container {
    width: 100vw;
    height: 100vh;
    background: var(--background);
    color: var(--foreground);
    font-family: var(--special-font-stack);
    text-transform: none;
    font-size: var(--font-size-large);
  }

  .main {
    width: 100%;
    height: 100%;
    max-width: calc(var(--game-window-width) * 0.9);
    padding: 10px 30px;
    padding-bottom: 30px;
    max-width: 60ch;
  }

  p {
    margin-bottom: 1em;
  }

  .inverted {
    background: var(--color-alert-priority);
    color: var(--background);
    padding: 5px;
  }

  .header {
    margin-bottom: 2em;
    display: block;
  }

  .content {
    padding-top: 1em;
    padding-bottom: 1em;
    border-bottom: 1px dashed var(--foreground);
    margin-bottom: 1em;
  }

  input {
    height: 4em;
    width: 300px;
    font-size: 18px;
    padding: 10px;
    background: var(--color-alert);
    color: var(--background);
    border: none;
    margin-bottom: 0.5em;
    font-family: "Rock Salt", cursive;
    text-transform: uppercase;
    border-bottom: var(--default-border-style);
    outline: none;

    &::placeholder {
      color: var(--color-grey-dark);
    }
  }
</style>
