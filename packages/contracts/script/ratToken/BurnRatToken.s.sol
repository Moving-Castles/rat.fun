// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20Burnable is IERC20 {
  function burn(uint256 amount) external;
}

/**
 * @title BurnRatToken
 * @notice Burn RAT tokens from the caller's balance
 *
 * Usage:
 * forge script BurnRatToken \
 *   --sig "run(uint256)" <AMOUNT> \
 *   --rpc-url $RPC_URL --broadcast
 */
contract BurnRatToken is Script {
  address constant RAT_TOKEN = 0xf2DD384662411A21259ab17038574289091F2D41;

  /// @param amount Amount in whole RAT tokens to burn
  function run(uint256 amount) external {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address sender = vm.addr(deployerPrivateKey);

    uint256 amountWithDecimals = amount * 1e18;
    uint256 balanceBefore = IERC20(RAT_TOKEN).balanceOf(sender);

    console.log("Burning RAT tokens");
    console.log("From:", sender);
    console.log("Amount:", amount, "RAT");
    console.log("Balance before:", balanceBefore / 1e18, "RAT");

    vm.startBroadcast(deployerPrivateKey);

    IERC20Burnable(RAT_TOKEN).burn(amountWithDecimals);

    vm.stopBroadcast();

    uint256 balanceAfter = IERC20(RAT_TOKEN).balanceOf(sender);
    console.log("Balance after:", balanceAfter / 1e18, "RAT");
    console.log("Burn complete");
  }
}
