// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { GameConfig, EntityType, Balance, Inventory } from "../codegen/index.sol";
import { LibUtils, LibItem } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

contract PlayerSystem is System {
  /**
   * @notice Spawn player
   * @param _playerId The id of the player
   */
  function spawn() public returns (bytes32 _playerId) {
    _playerId = LibUtils.addressToEntityKey(_msgSender());
    EntityType.set(_playerId, ENTITY_TYPE.PLAYER);
    Balance.set(_playerId, 1000);
  }

  /**
   * @notice Create item and add to player's inventory
   * @dev Only admin can call this function
   * @param _playerId The id of the player
   * @param _name Descirption of the item
   * @param _value Value of the item
   * @return itemId The id of the new item
   */
  function addItemToInventory(bytes32 _playerId, string memory _name, uint256 _value) public returns (bytes32 itemId) {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
    itemId = LibItem.createItem(_name, _value);
    // Add to inventory table
    Inventory.push(_playerId, itemId);
  }

  /**
   * @notice Remove item from player's inventory and destroy the item
   * @dev Only admin can call this function
   * @param _playerId The id of the player
   * @param _itemId The id of the item
   */
  function removeItemFromInventory(bytes32 _playerId, bytes32 _itemId) public {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
    LibItem.destroyItem(_itemId);
    // Remove from inventory table
    Inventory.set(_playerId, LibUtils.removeFromArray(Inventory.get(_playerId), _itemId));
  }
}
