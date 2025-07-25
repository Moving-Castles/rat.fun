// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import {
  EntityType,
  WorldStats,
  Dead,
  Index,
  Balance,
  Traits,
  Inventory,
  Value,
  Level,
  LevelList,
  Name,
  Owner,
  CreationBlock,
  PastRats
} from "../codegen/index.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";
import { RAT_CREATION_COST } from "../constants.sol";

library LibRat {
  /**
   * @notice Create a new rat entity
   * @param _name The name of the rat
   * @return ratId The id of the new rat entity
   */
  function createRat(string calldata _name) internal returns (bytes32 ratId) {
    ratId = getUniqueEntity();
    // Create rat
    EntityType.set(ratId, ENTITY_TYPE.RAT);
    Name.set(ratId, _name);
    Dead.set(ratId, false);
    Balance.set(ratId, RAT_CREATION_COST);
    Level.set(ratId, LevelList.getItem(0));
    CreationBlock.set(ratId, block.number);

    uint256 newRatIndex = WorldStats.getGlobalRatIndex() + 1;
    WorldStats.setGlobalRatIndex(newRatIndex);
    Index.set(ratId, newRatIndex);
  }

  /**
   * @notice Process a rat's death, getting the total value left behind
   * @param _ratId The id of the rat
   * @return balanceToTransfer The total value of the rat to be transferred to room or player
   */
  function killRat(bytes32 _ratId) internal returns (uint256 balanceToTransfer) {
    Dead.set(_ratId, true);

    // * * * *
    // Traits
    // * * * *
    bytes32[] memory traits = Traits.get(_ratId);
    for (uint i = 0; i < traits.length; i++) {
      balanceToTransfer += Value.get(traits[i]);
    }

    // * * * *
    // Items
    // * * * *
    bytes32[] memory items = Inventory.get(_ratId);
    for (uint i = 0; i < items.length; i++) {
      balanceToTransfer += Value.get(items[i]);
    }

    // * * * *
    // Balance
    // * * * *
    balanceToTransfer += Balance.get(_ratId);
    Balance.set(_ratId, 0);

    bytes32 playerId = Owner.get(_ratId);
    // Add to history of rats
    PastRats.push(playerId, _ratId);

    // Increment kill counter and set last killed rat block
    WorldStats.setGlobalRatKillCount(WorldStats.getGlobalRatKillCount() + 1);
    WorldStats.setLastKilledRatBlock(block.number);
  }

  /**
   * @notice Get the total value of a rat
   * @param _ratId The id of the rat
   * @return totalValue The total value of the rat
   */
  function getTotalRatValue(bytes32 _ratId) internal view returns (uint256) {
    uint256 totalValue = 0;

    // Traits
    bytes32[] memory traits = Traits.get(_ratId);
    for (uint i = 0; i < traits.length; i++) {
      totalValue += Value.get(traits[i]);
    }

    // Items
    bytes32[] memory items = Inventory.get(_ratId);
    for (uint i = 0; i < items.length; i++) {
      totalValue += Value.get(items[i]);
    }

    // Balance
    totalValue += Balance.get(_ratId);

    return totalValue;
  }
}
