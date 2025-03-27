// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { EntityType, RoomPrompt, Owner, Index, GameConfig, Balance, Level, RoomCreationCost, Name, VisitCount, CreationBlock } from "../codegen/index.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

library LibRoom {
  /**
   * @notice Create a room
   * @param _roomName The name of the room
   * @param _roomPrompt The prompt for the room
   * @param _roomOwner Id of the owner of the room
   * @param _roomLevel Id of the level that the room is on
   * @return roomId The id of the new room
   */
  function createRoom(
    string memory _roomName,
    string memory _roomPrompt,
    bytes32 _roomOwner,
    bytes32 _roomLevel
  ) internal returns (bytes32 roomId) {
    roomId = getUniqueEntity();
    EntityType.set(roomId, ENTITY_TYPE.ROOM);
    RoomPrompt.set(roomId, _roomPrompt);
    Name.set(roomId, _roomName);

    uint32 newRoomIndex = GameConfig.getGlobalRoomIndex() + 1;
    GameConfig.setGlobalRoomIndex(newRoomIndex);
    Index.set(roomId, newRoomIndex);
    CreationBlock.set(roomId, block.number);

    Level.set(roomId, _roomLevel);
    Owner.set(roomId, _roomOwner);
    VisitCount.set(roomId, 0);

    // Add to room's balance
    Balance.set(roomId, RoomCreationCost.get(_roomLevel));
  }

  function destroyRoom(bytes32 _roomId) internal {
    EntityType.deleteRecord(_roomId);
    RoomPrompt.deleteRecord(_roomId);
    Name.deleteRecord(_roomId);
    Index.deleteRecord(_roomId);
    Level.deleteRecord(_roomId);
    Owner.deleteRecord(_roomId);
    VisitCount.deleteRecord(_roomId);
  }
}
