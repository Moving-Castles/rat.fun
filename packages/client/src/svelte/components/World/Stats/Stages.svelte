<script lang="ts">
  import { useThrelte } from "@threlte/core"
  import { Pane, Folder, Button } from "svelte-tweakpane-ui"

  console.log("stages")

  const { scheduler } = useThrelte()
  const { stages } = scheduler.getSchedule({ tasks: true })
</script>

<Pane position="fixed">
  <Folder expanded={true} title="Stages & Tasks">
    {#each stages as stage}
      <Folder expanded={true} title={stage.key}>
        <Button title="STAGE TASK BINCH"></Button>
        <!-- {#each stage.tasks as task}
        <Button title={task} />
      {/each} -->
      </Folder>
    {/each}
  </Folder>
</Pane>
