// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { GameConfig, Health, Dead, Traits, Owner, OwnedRat, EntityType, Inventory, LoadOut } from "../codegen/index.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { LibRoom, LibUtils, LibTrait, LibItem } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

contract RatSystem is System {
  /**
   * @notice Create a rat
   * @return ratId The id of the new rat
   */
  function createRat() public returns (bytes32 ratId) {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());

    bytes32 currentRat = OwnedRat.get(playerId);

    // A player can only have one rat at a time
    require(currentRat == bytes32(0) || Dead.get(currentRat), "already has rat");

    ratId = getUniqueEntity();

    OwnedRat.set(playerId, ratId);

    // Create rat
    EntityType.set(ratId, ENTITY_TYPE.RAT);
    Owner.set(ratId, playerId);
    Dead.set(ratId, false);
    Health.set(ratId, 100);
  }

  /**
   * @notice Add a trait to rat
   * @dev Only admin can call this function
   * @param _ratId The id of the rat
   * @param _name Description of the trait
   * @param _value Value of the trait
   * @return traitId The id of the new trait
   */
  function addTrait(bytes32 _ratId, string memory _name, uint256 _value) public returns (bytes32 traitId) {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
    traitId = LibTrait.createTrait(_name, _value);
    // Add trait to rat
    Traits.push(_ratId, traitId);
  }

  /**
   * @notice Remove trait from rat
   * @dev Only admin can call this function
   * @param _ratId The id of the rat
   * @param _traitId Id of trait to remove
   */
  function removeTrait(bytes32 _ratId, bytes32 _traitId) public {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
    LibTrait.destroyTrait(_traitId);
    // Remove trait from rat
    Traits.set(_ratId, LibUtils.removeFromArray(Traits.get(_ratId), _traitId));
  }

  /**
   * @notice Change stat of rat
   * @dev Only admin can call this function. Kills rat if health is 0.
   * @param _ratId The id of the rat
   * @param _statName Name of the stat to change
   * @param _change Amount to change the stat by
   * @param _negative Whether the change is negative
   */
  function changeStat(bytes32 _ratId, string memory _statName, uint256 _change, bool _negative) public {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");

    if (LibUtils.stringEq(_statName, "health")) {
      if (_negative) {
        Health.set(_ratId, LibUtils.safeSubtract(Health.get(_ratId), _change));
        if (Health.get(_ratId) == 0) {
          Dead.set(_ratId, true);
        }
      } else {
        Health.set(_ratId, Health.get(_ratId) + _change);
      }
    } else {
      console.log("invalid stat name");
    }
  }

  /**
   * @notice Transfer item from player's inventory to rat's load out
   * @param _itemId The id of the item to transfer
   */
  function addItemToLoadOut(bytes32 _itemId) public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    bytes32 ratId = OwnedRat.get(playerId);

    require(ratId != bytes32(0), "no rat");
    require(!Dead.get(ratId), "rat is dead");
    require(LibUtils.arrayIncludes(Inventory.get(playerId), _itemId), "item not in inventory");

    // Remove from inventory
    Inventory.set(playerId, LibUtils.removeFromArray(Inventory.get(playerId), _itemId));

    // Add to load out
    LoadOut.push(ratId, _itemId);
  }

  /**
   * @notice Transfer item from rat's load out to player's inventory
   * @param _itemId The id of the item to transfer
   */
  function removeItemFromLoadOut(bytes32 _itemId) public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    bytes32 ratId = OwnedRat.get(playerId);

    require(ratId != bytes32(0), "no rat");
    require(!Dead.get(ratId), "rat is dead");
    require(LibUtils.arrayIncludes(LoadOut.get(ratId), _itemId), "item not in load out");

    // Remove from load out
    LoadOut.set(ratId, LibUtils.removeFromArray(LoadOut.get(ratId), _itemId));

    // Add to inventory
    Inventory.push(playerId, _itemId);
  }

  /**
   * @notice Clear rat's load out
   * @dev Only admin can call this function. Used after exiting a room.
   * @param _ratId The id of the rat
   */
  function clearLoadOut(bytes32 _ratId) public {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");

    bytes32[] memory loadOut = LoadOut.get(_ratId);

    // Destroy items in load out
    for (uint256 i = 0; i < loadOut.length; i++) {
      LibItem.destroyItem(loadOut[i]);
    }

    // Clear load out
    LoadOut.set(_ratId, new bytes32[](0));
  }
}
