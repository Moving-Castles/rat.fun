import _IWorldAbi from "./out/IWorld.sol/IWorld.abi.json" with { type: "json" }
import ISlopERC20Abi from "./out/SlopERC20.sol/SlopERC20.abi.json" with { type: "json" }

// add erc20 abi for better reporting of its events/errors
export const IWorldAbi = [
  ..._IWorldAbi,
  ...ISlopERC20Abi.filter(({ type }) => type !== "function")
] as typeof _IWorldAbi
