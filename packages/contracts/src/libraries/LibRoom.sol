// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { EntityType, RoomPrompt, RoomType, Owner, Index, GameConfig, Balance, Level } from "../codegen/index.sol";
import { ENTITY_TYPE, ROOM_TYPE } from "../codegen/common.sol";
import { ROOM_CREATION_COST } from "../constants.sol";

library LibRoom {
  /**
   * @notice Create a room
   * @param _roomPrompt The prompt for the room
   * @param _roomType The type of the room (one or two player)
   * @param _roomOwner Id of the owner of the room
   * @return roomId The id of the new room
   */
  function createRoom(
    string memory _roomPrompt,
    ROOM_TYPE _roomType,
    bytes32 _roomOwner
  ) internal returns (bytes32 roomId) {
    roomId = getUniqueEntity();
    EntityType.set(roomId, ENTITY_TYPE.ROOM);
    RoomPrompt.set(roomId, _roomPrompt);
    RoomType.set(roomId, _roomType);

    uint32 newRoomIndex = GameConfig.getGlobalRoomIndex() + 1;
    GameConfig.setGlobalRoomIndex(newRoomIndex);
    Index.set(roomId, newRoomIndex);
    Level.set(roomId, 1);
    Owner.set(roomId, _roomOwner);

    // Add to room's balance
    Balance.set(roomId, ROOM_CREATION_COST);
  }
}
