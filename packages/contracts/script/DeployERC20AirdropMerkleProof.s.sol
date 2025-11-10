// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { ERC20AirdropMerkleProof } from "../src/external/ERC20AirdropMerkleProof.sol";

contract DeployERC20AirdropMerkleProof is Script {
  function run() external {
    if (block.chainid != 8453) {
      revert("Unrecognized chain, use base mainnet");
    }

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    // TODO use correct token and root
    address erc20 = 0x13751a213f39ef4DadfcD1eb35aAC8AEc0De5bA6;
    bytes32 merkleRoot = 0x1e82a8295e02d74a339141214d46fc0ce0cf7c29047a6f6bbcdfb7dc8593364b;

    ERC20AirdropMerkleProof airdrop = new ERC20AirdropMerkleProof(vm.addr(deployerPrivateKey), erc20, merkleRoot);
    console.log("deployed airdrop address: ", address(airdrop));

    vm.stopBroadcast();
  }
}
