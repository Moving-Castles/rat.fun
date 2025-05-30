// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { GameConfig, Balance, Name, OwnedRat, Level, LevelMinBalance, LevelMaxBalance, RoomCreationCost } from "../codegen/index.sol";

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
}
