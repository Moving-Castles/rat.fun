// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract ERC20AirdropMerkleProof {
  // Admin is allowed to withdraw unclaimed tokens, ending the airdrop
  address public immutable adminAddress;
  // Token being airdropped
  IERC20 public immutable token;
  // Merkle tree root which determines addresses and their available claim amounts
  // (the tree itself is expected to be stored offchain)
  bytes32 public immutable root;
  // Addresses who have claimed tokens
  mapping(address => bool) public hasClaimed;

  event Claim(address indexed to, uint256 amount);

  error NotAdmin();
  error AlreadyClaimed();
  error InvalidMerkleProof();

  constructor(address _adminAddress, address _token, bytes32 _root) {
    adminAddress = _adminAddress;
    token = IERC20(_token);
    root = _root;
  }

  function withdraw(uint256 amount) external {
    if (msg.sender != adminAddress) revert NotAdmin();
    token.transfer(adminAddress, amount);
  }

  function claim(address receiver, uint256 amount, bytes32[] calldata proof) external {
    // Each address may claim only once
    if (hasClaimed[receiver]) revert AlreadyClaimed();
    // Verify merkle proof for [address, amount] pair
    bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(receiver, amount))));
    if (!MerkleProof.verify(proof, root, leaf)) revert InvalidMerkleProof();

    // Set hasClaimed for this address
    hasClaimed[receiver] = true;
    // Send tokens to address
    token.transfer(receiver, amount);
    // Emit event
    emit Claim(receiver, amount);
  }
}
