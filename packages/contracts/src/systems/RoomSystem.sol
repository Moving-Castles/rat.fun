// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { System } from "@latticexyz/world/src/System.sol";
import {
  GameConfig,
  EntityType,
  Balance,
  AchievedLevels,
  RoomCreationCost,
  Owner,
  CreationBlock,
  MaxValuePerWin,
  IsSpecialRoom
} from "../codegen/index.sol";
import { LibRoom, LibUtils, LibWorld } from "../libraries/Libraries.sol";
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
    // Player can only create rooms on levels that their rats have achieved in the past
    require(LibUtils.arrayIncludes(AchievedLevels.get(_playerId), _levelId), "invalid level");

    // Room id can be 0 (which generates a new id) or an unused entity id
    require(_roomId == bytes32(0) || EntityType.get(_roomId) == ENTITY_TYPE.NONE, "room id already in use");

    uint256 roomCreationCost = RoomCreationCost.get(_levelId);

    newRoomId = LibRoom.createRoom(_prompt, _playerId, _levelId, _roomId, roomCreationCost);

    // Deposit player tokens in pool
    // ERC-20 will check that player has sufficient balance, and approval for pool to transfer it
    LibWorld.gamePool().depositTokens(
      LibUtils.entityKeyToAddress(_playerId),
      roomCreationCost * 10 ** LibWorld.erc20().decimals()
    );
  }

  /**
   * @notice Create a special room. It is not restricted by the normal room creation cost / value limit
   * and can specify a custom max gain per win.
   * @dev Only admin can call this function
   * @param _levelId The id of the level the room should be created on
   * @param _roomId The id of the room
   * @param _prompt The prompt for the room
   * @param _roomCreationCost Custom room creation cost
   * @param _maxValuePerWin Used to override the normal max gain
   * @return newRoomId The id of the new room
   */
  function createSpecialRoom(
    bytes32 _levelId,
    bytes32 _roomId,
    uint256 _roomCreationCost,
    uint256 _maxValuePerWin,
    string memory _prompt
  ) public onlyAdmin returns (bytes32 newRoomId) {
    // Room id can be 0 (which generates a new id) or an unused entity id
    require(_roomId == bytes32(0) || EntityType.get(_roomId) == ENTITY_TYPE.NONE, "room id already in use");

    // All special rooms are created by admin
    bytes32 playerId = GameConfig.getAdminId();

    newRoomId = LibRoom.createRoom(_prompt, playerId, _levelId, _roomId, _roomCreationCost);
    IsSpecialRoom.set(newRoomId, true);
    MaxValuePerWin.set(newRoomId, _maxValuePerWin);

    // Deposit player tokens in pool
    // ERC-20 will check that player has sufficient balance, and approval for pool to transfer it
    LibWorld.gamePool().depositTokens(
      LibUtils.entityKeyToAddress(playerId),
      _roomCreationCost * 10 ** LibWorld.erc20().decimals()
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

    uint256 valueToPlayer = Balance.get(_roomId);

    // Calculate tax
    uint256 tax = (valueToPlayer * GameConfig.getTaxationCloseRoom()) / 100;
    valueToPlayer -= tax;

    Balance.set(_roomId, 0);

    // Withdraw tokens equal to room value from pool to player
    // ERC-20 will check that pool has sufficient balance
    LibWorld.gamePool().withdrawTokens(_msgSender(), valueToPlayer * 10 ** LibWorld.erc20().decimals());

    // Withdraw tokens equal to tax from pool to admin
    LibWorld.gamePool().withdrawTokens(GameConfig.getAdminAddress(), tax * 10 ** LibWorld.erc20().decimals());
  }
}
