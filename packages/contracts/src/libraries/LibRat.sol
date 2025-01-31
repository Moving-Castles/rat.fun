// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { EntityType, GameConfig, Dead, Health, Index, Balance, Traits, Inventory, Value, Level } from "../codegen/index.sol";
import { LibTrait } from "./LibTrait.sol";
import { LibItem } from "./LibItem.sol";
import { LibUtils } from "./LibUtils.sol";
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
    Balance.set(ratId, 0);
    Level.set(ratId, 1);

    uint32 newRatIndex = GameConfig.getGlobalRatIndex() + 1;
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

    // Health value has already been transferred to room

    // * * * *
    // Traits
    // * * * *

    bytes32[] memory traits = Traits.get(_ratId);

    for (uint i = 0; i < traits.length; i++) {
      int256 traitValue = Value.get(traits[i]);
      // If value of trait is positive, add value to room balance
      if (traitValue > 0) {
        Balance.set(_roomId, Balance.get(_roomId) + LibUtils.absToUint256(traitValue));
      }
      LibTrait.destroyTrait(traits[i]);
    }
    // Remove all traits from rat
    Traits.deleteRecord(_ratId);

    // * * * *
    // Items
    // * * * *

    bytes32[] memory items = Inventory.get(_ratId);

    for (uint i = 0; i < items.length; i++) {
      // Value of item is always positive
      Balance.set(_roomId, Balance.get(_roomId) + LibUtils.absToUint256(Value.get(items[i])));
      LibItem.destroyItem(items[i]);
    }
    // Remove all items from rat
    Inventory.deleteRecord(_ratId);

    // * * * *
    // Balance
    // * * * *

    Balance.set(_roomId, Balance.get(_roomId) + Balance.get(_ratId));
    Balance.set(_ratId, 0);
  }
}
