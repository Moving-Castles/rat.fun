// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import {
  GameConfig,
  EntityType,
  WorldStats,
  Dead,
  Index,
  Balance,
  Inventory,
  Value,
  Name,
  Owner,
  CreationBlock,
  PastRats,
  LiquidationBlock,
  MasterKey
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
    CreationBlock.set(ratId, block.number);

    uint256 newRatIndex = WorldStats.getGlobalRatIndex() + 1;
    WorldStats.setGlobalRatIndex(newRatIndex);
    Index.set(ratId, newRatIndex);
  }

  /**
   * @notice Process a rat's death, getting the total value left behind
   * @param _ratId The id of the rat
   * @return balanceToTransfer The total value of the rat to be transferred to trip or player
   */
  function killRat(bytes32 _ratId) internal returns (uint256 balanceToTransfer) {
    Dead.set(_ratId, true);

    balanceToTransfer = getTotalRatValue(_ratId);

    bytes32 playerId = Owner.get(_ratId);

    // Add to history of rats
    PastRats.push(playerId, _ratId);

    // Give master key for admin access if player has killed the required number of rats
    if (PastRats.get(playerId).length >= GameConfig.getRatsKilledForAdminAccess()) {
      MasterKey.set(playerId, true);
    }

    // Update rat
    LiquidationBlock.set(_ratId, block.number);

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
