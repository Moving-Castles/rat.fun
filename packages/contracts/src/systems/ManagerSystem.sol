// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { System } from "@latticexyz/world/src/System.sol";
import {
  GameConfig,
  EntityType,
  Balance,
  Dead,
  VisitCount,
  KillCount,
  Level,
  LastVisitBlock,
  RoomCreationCost,
  MasterKey,
  IsSpecialRoom,
  MaxValuePerWin
} from "../codegen/index.sol";
import { LibManager, LibRat } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";
import { Item } from "../structs.sol";
import { LibUtils } from "../libraries/LibUtils.sol";
import { LibWorld } from "../libraries/LibWorld.sol";

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
   * @param _balanceTransferToOrFromRat Credits to transfer to or from rat
   * @param _itemsToRemoveFromRat Items to remove from rat (IDs)
   * @param _itemsToAddToRat Items to add to rat
   */
  function applyOutcome(
    bytes32 _ratId,
    bytes32 _roomId,
    int256 _balanceTransferToOrFromRat,
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

    uint256 roomBudget;

    if (IsSpecialRoom.get(_roomId)) {
      // If the room is special, it has a custom max value per win
      roomBudget = MaxValuePerWin.get(_roomId);
    } else {
      // A normal room can give a maximum of half of its creation cost
      roomBudget = LibUtils.min(RoomCreationCost.get(_roomId) / 2, Balance.get(_roomId));
    }

    // * * * * * * * * * * * * *
    // BALANCE
    // * * * * * * * * * * * * *

    // Balance transfer can have positive or negative value: effect on room balance unknown
    roomBudget = LibManager.updateBalance(roomBudget, _ratId, _roomId, _balanceTransferToOrFromRat);

    // A rat is dead if balance is 0
    // If so, kill the rat and abort
    if (Balance.get(_ratId) == 0) {
      _killRat(_ratId, _roomId);
      return;
    }

    // * * * * * * * * * * * * *
    // ITEMS
    // * * * * * * * * * * * * *

    // As items always have positive value, this will always increase the room balance
    LibManager.removeItemsFromRat(_ratId, _roomId, _itemsToRemoveFromRat);
    // As items always have positive value, this will always decrease the room balance
    roomBudget = LibManager.addItemsToRat(roomBudget, _ratId, _roomId, _itemsToAddToRat);

    // * * * * * * * * * * * * *
    // LEVEL CHANGE
    // * * * * * * * * * * * * *

    LibManager.checkLevelChange(_ratId);

    // Update last visit block
    LastVisitBlock.set(_roomId, block.number);
  }

  /**
   * @notice Kill a rat
   * @param _ratId The id of the rat
   * @param _roomId The id of the room
   */
  function _killRat(bytes32 _ratId, bytes32 _roomId) internal {
    uint256 balanceToTransfer = LibRat.killRat(_ratId);
    Balance.set(_roomId, Balance.get(_roomId) + balanceToTransfer);
    KillCount.set(_roomId, KillCount.get(_roomId) + 1);
  }

  /**
   * @notice Give in game admin access to a player
   * @dev Only admin can call this function
   * @param playerId The id of the player
   */
  function giveMasterKey(bytes32 playerId) public onlyAdmin {
    MasterKey.set(playerId, true);
  }

  /**
   * @notice Set a world event
   * @param cmsId The id of the world event in the CMS
   * @param title The title of the world event
   * @param prompt The prompt for the world event
   * @param durationInBlocks The duration of the world event in blocks
   */
  function setWorldEvent(
    string memory cmsId,
    string memory title,
    string memory prompt,
    uint256 durationInBlocks
  ) public onlyAdmin {
    LibWorld.setWorldEvent(cmsId, title, prompt, durationInBlocks);
  }

  /**
   * @notice Remove the world event
   */
  function removeWorldEvent() public onlyAdmin {
    LibWorld.removeWorldEvent();
  }
}
