export { default as ModalTarget } from "./ModalTarget.svelte"
export { default as Modal } from "./Modal.svelte"

let modalState = $state(null)
let showModal = $state(false)
let modalConfig = $state<{ target?: string; noclose?: boolean }>({})

export const getModalState = () => {
  const setState = children => {
    if (children === null) {
      modalState = null
      showModal = false
    } else {
      showModal = true
      modalState = children
    }
  }

  const setConfig = c => (modalConfig = c)

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
      },
    },
  }
}
