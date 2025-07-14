import type { Snippet } from "svelte"

let modalState = $state<null | Snippet>(null)
let showModal = $state(false)
let modalConfig = $state<{
  target?: string
  noclose?: boolean
  fullscreen?: boolean
}>({})

export const getModalState = () => {
  const setState = (children: Snippet | null) => {
    if (children === null) {
      modalState = null
      showModal = false
    } else {
      showModal = true
      modalState = children
    }
  }

  const setConfig = (c: Partial<typeof modalConfig>) => (modalConfig = { ...modalConfig, ...c })

  const closeModal = () => setState(null)

  return {
    modal: {
      set: setState,
      close: closeModal,
      setConfig: setConfig,
      get config() {
        return modalConfig
      },
      get show() {
        return showModal
      },
      get current() {
        return modalState
      }
    }
  }
}
