// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { ExternalAddressesConfig } from "../../src/codegen/index.sol";

contract GetErc20Address is Script {
  function run(address worldAddress) external {
    // Specify a store so that you can use tables directly
    StoreSwitch.setStoreAddress(worldAddress);

    address erc20Address = ExternalAddressesConfig.getErc20Address();
    console.log("ERC20 Address:", erc20Address);
  }
}
