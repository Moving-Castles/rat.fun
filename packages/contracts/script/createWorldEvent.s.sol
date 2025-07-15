// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Script } from "forge-std/Script.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { LibWorld } from "../src/libraries/Libraries.sol";

contract CreateWorldEvent is Script {
  function run(address worldAddress) external {
    // Specify a store so that you can use tables directly in PostDeploy
    StoreSwitch.setStoreAddress(worldAddress);

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    LibWorld.createWorldEvent("OVERHEATING", "Heating system is working in overdrive: +25C/77F in all rooms.", 10000);

    vm.stopBroadcast();
  }
}
