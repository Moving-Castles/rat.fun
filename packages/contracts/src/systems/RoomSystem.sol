// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { GameConfig, Balance, EntityType } from "../codegen/index.sol";
import { LibRoom, LibUtils } from "../libraries/Libraries.sol";
import { ROOM_CREATION_COST, MAX_ROOM_PROMPT_LENGTH } from "../constants.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

contract RoomSystem is System {
  /**
   * @notice Create a room
   * @dev Admin can create rooms for free, players must pay
   * @param _roomPrompt The prompt for the room
   * @return roomId The id of the new room
   */
  function createRoom(string memory _roomPrompt) public returns (bytes32 roomId) {
    // TODO: Character count is not accurate, due to UTF8 encoding
    require(bytes(_roomPrompt).length > 0, "prompt too short");
    require(bytes(_roomPrompt).length <= MAX_ROOM_PROMPT_LENGTH, "prompt too long");

    // Admin creates rooms for free
    if (_msgSender() == GameConfig.getAdminAddress()) {
      roomId = LibRoom.createRoom(_roomPrompt);
    } else {
      bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());

      require(Balance.get(playerId) > ROOM_CREATION_COST, "balance too low");

      // Deduct from player's balance
      Balance.set(playerId, Balance.get(playerId) - ROOM_CREATION_COST);

      // Create room
      roomId = LibRoom.createRoom(_roomPrompt);
    }
  }

  /**
   * @notice Increase balance of room
   * @dev Only admin can call this function
   * @param _roomId The id of the room
   * @param _change Amount to incr balance by
   */
  function increaseRoomBalance(bytes32 _roomId, uint256 _change) public {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
    Balance.set(_roomId, Balance.get(_roomId) + _change);
  }

  /**
   * @notice Decrease balance of room
   * @dev Only admin can call this function
   * @param _roomId The id of the room
   * @param _change Amount to decr balance by
   */
  function decreaseRoomBalance(bytes32 _roomId, uint256 _change) public {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
    Balance.set(_roomId, LibUtils.safeSubtract(Balance.get(_roomId), _change));
  }

  /**
   * @notice Transfer balance from room to player
   * @dev Only admin can call this function
   * @param _roomId The id of the room
   * @param _playerId The id of the player
   * @param _amount Amount to transfer
   */
  function transferBalanceToPlayer(bytes32 _roomId, bytes32 _playerId, uint256 _amount) public {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
    require(EntityType.get(_roomId) == ENTITY_TYPE.ROOM, "not a room");

    Balance.set(_roomId, LibUtils.safeSubtract(Balance.get(_roomId), _amount));
    Balance.set(_playerId, Balance.get(_playerId) + _amount);
  }
}
