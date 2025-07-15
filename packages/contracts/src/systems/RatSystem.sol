// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Owner, CurrentRat, Dead, Inventory, GameConfig, Value } from "../codegen/index.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { LibUtils, LibRat, LibWorld } from "../libraries/Libraries.sol";

contract RatSystem is System {
  /**
   * @notice Create a rat
   * @param _name The name of the rat
   * @return ratId The id of the new rat
   */
  function createRat(string calldata _name) public returns (bytes32 ratId) {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());

    bytes32 currentRat = CurrentRat.get(playerId);

    // A player can only have one rat at a time
    require(currentRat == bytes32(0) || Dead.get(currentRat), "already has rat");

    ratId = LibRat.createRat(_name);

    // Set ownership
    CurrentRat.set(playerId, ratId);
    Owner.set(ratId, playerId);

    // Deposit player tokens in pool
    // ERC-20 will check that player has sufficient balance, and approval for pool to transfer it
    LibWorld.gamePool().depositTokens(
      _msgSender(),
      GameConfig.getRatCreationCost() * 10 ** LibWorld.erc20().decimals()
    );
  }

  /**
   * @notice Liquidate the player's rat
   */
  function liquidateRat() public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    bytes32 ratId = CurrentRat.get(playerId);

    require(ratId != bytes32(0), "no rat");

    // Check that the rat is alive
    require(!Dead.get(ratId), "rat is dead");

    uint256 balanceToTransfer = LibRat.killRat(ratId, true);
    // Withdraw tokens equal to rat value from pool to player
    // ERC-20 will check that pool has sufficient balance
    LibWorld.gamePool().withdrawTokens(_msgSender(), balanceToTransfer * 10 ** LibWorld.erc20().decimals());
  }

  /**
   * @notice Sell an item
   * @param _itemId The id of the item
   */
  function sellItem(bytes32 _itemId) public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    bytes32 ratId = CurrentRat.get(playerId);

    require(ratId != bytes32(0), "no rat");

    // Check that the item is in the rat's inventory
    require(LibUtils.arrayIncludes(Inventory.get(ratId), _itemId), "item not in inventory");

    // Remove it from the inventory
    Inventory.set(ratId, LibUtils.removeFromArray(Inventory.get(ratId), _itemId));

    uint256 balanceToTransfer = Value.get(_itemId);

    // Withdraw tokens equal to item value from pool to player
    // ERC-20 will check that pool has sufficient balance
    LibWorld.gamePool().withdrawTokens(_msgSender(), balanceToTransfer * 10 ** LibWorld.erc20().decimals());
  }
}
