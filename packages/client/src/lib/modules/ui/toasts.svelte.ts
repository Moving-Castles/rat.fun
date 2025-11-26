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

const TOAST_DURATION: Record<TOAST_TYPE, number> = {
  [TOAST_TYPE.ERROR]: 8000,
  [TOAST_TYPE.WARNING]: 8000,
  [TOAST_TYPE.INFO]: 8000,
  [TOAST_TYPE.PLAYER_NOTIFICATION]: 2000,
  [TOAST_TYPE.TRIP_NOTIFICATION]: 8000
}

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
    const type = toast.type ?? TOAST_TYPE.ERROR
    const newToast: Toast = {
      id,
      type,
      duration: TOAST_DURATION[type],
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

  removeByType(type: TOAST_TYPE) {
    this.toasts = this.toasts.filter(t => t.type !== type)
  }

  clear() {
    this.toasts = []
  }
}

export const toastManager = new ToastManager()
