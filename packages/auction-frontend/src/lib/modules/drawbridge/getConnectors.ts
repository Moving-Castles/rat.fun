import { CreateConnectorFn } from "@wagmi/core"
import { injected, safe } from "wagmi/connectors"

/**
 * Get connectors based on environment
 */
export function getConnectors(): CreateConnectorFn[] {
  const connectors: CreateConnectorFn[] = []

  // ALWAYS include injected connector for browser extensions and mobile wallet browsers
  connectors.push(injected())

  // Gnosis Safe connector for Safe apps (iframe context)
  if (typeof window !== "undefined" && window?.parent !== window) {
    connectors.push(
      safe({
        allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/]
      })
    )
  }

  return connectors
}
