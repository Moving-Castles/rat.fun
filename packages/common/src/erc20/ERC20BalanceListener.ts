import { Chain, formatUnits, Hex, PublicClient, Transport } from "viem"
import { AbstractERC20Listener } from "./AbstractERC20Listener"
import { readERC20Balance } from "./read"

const BALANCE_INTERVAL = 10_000 // 10 seconds

export class ERC20BalanceListener extends AbstractERC20Listener<number> {
  constructor(
    protected publicClient: PublicClient<Transport, Chain>,
    protected ownerAddress: Hex,
    protected erc20Address: Hex,
    protected erc20Decimals: number
  ) {
    super(
      publicClient,
      ownerAddress,
      erc20Address,
      BALANCE_INTERVAL,
      0
    )
  }

  /**
   * Fetch ERC20 balance and format it
   */
  protected async fetchValue() {
    const value = await readERC20Balance(
      this.publicClient,
      this.erc20Address,
      this.ownerAddress
    )
    return Number(formatUnits(value, this.erc20Decimals))
  }
}