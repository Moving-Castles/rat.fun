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
  TripCreationCost,
  MasterKey,
  ChallengeTrip,
  ChallengeWinner,
  Owner
} from "../codegen/index.sol";
import { LibManager, LibRat, LibTrip } from "../libraries/Libraries.sol";
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
   * @notice Apply outcome of a trip interaction
   * @dev Only admin can call this function
   * @param _ratId Id of the rat
   * @param _tripId Id of the trip
   * @param _balanceTransferToOrFromRat Credits to transfer to or from rat
   * @param _itemsToRemoveFromRat Items to remove from rat (IDs)
   * @param _itemsToAddToRat Items to add to rat
   */
  function applyOutcome(
    bytes32 _ratId,
    bytes32 _tripId,
    int256 _balanceTransferToOrFromRat,
    bytes32[] calldata _itemsToRemoveFromRat,
    Item[] calldata _itemsToAddToRat
  ) public onlyAdmin {
    require(EntityType.get(_ratId) == ENTITY_TYPE.RAT, "not rat");
    require(Dead.get(_ratId) == false, "rat is dead");
    require(EntityType.get(_tripId) == ENTITY_TYPE.TRIP, "not trip");
    require(LibRat.getTotalRatValue(_ratId) >= LibTrip.getMinRatValueToEnter(_tripId), "rat value too low");

    // Check that trip is not depleted
    uint256 tripBalance = Balance.get(_tripId);
    require(tripBalance > 0, "no trip balance");

    // Increment visitor count
    VisitCount.set(_tripId, VisitCount.get(_tripId) + 1);

    // Increment trip count
    TripCount.set(_ratId, TripCount.get(_ratId) + 1);

    // Update last visit block
    LastVisitBlock.set(_tripId, block.number);

    // * * * * * * * * * * * * *
    // BUDGETING
    // * * * * * * * * * * * * *

    uint256 tripBudget = LibUtils.min(LibTrip.getMaxValuePerWin(_tripId), tripBalance);

    // * * * * * * * * * * * * *
    // ITEM REMOVAL
    // * * * * * * * * * * * * *

    // Remove items FIRST so their value is available for balance transfer
    // As items always have positive value, this will always increase the trip budget
    tripBudget = LibManager.removeItemsFromRat(tripBudget, _ratId, _tripId, _itemsToRemoveFromRat);

    // * * * * * * * * * * * * *
    // BALANCE TRANSFER
    // * * * * * * * * * * * * *

    // Balance transfer can have positive or negative value: effect on trip balance unknown
    tripBudget = LibManager.updateBalance(tripBudget, _ratId, _tripId, _balanceTransferToOrFromRat);

    // A rat is dead if balance is 0
    // If so, kill the rat and abort
    if (Balance.get(_ratId) == 0) {
      _killRat(_ratId, _tripId);
      return;
    }

    // * * * * * * * * * * * * *
    // ITEM ADDITION
    // * * * * * * * * * * * * *

    // As items always have positive value, this will always decrease the trip balance
    tripBudget = LibManager.addItemsToRat(tripBudget, _ratId, _tripId, _itemsToAddToRat);

    // If the trip is a challenge trip and the trip balance is 0, set the winner (player ID)
    if (ChallengeTrip.get(_tripId) && Balance.get(_tripId) == 0) {
      ChallengeWinner.set(_tripId, Owner.get(_ratId));
    }
  }

  /**
   * @notice Kill a rat
   * @param _ratId The id of the rat
   * @param _tripId The id of the trip
   */
  function _killRat(bytes32 _ratId, bytes32 _tripId) internal {
    uint256 balanceToTransfer = LibRat.killRat(_ratId);
    Balance.set(_tripId, Balance.get(_tripId) + balanceToTransfer);
    KillCount.set(_tripId, KillCount.get(_tripId) + 1);
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

  function setCooldownCloseTrip(uint32 _cooldownCloseTrip) public onlyAdmin {
    GameConfig.setCooldownCloseTrip(_cooldownCloseTrip);
  }

  function setRatsKilledForAdminAccess(uint32 _ratsKilledForAdminAccess) public onlyAdmin {
    GameConfig.setRatsKilledForAdminAccess(_ratsKilledForAdminAccess);
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

  function setTaxationCloseTrip(uint32 _taxationCloseTrip) public onlyAdmin {
    _checkPercentageValue(_taxationCloseTrip);
    GamePercentagesConfig.setTaxationCloseTrip(_taxationCloseTrip);
  }
}
