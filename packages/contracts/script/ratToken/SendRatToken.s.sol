// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SendRatToken is Script {
  address constant RAT_TOKEN = 0xf2DD384662411A21259ab17038574289091F2D41;

  /// @param to Recipient address
  /// @param amount Amount in whole RAT tokens
  function run(address to, uint256 amount) external {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address sender = vm.addr(deployerPrivateKey);

    uint256 amountWithDecimals = amount * 1e18;

    console.log("Sending RAT tokens");
    console.log("From:", sender);
    console.log("To:", to);
    console.log("Amount:", amount, "RAT");

    vm.startBroadcast(deployerPrivateKey);

    IERC20(RAT_TOKEN).transfer(to, amountWithDecimals);

    vm.stopBroadcast();

    console.log("Transfer complete");
  }
}
