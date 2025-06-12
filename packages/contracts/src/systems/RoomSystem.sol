// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { GameConfig, EntityType, Balance, Level, VisitedLevels, RoomCreationCost, LevelList, Owner, OwnedRat, CreationBlock } from "../codegen/index.sol";
import { LibRoom, LibUtils, LibWorld } from "../libraries/Libraries.sol";
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
   * @param _playerId The id of the player creating the room
   * @param _levelId The id of the level the room should be created on
   * @param _roomId The id of the room
   * @param _prompt The prompt for the room
   * @return newRoomId The id of the new room
   */
  function createRoom(
    bytes32 _playerId,
    bytes32 _levelId,
    bytes32 _roomId,
    string memory _prompt
  ) public onlyAdmin returns (bytes32 newRoomId) {
    // Player can only create rooms on levels that their rats have visited
    require(LibUtils.arrayIncludes(VisitedLevels.get(_playerId), _levelId), "invalid level");

    // Room id can be 0 (which generates a new id) or an unused entity id
    require(_roomId == bytes32(0) || EntityType.get(_roomId) == ENTITY_TYPE.NONE, "room id already in use");

    uint256 roomCreationCost = RoomCreationCost.get(_levelId);

    // Create room
    newRoomId = LibRoom.createRoom(_prompt, _playerId, _levelId, _roomId, roomCreationCost);

    // Deposit player tokens in pool
    // ERC-20 will check that player has sufficient balance, and approval for pool to transfer it
    LibWorld.gamePool().depositTokens(
      LibUtils.addressToEntityKey(_playerId),
      roomCreationCost * 10 ** LibWorld.erc20().decimals()
    );
  }

  /**
   * @notice Close a room
   * @param _roomId The id of the room to close
   */
  function closeRoom(bytes32 _roomId) public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    require(Owner.get(_roomId) == playerId, "not owner");
    require(block.number > (CreationBlock.get(_roomId) + GameConfig.getCooldownCloseRoom()), "in cooldown");

    uint256 balanceToTransfer = Balance.get(_roomId);
    Balance.set(_roomId, 0);

    // Withdraw tokens equal to room value from pool to player
    // ERC-20 will check that pool has sufficient balance
    LibWorld.gamePool().withdrawTokens(_msgSender(), balanceToTransfer * 10 ** LibWorld.erc20().decimals());
  }
}
