import { Chain, Hex, PublicClient, Transport } from "viem"

type Listener<T> = (value: T) => void
type Unsubscribe = () => void

export abstract class AbstractERC20Listener<T> {
  protected interval: ReturnType<typeof setInterval> | null = null
  protected listeners = new Set<(value: T) => void>()
  // Incrementing index so each nonce is unique and greater than previous
  protected totalNonce: bigint = 0n
  // Ignore async values from requests sent before the last accepted one
  // (this helps avoid race conditions with e.g. manual updates)
  protected lastUpdateNonce: bigint = 0n
  protected value: T

  constructor(
    protected publicClient: PublicClient<Transport, Chain>,
    protected ownerAddress: Hex,
    protected erc20Address: Hex,
    protected intervalFrequency: number,
    initialValue: T
  ) {
    this.value = initialValue
  }

  /**
   * Async value getter implementation
   */
  protected abstract fetchValue(): Promise<T>;

  /**
   * Trigger an async request to update the value
   * Can be used externally to manually trigger an update regardless of intervals
   */
  triggerUpdate() {
    // Nonce is used to ignore stale updates
    const localNonce = this.totalNonce
    this.totalNonce += 1n

    this.fetchValue().then((value) => {
      if (localNonce >= this.lastUpdateNonce) {
        this.lastUpdateNonce = localNonce
        this.value = value
        this.notify()
      }
    })
  }

  start() {
    // Clear old interval if used as a restart
    this.stop()
    // Initial update
    this.triggerUpdate()
    // ERC20 balance/allowance are updated explicitly after user actions
    // We just have to listen for external changes
    this.interval = setInterval(() => {
      this.triggerUpdate()
    }, this.intervalFrequency)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  subscribe(listener: Listener<T>): Unsubscribe {
    this.listeners.add(listener)
    listener(this.value) // Immediate callback with current value
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.value))
  }
}