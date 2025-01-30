// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { EntityType, Name, Value, Traits } from "../codegen/index.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";
import { LibUtils } from "./LibUtils.sol";
import { Item } from "../Structs.sol";

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

  /**
   * @notice Destroy a trait
   * @param _traitId The id of the trait
   */
  function destroyTrait(bytes32 _traitId) internal {
    EntityType.deleteRecord(_traitId);
    Name.deleteRecord(_traitId);
    Value.deleteRecord(_traitId);
  }
}
