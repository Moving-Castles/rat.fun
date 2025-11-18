import { erc20Abi } from "viem"
import IWorldAbi from "contracts/out/IWorld.sol/IWorld.abi.json" with { type: "json" }

export const ABIS = [erc20Abi, IWorldAbi]
