// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import {
  EntityType,
  Prompt,
  Owner,
  Index,
  GamePercentagesConfig,
  WorldStats,
  Balance,
  RoomCreationCost,
  VisitCount,
  CreationBlock
} from "../codegen/index.sol";
import { LibUtils } from "./LibUtils.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

library LibRoom {
  /**
   * @notice Create a room
   * @param _prompt The prompt for the room
   * @param _roomOwner Id of the owner of the room
   * @param _roomCreationCost The creation cost of the room
   * @return newRoomId The id of the new room
   */
  function createRoom(
    bytes32 _roomOwner,
    bytes32 _roomId,
    uint256 _roomCreationCost,
    string memory _prompt
  ) internal returns (bytes32 newRoomId) {
    // If _roomId is not provided, generate a new unique id
    if (_roomId == bytes32(0)) {
      newRoomId = getUniqueEntity();
    } else {
      newRoomId = _roomId;
    }

    Owner.set(newRoomId, _roomOwner);

    EntityType.set(newRoomId, ENTITY_TYPE.ROOM);
    Prompt.set(newRoomId, _prompt);

    uint256 newRoomIndex = WorldStats.getGlobalRoomIndex() + 1;
    WorldStats.setGlobalRoomIndex(newRoomIndex);
    Index.set(newRoomId, newRoomIndex);
    CreationBlock.set(newRoomId, block.number);

    VisitCount.set(newRoomId, 0);

    Balance.set(newRoomId, _roomCreationCost);
    RoomCreationCost.set(newRoomId, _roomCreationCost);
  }

  function getMaxValuePerWin(bytes32 _roomId) internal view returns (uint256) {
    uint256 balance = Balance.get(_roomId);
    // Use balance or creation cost, whichever is higher
    uint256 costBalanceMax = LibUtils.max(RoomCreationCost.get(_roomId), balance);
    // Multiply by the configured percentage
    uint256 result = (GamePercentagesConfig.getMaxValuePerWin() * costBalanceMax) / 100;
    // Cap to balance
    return LibUtils.min(result, balance);
  }

  function getMinRatValueToEnter(bytes32 _roomId) internal view returns (uint256) {
    return (GamePercentagesConfig.getMinRatValueToEnter() * RoomCreationCost.get(_roomId)) / 100;
  }
}
