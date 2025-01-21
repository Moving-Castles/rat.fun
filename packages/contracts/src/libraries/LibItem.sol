// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { EntityType, Name, Value } from "../codegen/index.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

library LibItem {
  /**
   * @notice Create an item
   * @param _name Description of item
   * @param _value Value of item
   * @return itemId The id of the new item
   */
  function createItem(string memory _name, int256 _value) internal returns (bytes32 itemId) {
    itemId = getUniqueEntity();
    EntityType.set(itemId, ENTITY_TYPE.ITEM);
    Name.set(itemId, _name);
    Value.set(itemId, _value);
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
