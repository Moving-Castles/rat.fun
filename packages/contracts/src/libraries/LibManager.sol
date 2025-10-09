// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { Dead, Balance, Inventory, Value, Index, Owner } from "../codegen/index.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";
import { LibUtils } from "./LibUtils.sol";
import { LibItem } from "./LibItem.sol";
import { LibRat } from "./LibRat.sol";
import { Item } from "../structs.sol";
import { MAX_INVENTORY_SIZE } from "../constants.sol";

library LibManager {
  /**
   * @notice Update the balance of the rat
   * @dev Used by the Manager system to apply changes to a rat after trip events
   * @param _ratId Id of the rat
   * @param _tripId Id of the trip
   * @param _tripBudget The budget of the trip
   * @param _value Value to transfer to or from the rat's blance
   */
  function updateBalance(
    uint256 _tripBudget,
    bytes32 _ratId,
    bytes32 _tripId,
    int256 _value
  ) internal returns (uint256) {
    // - - - - - - - - -
    // Function transfers balance between rat and trip
    // - - - - - - - - -
    // Caveats:
    // - Trip can not give more credits than it has available budget
    // - Rat can not give more credits than it has balance
    // - - - - - - - - -

    // If value is 0, exit early
    if (_value == 0) {
      return _tripBudget;
    }

    // Absolute value of balance transfer
    uint256 balanceChangeAmount = LibUtils.signedToUnsigned(_value);
    uint256 oldTripBalance = Balance.get(_tripId);
    uint256 oldRatBalance = Balance.get(_ratId);

    if (_value < 0) {
      // __ From rat balance to trip balance

      // Rat's old balance limits value transfer
      uint256 valueChangeAmount = LibUtils.min(oldRatBalance, balanceChangeAmount);

      // Reduce rat balance
      Balance.set(_ratId, oldRatBalance - valueChangeAmount);

      // Increase trip balance
      Balance.set(_tripId, oldTripBalance + valueChangeAmount);

      // Increase the available budget
      _tripBudget = _tripBudget + valueChangeAmount;
    } else {
      // __ From trip balance to rat balance

      // Trip's available budget limits value transfer
      uint256 valueChangeAmount = LibUtils.min(_tripBudget, balanceChangeAmount);

      // Add balance to rat
      Balance.set(_ratId, oldRatBalance + valueChangeAmount);

      // Subtract balance from trip
      Balance.set(_tripId, oldTripBalance - valueChangeAmount);

      // Reduce the available budget
      _tripBudget = _tripBudget - valueChangeAmount;
    }

    return _tripBudget;
  }

  /**
   * @notice Add items to rat inventory
   * @dev Used by the Manager system to apply changes to a rat after trip events
   * @param _tripBudget The budget of the trip
   * @param _ratId Id of the rat
   * @param _tripId Id of the trip
   * @param _itemsToAddToRat Information of items to add to rat
   */
  function addItemsToRat(
    uint256 _tripBudget,
    bytes32 _ratId,
    bytes32 _tripId,
    Item[] calldata _itemsToAddToRat
  ) internal returns (uint256) {
    // - - - - - - - - -
    // Function adds items to rat
    // - - - - - - - - -
    // Value of item is always positive.
    // Adding an item subtracts the value from the trip balance
    // Caveats:
    // - Trip can not add an item if it does not have the available budget to cover it
    // - A rat can have a maximum of 5 items in inventory
    // - - - - - - - - -

    // If list is empty, exit early
    if (_itemsToAddToRat.length == 0) {
      return _tripBudget;
    }

    for (uint i = 0; i < _itemsToAddToRat.length; i++) {
      // Abort if inventory is full
      if (Inventory.length(_ratId) >= MAX_INVENTORY_SIZE) {
        return _tripBudget;
      }

      Item calldata newItem = _itemsToAddToRat[i];

      // Make sure trip has enough available budget to cover it
      if (_tripBudget >= newItem.value) {
        // If so, remove value from trip balance
        Balance.set(_tripId, LibUtils.safeSubtract(Balance.get(_tripId), newItem.value));
        // Reduce the available budget
        _tripBudget = _tripBudget - newItem.value;
        // Create item and add it to the rat
        Inventory.push(_ratId, LibItem.createItem(newItem));
      }
    }

    return _tripBudget;
  }

  /**
   * @notice Remove items from rat's inventory
   * @dev Used by the Manager system to apply changes to a rat after trip events
   * @param _tripBudget The budget of the trip
   * @param _ratId Id of the rat
   * @param _tripId Id of the trip
   * @param _itemsToRemoveFromRat Ids of items to remove from rat
   */
  function removeItemsFromRat(
    uint256 _tripBudget,
    bytes32 _ratId,
    bytes32 _tripId,
    bytes32[] calldata _itemsToRemoveFromRat
  ) internal returns (uint256) {
    // - - - - - - - - -
    // Function removes items from rat
    // - - - - - - - - -
    // Value of item is always positive.
    // Removing an item adds the value to the trip balance
    // - - - - - - - - -

    // If list is empty, exit early
    if (_itemsToRemoveFromRat.length == 0) {
      return _tripBudget;
    }

    for (uint i = 0; i < _itemsToRemoveFromRat.length; i++) {
      bytes32 itemId = _itemsToRemoveFromRat[i];
      uint256 itemValueAmount = Value.get(itemId);
      // Add value to trip balance
      Balance.set(_tripId, Balance.get(_tripId) + itemValueAmount);
      // Increase the available budget
      _tripBudget = _tripBudget + itemValueAmount;
      // Remove item from rat
      Inventory.set(_ratId, LibUtils.removeFromArray(Inventory.get(_ratId), itemId));
    }

    return _tripBudget;
  }
}
