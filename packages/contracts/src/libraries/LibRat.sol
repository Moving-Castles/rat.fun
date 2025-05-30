// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { EntityType, GameConfig, Dead, Health, Index, Balance, Traits, Inventory, Value, Level, LevelList, Name, Owner, OwnedRat, CreationBlock, PastRats } from "../codegen/index.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

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
    Health.set(ratId, 100);
    Balance.set(ratId, 0);
    Level.set(ratId, LevelList.getItem(0));
    CreationBlock.set(ratId, block.number);

    uint256 newRatIndex = GameConfig.getGlobalRatIndex() + 1;
    GameConfig.setGlobalRatIndex(newRatIndex);
    Index.set(ratId, newRatIndex);
  }

  /**
   * @notice Process a rat's death, transferring its value to either a room or its owner
   * @param _ratId The id of the rat
   * @param _destinationId The id of the destination (room or player) to receive the value
   * @param _isLiquidation Whether this is a liquidation (true) or death (false)
   */
  function killRat(bytes32 _ratId, bytes32 _destinationId, bool _isLiquidation) internal {
    Dead.set(_ratId, true);

    uint256 balanceToTransfer;

    // * * * *
    // Health
    // * * * *
    if (_isLiquidation) {
      balanceToTransfer += Health.get(_ratId);
      Health.set(_ratId, 0);
    }

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

    // * * * *
    // Transfer
    // * * * *
    Balance.set(_destinationId, Balance.get(_destinationId) + balanceToTransfer);

    bytes32 playerId = Owner.get(_ratId);
    // Add to history of rats
    PastRats.push(playerId, _ratId);
    // Then disconnect the rat from the player
    OwnedRat.deleteRecord(playerId);
  }

  /**
   * @notice Get the total value of a rat
   * @param _ratId The id of the rat
   * @return totalValue The total value of the rat
   */
  function getTotalRatValue(bytes32 _ratId) internal view returns (uint256) {
    uint256 totalValue = 0;

    // Health
    totalValue += Health.get(_ratId);

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
