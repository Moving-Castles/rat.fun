// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import {
  GameConfig,
  EntityType,
  Balance,
  Dead,
  Health,
  Traits,
  Inventory,
  Owner,
  VisitCount,
  KillCount,
  Level,
  LastVisitBlock,
  RoomCreationCost,
  WorldPrompt,
  MasterKey
} from "../codegen/index.sol";
import { LibManager, LibRat } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";
import { Item } from "../structs.sol";
import { LibUtils } from "../libraries/LibUtils.sol";

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
   * @param _traitsToRemoveFromRat Traits to remove from rat (IDs)
   * @param _traitToAddToRat Trait to add to rat
   * @param _itemsToRemoveFromRat Items to remove from rat (IDs)
   * @param _itemsToAddToRat Items to add to rat
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
    require(Level.get(_roomId) == Level.get(_ratId), "rat and room level mismatch");

    // Increment visitor count
    VisitCount.set(_roomId, VisitCount.get(_roomId) + 1);

    // * * * * * * * * * * * * *
    // BUDGETING
    // * * * * * * * * * * * * *

    // A room can give a maximum of half of its creation cost
    uint256 roomBudget = LibUtils.min(RoomCreationCost.get(_roomId) / 2, Balance.get(_roomId));

    // console.log("1: roomBudget", roomBudget);

    // * * * * * * * * * * * * *
    // HEALTH
    // * * * * * * * * * * * * *

    // Health change can have positive or negative value: effect on room balance unknown
    roomBudget = LibManager.updateHealth(roomBudget, _ratId, _roomId, _healthChange);

    // console.log("2: roomBudget", roomBudget);

    // Exit early if dead
    if (Health.get(_ratId) == 0) {
      _killRat(_ratId, _roomId);
      return;
    }

    // * * * * * * * * * * * * *
    // TRAITS
    // * * * * * * * * * * * * *

    // As traits always have positive value, this will always increase the room balance
    LibManager.removeTraitsFromRat(_ratId, _roomId, _traitsToRemoveFromRat);
    // As traits always have positive value, this will always decrease the room balance
    roomBudget = LibManager.addTraitsToRat(roomBudget, _ratId, _roomId, _traitToAddToRat);

    // console.log("3: roomBudget", roomBudget);

    // * * * * * * * * * * * * *
    // ITEMS
    // * * * * * * * * * * * * *

    // As items always have positive value, this will always increase the room balance
    LibManager.removeItemsFromRat(_ratId, _roomId, _itemsToRemoveFromRat);
    // As items always have positive value, this will always decrease the room balance
    roomBudget = LibManager.addItemsToRat(roomBudget, _ratId, _roomId, _itemsToAddToRat);

    // console.log("4: roomBudget", roomBudget);

    // * * * * * * * * * * * * *
    // BALANCE
    // * * * * * * * * * * * * *

    // Balance transfer can have positive or negative value: effect on room balance unknown
    LibManager.updateBalance(roomBudget, _ratId, _roomId, _balanceTransferToOrFromRat);

    // * * * * * * * * * * * * *
    // LEVEL CHANGE
    // * * * * * * * * * * * * *

    LibManager.checkLevelChange(_ratId);

    // Update last visit block
    LastVisitBlock.set(_roomId, block.number);
  }

  function _killRat(bytes32 _ratId, bytes32 _roomId) internal {
    uint256 balanceToTransfer = LibRat.killRat(_ratId, false);
    Balance.set(_roomId, Balance.get(_roomId) + balanceToTransfer);
    KillCount.set(_roomId, KillCount.get(_roomId) + 1);
  }

  /**
   * @notice Set the world prompt
   * @dev Only admin can call this function
   * @param _worldPrompt The new world prompt
   */
  function setWorldPrompt(string memory _worldPrompt) public onlyAdmin {
    WorldPrompt.set(_worldPrompt);
  }

  function giveMasterKey(bytes32 playerId) public onlyAdmin {
    MasterKey.set(playerId, true);
  }
}
