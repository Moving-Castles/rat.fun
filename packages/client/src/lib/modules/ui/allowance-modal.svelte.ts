/**
 * Global state for the ManageAllowanceModal
 */
export const allowanceModalState = $state({
  isOpen: false,
  warningMessage: undefined as string | undefined
})

export function openAllowanceModal(warningMessage?: string) {
  allowanceModalState.isOpen = true
  allowanceModalState.warningMessage = warningMessage
}

export function closeAllowanceModal() {
  allowanceModalState.isOpen = false
  allowanceModalState.warningMessage = undefined
}
