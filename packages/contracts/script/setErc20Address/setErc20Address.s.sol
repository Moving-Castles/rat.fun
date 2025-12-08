// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Script } from "forge-std/Script.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { ExternalAddressesConfig } from "../../src/codegen/index.sol";

contract SetErc20Address is Script {
  function run(address worldAddress, address erc20Address) external {
    // Specify a store so that you can use tables directly
    StoreSwitch.setStoreAddress(worldAddress);

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    ExternalAddressesConfig.setErc20Address(erc20Address);

    vm.stopBroadcast();
  }
}
