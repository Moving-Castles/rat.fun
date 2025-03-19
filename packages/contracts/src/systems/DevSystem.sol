// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { GameConfig, EntityType, Balance, Name, OwnedRat, Inventory, Dead, Level, LevelUpCost, RoomCreationCost } from "../codegen/index.sol";
import { LibUtils, LibRoom } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

contract DevSystem is System {
  function givePlayerBalance(uint256 _amount) public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    Balance.set(playerId, Balance.get(playerId) + _amount);
  }

  function giveRatBalance(uint256 _amount) public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    bytes32 ratId = OwnedRat.get(playerId);
    Balance.set(ratId, Balance.get(ratId) + _amount);
  }

  function createRoomAsAdmin(
    string memory _roomName,
    string memory _roomPrompt,
    bytes32 _roomLevel,
    uint256 _extraBalance
  ) public returns (bytes32 roomId) {
    roomId = LibRoom.createRoom(_roomName, _roomPrompt, GameConfig.getAdminId(), _roomLevel);
    Balance.set(roomId, Balance.get(roomId) + _extraBalance);
  }

  function destroyRoomAsAdmin(bytes32 _roomId) public {
    LibRoom.destroyRoom(_roomId);
  }

  function updateLevel(bytes32 _levelId, uint256 _levelUpCost, uint256 _roomCreationCost) public {
    LevelUpCost.set(_levelId, _levelUpCost);
    RoomCreationCost.set(_levelId, _roomCreationCost);
  }

  function addRoomBalance(bytes32 _roomId) public {
    Balance.set(_roomId, Balance.get(_roomId) + 100);
  }
}
