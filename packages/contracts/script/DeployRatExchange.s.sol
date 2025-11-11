// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { ERC20EquivalentExchange } from "../src/external/ERC20EquivalentExchange.sol";

contract DeployRatExchange is Script {
  function run() external {
    if (block.chainid != 8453) {
      revert("Unrecognized chain, use base mainnet");
    }

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    address fakeRat = 0x13751a213f39ef4DadfcD1eb35aAC8AEc0De5bA6;
    revert("TODO set real rat token address");
    address realRat;

    ERC20EquivalentExchange exchange = new ERC20EquivalentExchange(vm.addr(deployerPrivateKey), fakeRat, realRat);
    console.log("deployed exchange address: ", address(exchange));

    vm.stopBroadcast();
  }
}
