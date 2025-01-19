// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { GameConfig, Health, Dead, Traits, Owner, OwnedRat, EntityType, Inventory, LoadOut } from "../codegen/index.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { LibRoom, LibUtils, LibTrait, LibItem } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

contract RatSystem is System {

  function createRat() public returns(bytes32 ratId) {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());

    bytes32 currentRat = OwnedRat.get(playerId);

    require(currentRat== bytes32(0) || Dead.get(currentRat), "already has rat");
    
    ratId = getUniqueEntity();

    OwnedRat.set(playerId, ratId);

    // Create rat
    EntityType.set(ratId, ENTITY_TYPE.RAT);
    Owner.set(ratId, playerId);
    Dead.set(ratId, false);
    Health.set(ratId, 100);
  }

  function addTrait(bytes32 ratId, string memory name) public returns(bytes32 traitId) {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
    traitId = LibTrait.createTrait(name);
    // Add to traits table
    Traits.push(ratId, traitId);
  }

  function removeTrait(bytes32 ratId, bytes32 traitId) public {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
    LibTrait.destroyTrait(traitId);
    // Remove from traits table
    Traits.set(ratId, LibUtils.removeFromArray(Traits.get(ratId), traitId));
  }

  function changeStat(bytes32 ratId, string memory statName, uint256 change, bool negative) public {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");

    if(LibUtils.stringEq(statName, "health")) {
      if(negative) {
        Health.set(ratId, LibUtils.safeSubtract(Health.get(ratId), change));
        if(Health.get(ratId) == 0) {
          Dead.set(ratId, true);
        }
      } else {
        Health.set(ratId, Health.get(ratId) + change);
      }
    } else {
      console.log("invalid stat name");
    }
  }

  function addItemToLoadOut(bytes32 itemId) public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    bytes32 ratId = OwnedRat.get(playerId);

    require(ratId != bytes32(0), "no rat");
    require(!Dead.get(ratId), "rat is dead");

    require(LibUtils.arrayIncludes(Inventory.get(playerId), itemId), "item not in inventory");

    // Remove from inventory
    Inventory.set(playerId, LibUtils.removeFromArray(Inventory.get(playerId), itemId)); 

    // Add to load out
    LoadOut.push(ratId, itemId);
  }

  function removeItemFromLoadOut(bytes32 itemId) public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    bytes32 ratId = OwnedRat.get(playerId);

    require(ratId != bytes32(0), "no rat");
    require(!Dead.get(ratId), "rat is dead");

    require(LibUtils.arrayIncludes(LoadOut.get(ratId), itemId), "item not in load out");

    // Remove from load out
    LoadOut.set(ratId, LibUtils.removeFromArray(LoadOut.get(ratId), itemId)); 

    // Add to inventory
    Inventory.push(playerId, itemId);
  }

  function clearLoadOut(bytes32 ratId) public {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");

    bytes32[] memory loadOut = LoadOut.get(ratId);

    for(uint256 i = 0; i < loadOut.length; i++) {
      LibItem.destroyItem(loadOut[i]);
    }

    LoadOut.set(ratId, new bytes32[](0));
  }
}
