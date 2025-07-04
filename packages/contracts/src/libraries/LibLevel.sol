// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import {
  EntityType,
  Index,
  LevelMinBalance,
  LevelMaxBalance,
  RoomCreationCost,
  LevelList,
  Name
} from "../codegen/index.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

library LibLevel {
  /**
   * @notice Create a level
   * @param _index The index of the level
   * @param _name The name of the level
   * @param _levelMinBalance The minimum balance for the level
   * @param _levelMaxBalance The maximum balance for the level
   * @param _roomCreationCost The cost to create a room on the level
   * @return levelId The id of the new level
   */
  function createLevel(
    uint256 _index,
    string memory _name,
    uint256 _levelMinBalance,
    uint256 _levelMaxBalance,
    uint256 _roomCreationCost
  ) internal returns (bytes32 levelId) {
    levelId = getUniqueEntity();
    EntityType.set(levelId, ENTITY_TYPE.LEVEL);

    Index.set(levelId, _index);
    Name.set(levelId, _name);
    LevelMinBalance.set(levelId, _levelMinBalance);
    LevelMaxBalance.set(levelId, _levelMaxBalance);
    RoomCreationCost.set(levelId, _roomCreationCost);

    // Push to the list of levels
    LevelList.push(levelId);
  }
}
