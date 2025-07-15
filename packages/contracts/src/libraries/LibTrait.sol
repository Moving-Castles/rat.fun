// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { EntityType, Name, Value } from "../codegen/index.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";
import { Item } from "../structs.sol";

library LibTrait {
  /**
   * @notice Create a trait
   * @param _trait Trait to create
   * @return traitId The id of the new trait
   */
  function createTrait(Item calldata _trait) internal returns (bytes32 traitId) {
    traitId = getUniqueEntity();
    EntityType.set(traitId, ENTITY_TYPE.TRAIT);
    Name.set(traitId, _trait.name);
    Value.set(traitId, _trait.value);
  }
}
