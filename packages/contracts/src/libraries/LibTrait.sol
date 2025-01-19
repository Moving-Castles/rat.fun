// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { EntityType, Name } from "../codegen/index.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

library LibTrait {
    function createTrait(string memory name) internal returns (bytes32 traitId) {
        traitId = getUniqueEntity();
        EntityType.set(traitId, ENTITY_TYPE.TRAIT);
        Name.set(traitId, name);
    }

    function destroyTrait(bytes32 traitId) internal {
        EntityType.deleteRecord(traitId);
        Name.deleteRecord(traitId);
    }
}
