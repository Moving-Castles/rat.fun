// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import {
  Dead,
  Balance,
  Inventory,
  Traits,
  Value,
  Level,
  AchievedLevels,
  LevelMinBalance,
  LevelMaxBalance,
  LevelList,
  Index,
  Owner
} from "../codegen/index.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";
import { LibUtils } from "./LibUtils.sol";
import { LibItem } from "./LibItem.sol";
import { LibTrait } from "./LibTrait.sol";
import { LibRat } from "./LibRat.sol";
import { Item } from "../structs.sol";
import { MAX_INVENTORY_SIZE, MAX_TRAITS_SIZE } from "../constants.sol";

library LibManager {
  /**
   * @notice Update the balance of the rat
   * @dev Used by the Manager system to apply changes to a rat after room events
   * @param _ratId Id of the rat
   * @param _roomId Id of the room
   * @param _roomBudget The budget of the room
   * @param _value Value to transfer to or from the rat's blance
   */
  function updateBalance(
    uint256 _roomBudget,
    bytes32 _ratId,
    bytes32 _roomId,
    int256 _value
  ) internal returns (uint256) {
    // - - - - - - - - -
    // Function transfers balance between rat and room
    // - - - - - - - - -
    // Caveats:
    // - Room can not give more credits than it has available budget
    // - Rat can not give more credits than it has balance
    // - - - - - - - - -

    // If value is 0, exit early
    if (_value == 0) {
      return _roomBudget;
    }

    // Absolute value of balance transfer
    uint256 balanceChangeAmount = LibUtils.signedToUnsigned(_value);
    uint256 oldRoomBalance = Balance.get(_roomId);
    uint256 oldRatBalance = Balance.get(_ratId);

    if (_value < 0) {
      // __ From rat balance to room balance

      // Rat's old balance limits value transfer
      uint256 valueChangeAmount = LibUtils.min(oldRatBalance, balanceChangeAmount);

      // Reduce rat balance
      Balance.set(_ratId, oldRatBalance - valueChangeAmount);

      // Increase room balance
      Balance.set(_roomId, oldRoomBalance + valueChangeAmount);
    } else {
      // __ From room balance to rat balance

      // Room's available budget limits value transfer
      uint256 valueChangeAmount = LibUtils.min(_roomBudget, balanceChangeAmount);

      // Add balance to rat
      Balance.set(_ratId, oldRatBalance + valueChangeAmount);

      // Subtract balance from room
      Balance.set(_roomId, oldRoomBalance - valueChangeAmount);

      // Reduce the available budget
      _roomBudget = _roomBudget - valueChangeAmount;
    }

    return _roomBudget;
  }

  /**
   * @notice Remove traits from rat
   * @dev Used by the Manager system to apply changes to a rat after room events
   * @param _ratId Id of the rat
   * @param _roomId Id of the room
   * @param _traitsToRemoveFromRat Ids of traits to remove from rat
   */
  function removeTraitsFromRat(bytes32 _ratId, bytes32 _roomId, bytes32[] calldata _traitsToRemoveFromRat) internal {
    // - - - - - - - - -
    // Function removes traits from rat
    // - - - - - - - - -
    // Value of trait is always positive.
    // Removing a trait adds the value to the room balance
    // - - - - - - - - -

    // If list is empty, exit early
    if (_traitsToRemoveFromRat.length == 0) {
      return;
    }

    for (uint i = 0; i < _traitsToRemoveFromRat.length; i++) {
      bytes32 traitId = _traitsToRemoveFromRat[i];
      // Trait value is positive, add value to room balance
      Balance.set(_roomId, Balance.get(_roomId) + Value.get(traitId));
      // Remove trait from rat
      Traits.set(_ratId, LibUtils.removeFromArray(Traits.get(_ratId), traitId));
    }
  }

  /**
   * @notice Add traits to rat
   * @dev Used by the Manager system to apply changes to a rat after room events
   * @param _ratId Id of the rat
   * @param _roomId Id of the room
   * @param _roomBudget The budget of the room
   * @param _traitsToAddToRat Information about traits to add to rat
   */
  function addTraitsToRat(
    uint256 _roomBudget,
    bytes32 _ratId,
    bytes32 _roomId,
    Item[] calldata _traitsToAddToRat
  ) internal returns (uint256) {
    // - - - - - - - - -
    // Function adds traits to rat
    // - - - - - - - - -
    // Value of item is always positive.
    // Adding an item subtracts the value from the room balance
    // Caveats:
    // - Room can not add traits with positive value if it does not have the available budget to cover it
    // - A rat can have a maximum of 5 traits
    // - - - - - - - - -

    // If list is empty, exit early
    if (_traitsToAddToRat.length == 0) {
      return _roomBudget;
    }

    for (uint i = 0; i < _traitsToAddToRat.length; i++) {
      // Abort if traits are full
      if (Traits.length(_ratId) >= MAX_TRAITS_SIZE) {
        return _roomBudget;
      }

      Item calldata newTrait = _traitsToAddToRat[i];

      // Trait value is positive, make sure room has enough available budget to cover it
      if (_roomBudget >= newTrait.value) {
        // If so, remove value from room balance
        Balance.set(_roomId, LibUtils.safeSubtract(Balance.get(_roomId), newTrait.value));
        // Reduce the available budget
        _roomBudget = _roomBudget - newTrait.value;
        // Create trait and add it to the rat
        Traits.push(_ratId, LibTrait.createTrait(newTrait));
      }
    }

    return _roomBudget;
  }

  /**
   * @notice Add items to rat inventory
   * @dev Used by the Manager system to apply changes to a rat after room events
   * @param _ratId Id of the rat
   * @param _roomId Id of the room
   * @param _roomBudget The budget of the room
   * @param _itemsToAddToRat Information of items to add to rat
   */
  function addItemsToRat(
    uint256 _roomBudget,
    bytes32 _ratId,
    bytes32 _roomId,
    Item[] calldata _itemsToAddToRat
  ) internal returns (uint256) {
    // - - - - - - - - -
    // Function adds items to rat
    // - - - - - - - - -
    // Value of item is always positive.
    // Adding an item subtracts the value from the room balance
    // Caveats:
    // - Room can not add an item if it does not have the available budget to cover it
    // - A rat can have a maximum of 5 items in inventory
    // - - - - - - - - -

    // If list is empty, exit early
    if (_itemsToAddToRat.length == 0) {
      return _roomBudget;
    }

    for (uint i = 0; i < _itemsToAddToRat.length; i++) {
      // Abort if inventory is full
      if (Inventory.length(_ratId) >= MAX_INVENTORY_SIZE) {
        return _roomBudget;
      }

      Item calldata newItem = _itemsToAddToRat[i];

      // Make sure room has enough available budget to cover it
      if (_roomBudget >= newItem.value) {
        // If so, remove value from room balance
        Balance.set(_roomId, LibUtils.safeSubtract(Balance.get(_roomId), newItem.value));
        // Reduce the available budget
        _roomBudget = _roomBudget - newItem.value;
        // Create item and add it to the rat
        Inventory.push(_ratId, LibItem.createItem(newItem));
      }
    }

    return _roomBudget;
  }

  /**
   * @notice Remove items from rat's inventory
   * @dev Used by the Manager system to apply changes to a rat after room events
   * @param _ratId Id of the rat
   * @param _roomId Id of the room
   * @param _itemsToRemoveFromRat Ids of items to remove from rat
   */
  function removeItemsFromRat(bytes32 _ratId, bytes32 _roomId, bytes32[] calldata _itemsToRemoveFromRat) internal {
    // - - - - - - - - -
    // Function removes items from rat
    // - - - - - - - - -
    // Value of item is always positive.
    // Removing an item adds the value to the room balance
    // - - - - - - - - -

    // If list is empty, exit early
    if (_itemsToRemoveFromRat.length == 0) {
      return;
    }

    for (uint i = 0; i < _itemsToRemoveFromRat.length; i++) {
      bytes32 itemId = _itemsToRemoveFromRat[i];
      uint256 itemValueAmount = Value.get(itemId);
      // Add value to room balance
      Balance.set(_roomId, Balance.get(_roomId) + itemValueAmount);
      // Remove item from rat
      Inventory.set(_ratId, LibUtils.removeFromArray(Inventory.get(_ratId), itemId));
    }
  }

  /**
   * @notice Check if the rat should level up or down
   * @dev Used by the Manager system to apply changes to a rat after room events
   * @param _ratId Id of the rat
   */
  function checkLevelChange(bytes32 _ratId) internal {
    // Get the total value of the rat
    uint256 totalRatValue = LibRat.getTotalRatValue(_ratId);

    // Get the level of the rat
    bytes32 currentLevelId = Level.get(_ratId);
    uint256 currentLevelIndex = Index.get(currentLevelId);
    bytes32 newLevelId = currentLevelId;

    // Check if the rat is below the min balance
    if (totalRatValue < LevelMinBalance.get(currentLevelId) && currentLevelIndex > 0) {
      // Level down if we are not at the lowest level
      newLevelId = LevelList.getItem(currentLevelIndex - 1);
      Level.set(_ratId, newLevelId);
    }

    // Check if the rat is above the max balance
    if (totalRatValue >= LevelMaxBalance.get(currentLevelId) && currentLevelIndex < LevelList.length() - 1) {
      // Level up if we are not at the highest level
      newLevelId = LevelList.getItem(currentLevelIndex + 1);
      Level.set(_ratId, newLevelId);
    }

    // On change, add level to achieved levels
    if (newLevelId != currentLevelId) {
      bytes32 playerId = Owner.get(_ratId);
      if (!LibUtils.arrayIncludes(AchievedLevels.get(playerId), newLevelId)) {
        AchievedLevels.push(playerId, newLevelId);
      }
    }
  }
}
