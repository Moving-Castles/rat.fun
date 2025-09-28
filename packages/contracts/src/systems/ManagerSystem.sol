// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { System } from "@latticexyz/world/src/System.sol";
import {
  GameConfig,
  GamePercentagesConfig,
  EntityType,
  Balance,
  Dead,
  VisitCount,
  KillCount,
  TripCount,
  LastVisitBlock,
  RoomCreationCost,
  MasterKey
} from "../codegen/index.sol";
import { LibManager, LibRat, LibRoom } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";
import { Item } from "../structs.sol";
import { LibUtils } from "../libraries/LibUtils.sol";
import { LibWorld } from "../libraries/LibWorld.sol";
import { LibRat } from "../libraries/LibRat.sol";

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
    require(LibRat.getTotalRatValue(_ratId) >= LibRoom.getMinRatValueToEnter(_roomId), "rat value too low");

    // Check that room is not depleted
    uint256 roomBalance = Balance.get(_roomId);
    require(roomBalance > 0, "no room balance");

    // Increment visitor count
    VisitCount.set(_roomId, VisitCount.get(_roomId) + 1);

    // Increment trip count
    TripCount.set(_ratId, TripCount.get(_ratId) + 1);

    // * * * * * * * * * * * * *
    // BUDGETING
    // * * * * * * * * * * * * *

    uint256 roomBudget = LibUtils.min(LibRoom.getMaxValuePerWin(_roomId), roomBalance);

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
    roomBudget = LibManager.removeItemsFromRat(roomBudget, _ratId, _roomId, _itemsToRemoveFromRat);
    // As items always have positive value, this will always decrease the room balance
    roomBudget = LibManager.addItemsToRat(roomBudget, _ratId, _roomId, _itemsToAddToRat);

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

  // * * * * * * * * * * * * *
  // CONFIG SETTERS
  // * * * * * * * * * * * * *

  function setCooldownCloseRoom(uint32 _cooldownCloseRoom) public onlyAdmin {
    GameConfig.setCooldownCloseRoom(_cooldownCloseRoom);
  }

  // * * * * * * * * * * * * *
  // PERCENTAGE CONFIG SETTERS
  // * * * * * * * * * * * * *

  function _checkPercentageValue(uint32 _value) internal pure {
    require(_value <= 100, "percentage value too high");
  }

  function setMaxValuePerWin(uint32 _maxValuePerWin) public onlyAdmin {
    _checkPercentageValue(_maxValuePerWin);
    GamePercentagesConfig.setMaxValuePerWin(_maxValuePerWin);
  }

  function setMinRatValueToEnter(uint32 _minRatValueToEnter) public onlyAdmin {
    _checkPercentageValue(_minRatValueToEnter);
    GamePercentagesConfig.setMinRatValueToEnter(_minRatValueToEnter);
  }

  function setTaxationLiquidateRat(uint32 _taxationLiquidateRat) public onlyAdmin {
    _checkPercentageValue(_taxationLiquidateRat);
    GamePercentagesConfig.setTaxationLiquidateRat(_taxationLiquidateRat);
  }

  function setTaxationCloseRoom(uint32 _taxationCloseRoom) public onlyAdmin {
    _checkPercentageValue(_taxationCloseRoom);
    GamePercentagesConfig.setTaxationCloseRoom(_taxationCloseRoom);
  }
}
