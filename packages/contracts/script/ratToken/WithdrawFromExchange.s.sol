// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { ERC20EquivalentExchange } from "../../src/external/ERC20EquivalentExchange.sol";

contract WithdrawFromExchange is Script {
  address constant EXCHANGE = 0x752c792eb9BF02A2d64558c331ec8333cf40d5d0;

  /// @param amount Amount in whole RAT tokens
  function run(uint256 amount) external {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address sender = vm.addr(deployerPrivateKey);

    uint256 amountWithDecimals = amount * 1e18;

    console.log("Withdrawing from exchange");
    console.log("Exchange:", EXCHANGE);
    console.log("Admin:", sender);
    console.log("Amount:", amount, "RAT");

    vm.startBroadcast(deployerPrivateKey);

    ERC20EquivalentExchange(EXCHANGE).withdraw(amountWithDecimals);

    vm.stopBroadcast();

    console.log("Withdraw complete");
  }
}
