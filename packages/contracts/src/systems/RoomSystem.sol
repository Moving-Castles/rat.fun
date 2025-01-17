// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { GameConfig, Balance, EntityType } from "../codegen/index.sol";
import { LibRoom, LibUtils } from "../libraries/Libraries.sol";
import { ROOM_CREATION_COST } from "../constants.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

contract RoomSystem is System {
  function createRoom(string memory roomPrompt) public returns (bytes32 roomId) {

    // TODO: Limit prompt length
    
    // Admin creates rooms for free
    if(_msgSender() == GameConfig.getAdminAddress()) {
      roomId = LibRoom.createRoom(roomPrompt);
    } else {
      bytes32 playerEntity = LibUtils.addressToEntityKey(_msgSender());

      require(Balance.get(playerEntity) > ROOM_CREATION_COST, "balance too low");

      // Deduct from player's balance
      Balance.set(playerEntity, Balance.get(playerEntity) - ROOM_CREATION_COST);

      // Create room
      roomId = LibRoom.createRoom(roomPrompt);
    }
  }

  function changeRoomBalance(bytes32 roomId, uint256 change, bool negative) public {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
    require(EntityType.get(roomId) == ENTITY_TYPE.ROOM, "not a room");

      if(negative) {
        Balance.set(roomId, LibUtils.safeSubtract(Balance.get(roomId), change));
      } else {
        Balance.set(roomId, Balance.get(roomId) + change);
      }
  }
}