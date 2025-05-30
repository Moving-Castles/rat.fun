// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Owner, OwnedRat, Dead, Index, Inventory, GameConfig, Balance, VisitedLevels, Level } from "../codegen/index.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { LibUtils, LibRat, LibItem } from "../libraries/Libraries.sol";

contract RatSystem is System {
  /**
   * @notice Create a rat
   * @param _name The name of the rat
   * @return ratId The id of the new rat
   */
  function createRat(string calldata _name) public returns (bytes32 ratId) {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());

    bytes32 currentRat = OwnedRat.get(playerId);

    // A player can only have one rat at a time
    require(currentRat == bytes32(0) || Dead.get(currentRat), "already has rat");
    require(Balance.get(playerId) >= GameConfig.getRatCreationCost(), "not enough balance");

    ratId = LibRat.createRat(_name);

    // Set ownership
    OwnedRat.set(playerId, ratId);
    Owner.set(ratId, playerId);

    Balance.set(playerId, Balance.get(playerId) - GameConfig.getRatCreationCost());
  }

  /**
   * @notice Liquidate rat
   */
  function liquidateRat() public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    bytes32 ratId = OwnedRat.get(playerId);

    require(ratId != bytes32(0), "no rat");

    // Check that the rat is alive
    require(!Dead.get(ratId), "rat is dead");

    LibRat.killRat(ratId, playerId, true);
  }

  /**
   * @notice Drop an item
   * @param _itemId The id of the item
   */
  function dropItem(bytes32 _itemId) public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    bytes32 ratId = OwnedRat.get(playerId);

    require(ratId != bytes32(0), "no rat");

    // Check that the item is in the rat's inventory
    require(LibUtils.arrayIncludes(Inventory.get(ratId), _itemId), "item not in inventory");

    // Remove it from the inventory
    Inventory.set(ratId, LibUtils.removeFromArray(Inventory.get(ratId), _itemId));
  }
}
