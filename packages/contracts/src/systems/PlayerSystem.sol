// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { System } from "@latticexyz/world/src/System.sol";
import { EntityType, Name, CreationBlock, GameConfig, VisitedLevels, LevelList } from "../codegen/index.sol";
import { LibUtils, LibWorld } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

contract PlayerSystem is System {
  /**
   * @notice Spawn player
   * @param _name The name of the player
   * @return playerId The id of the player
   */
  function spawn(string memory _name) public returns (bytes32 playerId) {
    playerId = LibUtils.addressToEntityKey(_msgSender());
    require(EntityType.get(playerId) == ENTITY_TYPE.NONE, "already spawned");

    EntityType.set(playerId, ENTITY_TYPE.PLAYER);
    Name.set(playerId, _name);
    CreationBlock.set(playerId, block.number);
    // Set first level as visited
    VisitedLevels.push(playerId, LevelList.getItem(0));
  }
}
