// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { GameConfig, EntityType, Balance, Dead, Health, Traits, Inventory, Owner, RatInRoom, WaitingInRoom } from "../codegen/index.sol";
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
   * @notice Place rat in room. Waiting for second rat.
   * @dev Only admin can call this function
   * @param _ratId Id of the rat
   * @param _roomId Id of the room
   */
  function placeRatInRoom(bytes32 _ratId, bytes32 _roomId) onlyAdmin public {
    require(EntityType.get(_ratId) == ENTITY_TYPE.RAT, "not rat");
    require(EntityType.get(_roomId) == ENTITY_TYPE.ROOM, "not room");
    require(Dead.get(_ratId) == false, "rat is dead");
    require(Balance.get(_roomId) >= 0, "no room balance");
    require(WaitingInRoom.get(_ratId) == bytes32(0), "rat already in other");
    require(RatInRoom.get(_roomId) == bytes32(0), "room occupied");

    RatInRoom.set(_roomId, _ratId);
    WaitingInRoom.set(_ratId, _roomId);
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
    ) onlyAdmin public {
    require(EntityType.get(_ratId) == ENTITY_TYPE.RAT, "not rat");
    require(Dead.get(_ratId) == false, "rat is dead");
    require(EntityType.get(_roomId) == ENTITY_TYPE.ROOM, "not room");
    require(Balance.get(_roomId) >= 0, "no room balance");

    // * * * * * * * * * * * * *
    // ROOM CREATOR PAYMENT
    // * * * * * * * * * * * * *
    
    bytes32 roomOwner = Owner.get(_roomId);
    // No fee to admin
    if(roomOwner != GameConfig.getAdminId()) {
      uint256 roomBalance = Balance.get(_roomId);
      uint256 feeToTransfer = roomBalance < CREATOR_FEE ? roomBalance : CREATOR_FEE;
      
      if (feeToTransfer > 0) {
        Balance.set(_roomId, roomBalance - feeToTransfer);
        Balance.set(roomOwner, Balance.get(roomOwner) + feeToTransfer);
      }
    }

    // * * * * * * * * * * * * *
    // HEALTH
    // * * * * * * * * * * * * *

    LibManager.updateHealth(_ratId, _roomId, _healthChange);

    // Exit early if dead
    if(Health.get(_ratId) == 0) {
      LibRat.killRat(_ratId, _roomId);
      // Reset
      RatInRoom.set(_roomId, bytes32(0));
      WaitingInRoom.set(_ratId, bytes32(0));
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
    // RESET
    // * * * * * * * * * * * * *

    RatInRoom.set(_roomId, bytes32(0));
    WaitingInRoom.set(_ratId, bytes32(0));
  }
}
