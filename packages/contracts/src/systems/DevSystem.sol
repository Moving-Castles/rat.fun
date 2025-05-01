// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { GameConfig, EntityType, Balance, Name, OwnedRat, Inventory, Dead, Level, LevelMinBalance, LevelMaxBalance, RoomCreationCost } from "../codegen/index.sol";
import { LibUtils, LibRoom } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

contract DevSystem is System {
  /**
   * @dev Modifier to restrict access to admin only
   */
  modifier onlyAdmin() {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
    _;
  }

  function givePlayerBalance(bytes32 _playerId, uint256 _amount) public onlyAdmin {
    Balance.set(_playerId, Balance.get(_playerId) + _amount);
  }

  function removePlayerBalance(bytes32 _playerId) public onlyAdmin {
    Balance.set(_playerId, 0);
  }

  function createRoomAsAdmin(
    string memory _roomName,
    string memory _roomPrompt,
    bytes32 _roomLevel,
    uint256 _extraBalance
  ) public onlyAdmin returns (bytes32 roomId) {
    roomId = LibRoom.createRoom(_roomName, _roomPrompt, GameConfig.getAdminId(), _roomLevel, bytes32(0));
    Balance.set(roomId, Balance.get(roomId) + _extraBalance);
  }

  function destroyRoomAsAdmin(bytes32 _roomId) public onlyAdmin {
    LibRoom.destroyRoom(_roomId);
  }

  function updateLevel(
    bytes32 _levelId,
    uint256 _levelMinBalance,
    uint256 _levelMaxBalance,
    uint256 _roomCreationCost
  ) public onlyAdmin {
    LevelMinBalance.set(_levelId, _levelMinBalance);
    LevelMaxBalance.set(_levelId, _levelMaxBalance);
    RoomCreationCost.set(_levelId, _roomCreationCost);
  }

  function addRoomBalance(bytes32 _roomId) public onlyAdmin {
    Balance.set(_roomId, Balance.get(_roomId) + 100);
  }
}
