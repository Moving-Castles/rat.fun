// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { GameConfig, Balance, Level, RoomCreationCost } from "../codegen/index.sol";
import { LibRoom, LibUtils } from "../libraries/Libraries.sol";
import { MAX_ROOM_PROMPT_LENGTH } from "../constants.sol";
import { ENTITY_TYPE, ROOM_TYPE } from "../codegen/common.sol";

contract RoomSystem is System {
  /**
   * @notice Create a room
   * @param _roomPrompt The prompt for the room
   * @param _roomType The type of room (one or two player)
   * @return roomId The id of the new room
   */
  function createRoom(string memory _roomPrompt, ROOM_TYPE _roomType) public returns (bytes32 roomId) {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());

    // TODO: Character count is not accurate due to UTF8 encoding
    // require(bytes(_roomPrompt).length > 0, "prompt too short");
    // require(bytes(_roomPrompt).length <= MAX_ROOM_PROMPT_LENGTH, "prompt too long");

    console.logBytes32(Level.get(playerId));

    uint256 roomCreationCost = RoomCreationCost.get(Level.get(playerId));

    console.log(roomCreationCost);

    require(Balance.get(playerId) >= roomCreationCost, "balance too low");

    // Deduct from player's balance
    Balance.set(playerId, Balance.get(playerId) - roomCreationCost);

    // Create room
    roomId = LibRoom.createRoom(_roomPrompt, _roomType, playerId, Level.get(playerId));

    console.logBytes32(roomId);
  }
}
