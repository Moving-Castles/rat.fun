// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { EntityType, Name } from "../codegen/index.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

library LibItem {
    function createItem(string memory name) internal returns (bytes32 itemId) {
        itemId = getUniqueEntity();
        EntityType.set(itemId, ENTITY_TYPE.ITEM);
        Name.set(itemId, name);
    }

    function destroyItem(bytes32 itemId) internal {
        EntityType.deleteRecord(itemId);
        Name.deleteRecord(itemId);
    }
}
