// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { TestNumeraireToken } from "../src/external/TestNumeraireToken.sol";

contract DeployTestNumeraireToken is Script {
  function run() external {
    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    TestNumeraireToken erc20 = new TestNumeraireToken();
    console.log("deployed token address: ", address(erc20));

    vm.stopBroadcast();
  }
}
