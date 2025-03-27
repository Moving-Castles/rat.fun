// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { GameConfig, Balance, Level, RoomCreationCost, LevelList } from "../codegen/index.sol";
import { LibRoom, LibUtils } from "../libraries/Libraries.sol";
import { MAX_ROOM_PROMPT_LENGTH } from "../constants.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

contract RoomSystem is System {
  /**
   * @notice Create a room
   * @param _roomName The name of the room
   * @param _roomPrompt The prompt for the room
   * @return roomId The id of the new room
   */
  function createRoom(string memory _roomName, string memory _roomPrompt) public returns (bytes32 roomId) {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());

    // TODO: Character count is not accurate due to UTF8 encoding
    // require(bytes(_roomPrompt).length > 0, "prompt too short");
    // require(bytes(_roomPrompt).length <= MAX_ROOM_PROMPT_LENGTH, "prompt too long");

    // TODO: What level is room created on?
    uint256 roomCreationCost = RoomCreationCost.get(LevelList.get()[0]);

    console.log(roomCreationCost);

    require(Balance.get(playerId) >= roomCreationCost, "balance too low");

    // Deduct from player's balance
    Balance.set(playerId, Balance.get(playerId) - roomCreationCost);

    // Create room
    roomId = LibRoom.createRoom(_roomName, _roomPrompt, playerId, LevelList.get()[0]);
  }
}
