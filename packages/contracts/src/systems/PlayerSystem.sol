// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { GameConfig, EntityType, Balance, Name, OwnedRat, Inventory, Dead, Level, LevelList } from "../codegen/index.sol";
import { LibUtils } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

contract PlayerSystem is System {
  /**
   * @notice Spawn player
   * @param _playerId The id of the player
   */
  function spawn(string memory _name) public returns (bytes32 _playerId) {
    _playerId = LibUtils.addressToEntityKey(_msgSender());
    EntityType.set(_playerId, ENTITY_TYPE.PLAYER);
    Name.set(_playerId, _name);
    Balance.set(_playerId, 0);
    Level.set(_playerId, LevelList.get()[0]);
  }
}
