// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { EntityType, GameConfig, Dead, Health, Index, Balance, Traits, Inventory, Value, Level, LevelList, Name, Owner, OwnedRat, CreationBlock } from "../codegen/index.sol";
import { LibTrait } from "./LibTrait.sol";
import { LibItem } from "./LibItem.sol";
import { LibUtils } from "./LibUtils.sol";
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
   * @notice Kill a rat
   * @param _ratId The id of the rat
   * @param _roomId The id of the room that the rat died in
   */
  function killRat(bytes32 _ratId, bytes32 _roomId) internal {
    Dead.set(_ratId, true);

    uint256 balanceToTransfer;

    // Health value has already been transferred to room

    // * * * *
    // Traits
    // * * * *

    bytes32[] memory traits = Traits.get(_ratId);

    for (uint i = 0; i < traits.length; i++) {
      int256 traitValue = Value.get(traits[i]);
      // If value of trait is positive, add value to room balance
      if (traitValue > 0) {
        balanceToTransfer += LibUtils.absToUint256(traitValue);
      }
      // LibTrait.destroyTrait(traits[i]);
    }

    // Remove all traits from rat
    Traits.deleteRecord(_ratId);

    // * * * *
    // Items
    // * * * *

    bytes32[] memory items = Inventory.get(_ratId);

    for (uint i = 0; i < items.length; i++) {
      // Value of item is always positive
      balanceToTransfer += LibUtils.absToUint256(Value.get(items[i]));
      // LibItem.destroyItem(items[i]);
    }
    // Remove all items from rat
    Inventory.deleteRecord(_ratId);

    // * * * *
    // Balance
    // * * * *

    balanceToTransfer += Balance.get(_ratId);
    Balance.set(_ratId, 0);

    // * * * *
    // Transfer
    // * * * *

    Balance.set(_roomId, Balance.get(_roomId) + balanceToTransfer);

    bytes32 playerId = Owner.get(_ratId);
    OwnedRat.deleteRecord(playerId);
  }

  /**
   * @notice Liquidate a rat
   * @param _ratId The id of the rat
   */
  function liquidateRat(bytes32 _ratId) internal {
    Dead.set(_ratId, true);

    uint256 balanceToTransfer;

    // * * * *
    // Health
    // * * * *

    balanceToTransfer += Health.get(_ratId);
    Health.set(_ratId, 0);

    // * * * *
    // Traits
    // * * * *

    bytes32[] memory traits = Traits.get(_ratId);

    for (uint i = 0; i < traits.length; i++) {
      int256 traitValue = Value.get(traits[i]);
      // TODO: handle negative traits
      if (traitValue > 0) {
        balanceToTransfer += LibUtils.absToUint256(traitValue);
      }
      // LibTrait.destroyTrait(traits[i]);
    }
    // Remove all traits from rat
    Traits.deleteRecord(_ratId);

    // * * * *
    // Items
    // * * * *

    bytes32[] memory items = Inventory.get(_ratId);

    for (uint i = 0; i < items.length; i++) {
      // Value of item is always positive
      balanceToTransfer += LibUtils.absToUint256(Value.get(items[i]));
      // LibItem.destroyItem(items[i]);
    }
    // Remove all items from rat
    Inventory.deleteRecord(_ratId);

    // * * * *
    // Balance
    // * * * *

    balanceToTransfer += Balance.get(_ratId);
    Balance.set(_ratId, 0);

    // * * * *
    // Transfer
    // * * * *

    bytes32 playerId = Owner.get(_ratId);
    Balance.set(playerId, Balance.get(playerId) + balanceToTransfer);
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
      int256 traitValue = Value.get(traits[i]);
      if (traitValue > 0) {
        totalValue += LibUtils.absToUint256(traitValue);
      } else {
        totalValue -= LibUtils.absToUint256(traitValue);
      }
    }

    // Items
    bytes32[] memory items = Inventory.get(_ratId);
    for (uint i = 0; i < items.length; i++) {
      // Items are always positive
      totalValue += LibUtils.absToUint256(Value.get(items[i]));
    }

    // Balance
    totalValue += Balance.get(_ratId);

    return totalValue;
  }
}
