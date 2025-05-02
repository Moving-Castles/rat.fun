// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { GenericBalance } from "../codegen/index.sol";
import { LibUtils } from "./LibUtils.sol";

library LibGenericBalance {
  /**
   * @notice Move value between two entities' generic balances
   * @param _ratTableId Id of the rat's table to update, e.g. `Health._tableId`
   * @param _roomTableId Id of the room's table to update, e.g. `Balance._tableId`
   * @param _ratId Id of the rat
   * @param _roomId Id of the room
   * @param _value Value to transfer to or from the rat's blance
   */
  function updateGenericBalance(
    ResourceId _ratTableId,
    ResourceId _roomTableId,
    bytes32 _ratId,
    bytes32 _roomId,
    int256 _value
  ) internal {
    // If value change is 0, exit early
    if (_value == 0) {
      return;
    }

    // Absolute value of balance transfer
    uint256 absValue = LibUtils.signedToUnsigned(_value);
    uint256 oldRatBalance = GenericBalance.get(_ratTableId, _ratId);
    uint256 oldRoomBalance = GenericBalance.get(_roomTableId, _roomId);

    if (_value < 0) {
      // __ From rat balance to room balance

      // Rat's old balance limits value transfer
      uint256 valueChangeAmount = LibUtils.min(oldRatBalance, absValue);

      // Reduce rat balance
      GenericBalance.set(_ratTableId, _ratId, oldRatBalance - valueChangeAmount);

      // Increase room balance
      GenericBalance.set(_roomTableId, _roomId, oldRoomBalance + valueChangeAmount);
    } else {
      // __ From room balance to rat balance

      // Room's old balance limits value transfer
      uint256 valueChangeAmount = LibUtils.min(oldRoomBalance, absValue);

      // Increase rat balance
      GenericBalance.set(_ratTableId, _ratId, oldRatBalance + valueChangeAmount);

      // Reduce room balance
      GenericBalance.set(_roomTableId, _roomId, oldRoomBalance - valueChangeAmount);
    }
  }
}
