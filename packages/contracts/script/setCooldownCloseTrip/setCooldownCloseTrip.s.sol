// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Script } from "forge-std/Script.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { IWorld } from "../../src/codegen/world/IWorld.sol";

contract SetCooldownCloseTrip is Script {
  function run(address worldAddress, uint32 value) external {
    // Specify a store so that you can use tables directly
    StoreSwitch.setStoreAddress(worldAddress);

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    IWorld(worldAddress).ratfun__setCooldownCloseTrip(value);

    vm.stopBroadcast();
  }
}
