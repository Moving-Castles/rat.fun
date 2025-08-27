export interface Toast {
  id: string
  message: string
  type?: "error" | "success" | "warning" | "info"
  duration?: number
}

// shorten words that are extremely long (always the motherfn addresses...)
const processMessage = (msg: string) => {
  return msg
    .split(" ")
    .map(word => {
      if (word.length > 32) {
        return `${word.substring(0, 32)}...`
      }
      return word
    })
    .join(" ")
}

class ToastManager {
  toasts = $state<Toast[]>([])

  add(toast: Omit<Toast, "id">): string {
    const id = crypto.randomUUID()
    const newToast: Toast = {
      id,
      type: "error",
      duration: 10000,
      ...toast
    }
    newToast.message = processMessage(newToast.message)

    this.toasts.push(newToast)

    // Auto-remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.remove(id)
      }, newToast.duration)
    }

    return id
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id)
  }

  clear() {
    this.toasts = []
  }
}

export const toastManager = new ToastManager()
