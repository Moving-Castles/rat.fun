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
   * @dev Modifier to restrict access to admin only
   */
  modifier onlyAdmin() {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
    _;
  }

  /**
   * @notice Create a room
   * @dev Only admin can call this function
   * @param playerId The id of the player creating the room
   * @param _roomName The name of the room
   * @param _roomPrompt The prompt for the room
   * @return roomId The id of the new room
   */
  function createRoom(
    bytes32 playerId,
    string memory _roomName,
    string memory _roomPrompt
  ) public onlyAdmin returns (bytes32 roomId) {
    // TODO: What level is room created on?
    // Currently hardcoded to level 0
    bytes32 levelId = LevelList.get()[0];

    uint256 roomCreationCost = RoomCreationCost.get(levelId);

    require(Balance.get(playerId) >= roomCreationCost, "balance too low");

    // Deduct from player's balance
    Balance.set(playerId, Balance.get(playerId) - roomCreationCost);

    // Create room
    roomId = LibRoom.createRoom(_roomName, _roomPrompt, playerId, levelId);
  }
}
