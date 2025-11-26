export enum TOAST_TYPE {
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
  PLAYER_NOTIFICATION = "player-notification",
  TRIP_NOTIFICATION = "trip-notification"
}

export interface Toast {
  id: string
  message: string
  type?: TOAST_TYPE
  duration?: number
}

const DEFAULT_DURATION = 6000

// Shorten words that are extremely long (addresses, etc.)
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
      type: TOAST_TYPE.ERROR,
      duration: DEFAULT_DURATION,
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
