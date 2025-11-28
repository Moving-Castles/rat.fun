import { Chain, formatUnits, Hex, PublicClient, Transport } from "viem"
import { AbstractERC20Listener } from "./AbstractERC20Listener"
import { readERC20Allowance } from "./read"

const ALLOWANCE_INTERVAL = 60_000 // 1 minute

export class ERC20AllowanceListener extends AbstractERC20Listener<number> {
  constructor(
    protected publicClient: PublicClient<Transport, Chain>,
    protected ownerAddress: Hex,
    protected erc20Address: Hex,
    protected erc20Decimals: number,
    protected erc20SpenderAddress: Hex
  ) {
    super(
      publicClient,
      ownerAddress,
      erc20Address,
      ALLOWANCE_INTERVAL,
      0
    )
  }

  /**
   * Fetch ERC20 allowance and format it
   */
  protected async fetchValue() {
    const value = await readERC20Allowance(
      this.publicClient,
      this.erc20Address,
      this.ownerAddress,
      this.erc20SpenderAddress
    )
    return Number(formatUnits(value, this.erc20Decimals))
  }
}