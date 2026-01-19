// webgl package logger - disabled by default to prevent memory leaks
// enable via setWebGLLoggingEnabled(true) during development

let loggingEnabled = false

export function setWebGLLoggingEnabled(enabled: boolean): void {
  loggingEnabled = enabled
}

export function isWebGLLoggingEnabled(): boolean {
  return loggingEnabled
}

export const logger = {
  log: (...args: unknown[]): void => {
    if (loggingEnabled) {
      console.log("[WebGL]", ...args)
    }
  },
  warn: (...args: unknown[]): void => {
    if (loggingEnabled) {
      console.warn("[WebGL]", ...args)
    }
  },
  error: (...args: unknown[]): void => {
    // errors always logged regardless of loggingEnabled
    console.error("[WebGL]", ...args)
  }
}
