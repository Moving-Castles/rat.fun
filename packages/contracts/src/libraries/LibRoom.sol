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
   * @return newRoomId The id of the new room
   */
  function createRoom(
    string memory _roomName,
    string memory _roomPrompt,
    bytes32 _roomOwner,
    bytes32 _roomLevel,
    bytes32 _roomId
  ) internal returns (bytes32 newRoomId) {
    // If _roomId is not provided, generate a new unique id
    if (_roomId == bytes32(0)) {
      newRoomId = getUniqueEntity();
    } else {
      newRoomId = _roomId;
    }

    EntityType.set(newRoomId, ENTITY_TYPE.ROOM);
    RoomPrompt.set(newRoomId, _roomPrompt);
    Name.set(newRoomId, _roomName);

    uint256 newRoomIndex = GameConfig.getGlobalRoomIndex() + 1;
    GameConfig.setGlobalRoomIndex(newRoomIndex);
    Index.set(newRoomId, newRoomIndex);
    CreationBlock.set(newRoomId, block.number);

    Level.set(newRoomId, _roomLevel);
    Owner.set(newRoomId, _roomOwner);
    VisitCount.set(newRoomId, 0);

    // Add to room's balance
    Balance.set(newRoomId, RoomCreationCost.get(_roomLevel));
  }

  /**
   * @notice Destroy a room
   * @param _roomId The id of the room
   */
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
