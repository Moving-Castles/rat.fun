export { default as ModalTarget } from "./ModalTarget.svelte"
export { default as Modal } from "./Modal.svelte"

let modalState = $state(null)
let showModal = $state(false)
export const getModalState = () => {
  const setState = children => {
    console.log("SET")
    if (children === null) {
      modalState = null
      showModal = false
    } else {
      showModal = true
      modalState = children
    }
  }

  const closeModal = () => setState(null)

  return {
    modal: {
      set: setState,
      close: closeModal,
      get show() {
        return showModal
      },
      get current() {
        return modalState
      },
    },
  }
}
