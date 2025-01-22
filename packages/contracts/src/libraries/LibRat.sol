// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { EntityType, GameConfig, Dead, Health, Index } from "../codegen/index.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

library LibRat {
  /**
   * @notice Create a new rat entity
   * @return ratId The id of the new rat entity
   */
  function createRat() internal returns (bytes32 ratId) {
    ratId = getUniqueEntity();
    // Create rat
    EntityType.set(ratId, ENTITY_TYPE.RAT);
    Dead.set(ratId, false);
    Health.set(ratId, 100);

    uint32 newRatIndex = GameConfig.getGlobalRatIndex() + 1;
    GameConfig.setGlobalRatIndex(newRatIndex);
    Index.set(ratId, newRatIndex);
  }
}
