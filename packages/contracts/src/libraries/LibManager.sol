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

      // Increase the available budget
      _roomBudget = _roomBudget + valueChangeAmount;
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
   * @notice Add items to rat inventory
   * @dev Used by the Manager system to apply changes to a rat after room events
   * @param _roomBudget The budget of the room
   * @param _ratId Id of the rat
   * @param _roomId Id of the room
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
   * @param _roomBudget The budget of the room
   * @param _ratId Id of the rat
   * @param _roomId Id of the room
   * @param _itemsToRemoveFromRat Ids of items to remove from rat
   */
  function removeItemsFromRat(
    uint256 _roomBudget,
    bytes32 _ratId,
    bytes32 _roomId,
    bytes32[] calldata _itemsToRemoveFromRat
  ) internal returns (uint256) {
    // - - - - - - - - -
    // Function removes items from rat
    // - - - - - - - - -
    // Value of item is always positive.
    // Removing an item adds the value to the room balance
    // - - - - - - - - -

    // If list is empty, exit early
    if (_itemsToRemoveFromRat.length == 0) {
      return _roomBudget;
    }

    for (uint i = 0; i < _itemsToRemoveFromRat.length; i++) {
      bytes32 itemId = _itemsToRemoveFromRat[i];
      uint256 itemValueAmount = Value.get(itemId);
      // Add value to room balance
      Balance.set(_roomId, Balance.get(_roomId) + itemValueAmount);
      // Increase the available budget
      _roomBudget = _roomBudget + itemValueAmount;
      // Remove item from rat
      Inventory.set(_ratId, LibUtils.removeFromArray(Inventory.get(_ratId), itemId));
    }

    return _roomBudget;
  }
}
