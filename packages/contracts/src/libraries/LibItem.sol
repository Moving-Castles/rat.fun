// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { EntityType, Name, Value } from "../codegen/index.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";
import { LibUtils } from "./LibUtils.sol";
import { Item } from "../Structs.sol";

library LibItem {
  /**
   * @notice Create an item
   * @param _item Item to create
   * @return itemId The id of the new item
   */
  function createItem(Item calldata _item) internal returns (bytes32 itemId) {
    itemId = getUniqueEntity();
    EntityType.set(itemId, ENTITY_TYPE.ITEM);
    Name.set(itemId, _item.name);
    // Value of item is always positive
    Value.set(itemId, LibUtils.abs(_item.value));
  }

  /**
   * @notice Destroy an item
   * @param _itemId The id of the item
   */
  function destroyItem(bytes32 _itemId) internal {
    EntityType.deleteRecord(_itemId);
    Name.deleteRecord(_itemId);
    Value.deleteRecord(_itemId);
  }
}
