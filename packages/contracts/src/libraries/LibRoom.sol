// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { EntityType, RoomPrompt, Owner, RoomIndex, GameConfig, Balance } from "../codegen/index.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";
import { ROOM_CREATION_COST } from "../constants.sol";

library LibRoom {
  function createRoom(string memory roomPrompt) internal returns (bytes32 roomId) {
    roomId = getUniqueEntity();
    EntityType.set(roomId, ENTITY_TYPE.ROOM);
    RoomPrompt.set(roomId, roomPrompt);

    uint32 newRoomIndex = GameConfig.getGlobalRoomIndex() + 1;
    GameConfig.setGlobalRoomIndex(newRoomIndex);
    RoomIndex.set(roomId, newRoomIndex);

    // Add to room's balance
    Balance.set(roomId, ROOM_CREATION_COST);   
  }
}
