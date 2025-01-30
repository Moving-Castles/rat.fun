// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { GameConfig, EntityType, Balance, Name, OwnedRat, Inventory, Dead } from "../codegen/index.sol";
import { LibUtils } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";
import { MAX_INVENTORY_SIZE, MAX_LOADOUT_SIZE } from "../constants.sol";

contract PlayerSystem is System {
  /**
   * @notice Spawn player
   * @param _playerId The id of the player
   */
  function spawn(string memory _name) public returns (bytes32 _playerId) {
    _playerId = LibUtils.addressToEntityKey(_msgSender());
    EntityType.set(_playerId, ENTITY_TYPE.PLAYER);
    Name.set(_playerId, _name);
    Balance.set(_playerId, 1000);
  }

  /**
   * @notice Transfer balance from player to rat
   * @param _value The amount to transfer
   */
  function transferBalanceToRat(uint256 _value) public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    bytes32 ratId = OwnedRat.get(playerId);

    require(ratId != bytes32(0), "no rat");
    require(!Dead.get(ratId), "rat is dead");
    require(Balance.get(playerId) >= _value, "insufficient balance");

    Balance.set(playerId, Balance.get(playerId) - _value);
    Balance.set(ratId, Balance.get(ratId) + _value);
  }

  /**
   * @notice Transfer balance from rat to player
   * @param _value The amount to transfer
   */
  function transferBalanceToPlayer(uint256 _value) public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    bytes32 ratId = OwnedRat.get(playerId);

    require(ratId != bytes32(0), "no rat");
    require(!Dead.get(ratId), "rat is dead");
    require(Balance.get(ratId) >= _value, "insufficient balance");

    Balance.set(ratId, Balance.get(ratId) - _value);
    Balance.set(playerId, Balance.get(playerId) + _value);
  }

  /**
   * @notice Transfer item from rat's load out to player's inventory
   * @param _itemId The id of the item to transfer
   */
  function transferItemToInventory(bytes32 _itemId) public {

    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    bytes32 ratId = OwnedRat.get(playerId);

    require(ratId != bytes32(0), "no rat");
    require(!Dead.get(ratId), "rat is dead");
    require(LibUtils.arrayIncludes(Inventory.get(ratId), _itemId), "item not found");
    require(Inventory.get(playerId).length < MAX_INVENTORY_SIZE, "full");

    // Remove from rat's inventory
    Inventory.set(ratId, LibUtils.removeFromArray(Inventory.get(ratId), _itemId));

    // Add to player's inventory
    Inventory.push(playerId, _itemId);
  }

  /**
   * @notice Transfer item from player's inventory to rat's load out
   * @param _itemId The id of the item to transfer
   */
  function transferItemToLoadOut(bytes32 _itemId) public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    bytes32 ratId = OwnedRat.get(playerId);

    require(ratId != bytes32(0), "no rat");
    require(!Dead.get(ratId), "rat is dead");
    require(LibUtils.arrayIncludes(Inventory.get(playerId), _itemId), "item not found");
    require(Inventory.get(ratId).length < MAX_LOADOUT_SIZE, "full");

    // Remove from player's inventory
    Inventory.set(playerId, LibUtils.removeFromArray(Inventory.get(playerId), _itemId));

    // Add to rat's inventory
    Inventory.push(ratId, _itemId);
  }

}
