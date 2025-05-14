// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { Dead, Health, Balance, Inventory, Traits, Value, Level, VisitedLevels, LevelMinBalance, LevelMaxBalance, LevelList, Index, Owner } from "../codegen/index.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";
import { LibUtils } from "./LibUtils.sol";
import { LibItem } from "./LibItem.sol";
import { LibTrait } from "./LibTrait.sol";
import { LibRat } from "./LibRat.sol";
import { Item } from "../structs.sol";
import { MAX_INVENTORY_SIZE, MAX_TRAITS_SIZE } from "../constants.sol";

library LibManager {
  /**
   * @notice Increase or decrease the health of a rat
   * @dev Used by the Manager system to apply changes to a rat after room events
   * @param _ratId Id of the rat
   * @param _roomId Id of the room
   * @param _healthChange Health change to apply to the rat
   */
  function updateHealth(bytes32 _ratId, bytes32 _roomId, int256 _healthChange) internal {
    // - - - - - - - - -
    // Changes to rat health is connected to room blance:
    // - If rat health goes up, room balance goes down
    // - If rat health goes down, room balance goes up
    // - - - - - - - - -
    // Caveats:
    // - Room can not give more health than it has balance
    // - Rat can not give more balance than it has health
    // - - - - - - - - -
    // If the rat's health goes to 0 it is dead
    // - - - - - - - - -

    // If health change is 0, exit early
    if (_healthChange == 0) {
      return;
    }

    // Absolute value of health change
    uint256 healthChangeAmount = LibUtils.signedToUnsigned(_healthChange);
    uint256 oldRatHealth = Health.get(_ratId);
    uint256 oldRoomBalance = Balance.get(_roomId);

    if (_healthChange < 0) {
      // __ Negative health change

      // Reduce rat health
      Health.set(_ratId, LibUtils.safeSubtract(oldRatHealth, healthChangeAmount));

      // Increase room balance
      Balance.set(_roomId, oldRoomBalance + LibUtils.clamp(oldRatHealth, healthChangeAmount));
    } else {
      // __ Positive health change

      // Dont give the rat more health than the room has balance
      Health.set(_ratId, oldRatHealth + LibUtils.clamp(healthChangeAmount, oldRoomBalance));

      Balance.set(_roomId, LibUtils.safeSubtract(oldRoomBalance, healthChangeAmount));
    }
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
    // Value of traits is connected to room blance:
    // - If a trait with negative value is removed, room balance goes down
    // - If a trait with positive value is removed, room balance goes up
    // Caveats:
    // - Room can not remove traits with negative value if it does not have the balance to cover it
    // - - - - - - - - -

    // If list is empty, exit early
    if (_traitsToRemoveFromRat.length == 0) {
      return;
    }

    for (uint i = 0; i < _traitsToRemoveFromRat.length; i++) {
      bytes32 traitId = _traitsToRemoveFromRat[i];
      uint256 traitValueAmount = LibUtils.signedToUnsigned(Value.get(traitId));

      if (Value.get(traitId) <= 0) {
        // Trait value is negative (or 0), make sure room has enough balance to cover it
        if (Balance.get(_roomId) >= traitValueAmount) {
          // If so, remove value from room balance
          Balance.set(_roomId, LibUtils.safeSubtract(Balance.get(_roomId), traitValueAmount));
          // Remove trait from rat
          Traits.set(_ratId, LibUtils.removeFromArray(Traits.get(_ratId), traitId));
        }
      } else {
        // Trait value is positive, add value to room balance
        Balance.set(_roomId, Balance.get(_roomId) + traitValueAmount);
        // Remove trait from rat
        Traits.set(_ratId, LibUtils.removeFromArray(Traits.get(_ratId), traitId));
      }
    }
  }

  /**
   * @notice Add traits to rat
   * @dev Used by the Manager system to apply changes to a rat after room events
   * @param _ratId Id of the rat
   * @param _roomId Id of the room
   * @param _traitsToAddToRat Information about traits to add to rat
   */
  function addTraitsToRat(bytes32 _ratId, bytes32 _roomId, Item[] calldata _traitsToAddToRat) internal {
    // - - - - - - - - -
    // Function adds traits to rat
    // - - - - - - - - -
    // Value of traits is connected to room blance:
    // - If a trait with negative value is added, room balance goes up
    // - If a trait with positive value is added, room balance goes down
    // Caveats:
    // - Room can not add traits with positive value if it does not have the balance to cover it
    // - A rat can have a maximum of 5 traits
    // - - - - - - - - -

    // If list is empty, exit early
    if (_traitsToAddToRat.length == 0) {
      return;
    }

    for (uint i = 0; i < _traitsToAddToRat.length; i++) {
      // Abort if traits are full
      if (Traits.length(_ratId) >= MAX_TRAITS_SIZE) {
        return;
      }

      Item calldata newTrait = _traitsToAddToRat[i];
      uint256 traitValueAmount = LibUtils.signedToUnsigned(newTrait.value);

      if (newTrait.value <= 0) {
        // Trait value is negative (or 0), add value to room balance
        Balance.set(_roomId, Balance.get(_roomId) + traitValueAmount);
        // Create trait and add it to the rat
        Traits.push(_ratId, LibTrait.createTrait(newTrait));
      } else {
        // Trait value is positive, make sure room has enough balance to cover it
        if (Balance.get(_roomId) >= traitValueAmount) {
          // If so, remove value from room balance
          Balance.set(_roomId, LibUtils.safeSubtract(Balance.get(_roomId), traitValueAmount));
          // Create trait and add it to the rat
          Traits.push(_ratId, LibTrait.createTrait(newTrait));
        }
      }
    }
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
      uint256 itemValueAmount = LibUtils.signedToUnsigned(Value.get(itemId));
      // Add value to room balance
      Balance.set(_roomId, Balance.get(_roomId) + itemValueAmount);
      // Remove item from rat
      Inventory.set(_ratId, LibUtils.removeFromArray(Inventory.get(_ratId), itemId));
    }
  }

  /**
   * @notice Add items to rat inventory
   * @dev Used by the Manager system to apply changes to a rat after room events
   * @param _ratId Id of the rat
   * @param _roomId Id of the room
   * @param _itemsToAddToRat Information of items to add to rat
   */
  function addItemsToRat(bytes32 _ratId, bytes32 _roomId, Item[] calldata _itemsToAddToRat) internal {
    // - - - - - - - - -
    // Function adds items to rat
    // - - - - - - - - -
    // Value of item is always positive.
    // Adding an item subtracts the value from the room balance
    // Caveats:
    // - A rat can have a maximum of 5 items in inventory
    // - - - - - - - - -

    // If list is empty, exit early
    if (_itemsToAddToRat.length == 0) {
      return;
    }

    for (uint i = 0; i < _itemsToAddToRat.length; i++) {
      // Abort if inventory is full
      if (Inventory.length(_ratId) >= MAX_INVENTORY_SIZE) {
        return;
      }

      Item calldata newItem = _itemsToAddToRat[i];
      uint256 itemValueAmount = LibUtils.signedToUnsigned(newItem.value);

      // Make sure room has enough balance to cover it
      if (Balance.get(_roomId) >= itemValueAmount) {
        // If so, remove value from room balance
        Balance.set(_roomId, LibUtils.safeSubtract(Balance.get(_roomId), itemValueAmount));
        // Create item and add it to the rat
        Inventory.push(_ratId, LibItem.createItem(newItem));
      }
    }
  }

  /**
   * @notice Update the balance of the rat
   * @dev Used by the Manager system to apply changes to a rat after room events
   * @param _ratId Id of the rat
   * @param _roomId Id of the room
   * @param _value Value to transfer to or from the rat's blance
   */
  function updateBalance(bytes32 _ratId, bytes32 _roomId, int256 _value) internal {
    // - - - - - - - - -
    // Function transfers balance between rat and room
    // - - - - - - - - -
    // Caveats:
    // - Room can not give more credits than it has balance
    // - Rat can not give more credits than it has balance
    // - - - - - - - - -

    // If value is 0, exit early
    if (_value == 0) {
      return;
    }

    // Absolute value of value transfer
    uint256 valueAmount = LibUtils.signedToUnsigned(_value);
    uint256 oldRoomBalance = Balance.get(_roomId);
    uint256 oldRatBalance = Balance.get(_ratId);

    if (_value > 0) {
      // __ From room to rat

      // Add balance to rat
      Balance.set(_ratId, oldRatBalance + LibUtils.clamp(valueAmount, oldRoomBalance));

      // Subtract balance from room
      Balance.set(_roomId, LibUtils.safeSubtract(oldRoomBalance, valueAmount));
    } else {
      // __ From rat to room

      // Subtract balance from rat
      Balance.set(_ratId, LibUtils.safeSubtract(oldRatBalance, valueAmount));

      // Add balance to room
      Balance.set(_roomId, oldRoomBalance + LibUtils.clamp(valueAmount, oldRatBalance));
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

    // On change, add level to visited levels
    if (newLevelId != currentLevelId) {
      bytes32 playerId = Owner.get(_ratId);
      if (!LibUtils.arrayIncludes(VisitedLevels.get(playerId), newLevelId)) {
        VisitedLevels.push(playerId, newLevelId);
      }
    }
  }
}
