// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import {
  EntityType,
  Prompt,
  Owner,
  Index,
  GameConfig,
  Balance,
  Level,
  RoomCreationCost,
  VisitCount,
  CreationBlock
} from "../codegen/index.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

library LibRoom {
  /**
   * @notice Create a room
   * @param _prompt The prompt for the room
   * @param _roomOwner Id of the owner of the room
   * @param _roomLevel Id of the level that the room is on
   * @param _roomCreationCost The creation cost of the room
   * @return newRoomId The id of the new room
   */
  function createRoom(
    string memory _prompt,
    bytes32 _roomOwner,
    bytes32 _roomLevel,
    bytes32 _roomId,
    uint256 _roomCreationCost
  ) internal returns (bytes32 newRoomId) {
    // If _roomId is not provided, generate a new unique id
    if (_roomId == bytes32(0)) {
      newRoomId = getUniqueEntity();
    } else {
      newRoomId = _roomId;
    }

    EntityType.set(newRoomId, ENTITY_TYPE.ROOM);
    Prompt.set(newRoomId, _prompt);

    uint256 newRoomIndex = GameConfig.getGlobalRoomIndex() + 1;
    GameConfig.setGlobalRoomIndex(newRoomIndex);
    Index.set(newRoomId, newRoomIndex);
    CreationBlock.set(newRoomId, block.number);

    Level.set(newRoomId, _roomLevel);
    Owner.set(newRoomId, _roomOwner);
    VisitCount.set(newRoomId, 0);

    // Add to room's balance
    Balance.set(newRoomId, _roomCreationCost);
    RoomCreationCost.set(newRoomId, _roomCreationCost);
  }
}
