// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { GameConfig, EntityType, Balance, Inventory } from "../codegen/index.sol";
import { LibUtils, LibItem } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

contract PlayerSystem is System {
    function spawn() public returns (bytes32 playerId) {
        playerId = LibUtils.addressToEntityKey(_msgSender());
        EntityType.set(playerId, ENTITY_TYPE.PLAYER);
        Balance.set(playerId, 1000);
    }

    function addItemToInventory(bytes32 playerId, string memory name) public returns(bytes32 itemId) {
        require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
        itemId = LibItem.createItem(name);
        // Add to inventory table
        Inventory.push(playerId, itemId);
    }

    function removeItemFromInventory(bytes32 playerId, bytes32 itemId) public {
        require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
        LibItem.destroyItem(itemId);
        // Remove from inventory table
        Inventory.set(playerId, LibUtils.removeFromArray(Inventory.get(playerId), itemId));
  }
}