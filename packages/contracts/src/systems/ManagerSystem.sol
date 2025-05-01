// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { GameConfig, EntityType, Balance, Dead, Health, Traits, Inventory, Owner, VisitCount, KillCount } from "../codegen/index.sol";
import { LibManager, LibRat } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";
import { CREATOR_FEE } from "../constants.sol";
import { Item } from "../structs.sol";

/**
 * @dev Only admin can call these function
 */
contract ManagerSystem is System {
  /**
   * @dev Modifier to restrict access to admin only
   */
  modifier onlyAdmin() {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
    _;
  }

  /**
   * @notice Apply outcome of a room interaction
   * @dev Only admin can call this function
   * @param _ratId Id of the rat
   * @param _roomId Id of the room
   * @param _healthChange Change to the rat's health
   * @param _balanceTransferToOrFromRat Credits to transfer to or from rat
   * @param _traitsToRemoveFromRat Traits to remove from rat
   * @param _itemsToRemoveFromRat Items to remove from rat
   */
  function applyOutcome(
    bytes32 _ratId,
    bytes32 _roomId,
    int256 _healthChange,
    int256 _balanceTransferToOrFromRat,
    bytes32[] calldata _traitsToRemoveFromRat,
    Item[] calldata _traitToAddToRat,
    bytes32[] calldata _itemsToRemoveFromRat,
    Item[] calldata _itemsToAddToRat
  ) public onlyAdmin {
    require(EntityType.get(_ratId) == ENTITY_TYPE.RAT, "not rat");
    require(Dead.get(_ratId) == false, "rat is dead");
    require(EntityType.get(_roomId) == ENTITY_TYPE.ROOM, "not room");
    require(Balance.get(_roomId) >= 0, "no room balance");

    // Increment visitor count
    VisitCount.set(_roomId, VisitCount.get(_roomId) + 1);

    // * * * * * * * * * * * * *
    // HEALTH
    // * * * * * * * * * * * * *

    LibManager.updateHealth(_ratId, _roomId, _healthChange);

    // Exit early if dead
    if (Health.get(_ratId) == 0) {
      LibRat.killRat(_ratId, _roomId);
      KillCount.set(_roomId, KillCount.get(_roomId) + 1);
      return;
    }

    // * * * * * * * * * * * * *
    // TRAITS
    // * * * * * * * * * * * * *

    LibManager.removeTraitsFromRat(_ratId, _roomId, _traitsToRemoveFromRat);
    LibManager.addTraitsToRat(_ratId, _roomId, _traitToAddToRat);

    // * * * * * * * * * * * * *
    // ITEMS
    // * * * * * * * * * * * * *

    LibManager.removeItemsFromRat(_ratId, _roomId, _itemsToRemoveFromRat);
    LibManager.addItemsToRat(_ratId, _roomId, _itemsToAddToRat);

    // * * * * * * * * * * * * *
    // BALANCE
    // * * * * * * * * * * * * *

    LibManager.updateBalance(_ratId, _roomId, _balanceTransferToOrFromRat);

    // * * * * * * * * * * * * *
    // LEVEL CHANGE
    // * * * * * * * * * * * * *

    // Levels/floors are not used at the moment, but might be brought back...
    // LibManager.checkLevelChange(_ratId);
  }
}
