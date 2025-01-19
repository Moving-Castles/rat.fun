// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";

contract PlayerSystemTest is BaseTest {
  function testSpawn() public {
    setUp();

    vm.startPrank(alice);

    startGasReport("Spawn");
    bytes32 playerId = world.ratroom__spawn();
    endGasReport();

    vm.stopPrank();

    // Check player
    assertEq(Balance.get(playerId), 1000);
    assertEq(uint8(EntityType.get(playerId)), uint8(ENTITY_TYPE.PLAYER));
  }

  function testCreateRat() public {
    setUp();

    vm.startPrank(alice);

    bytes32 playerId = world.ratroom__spawn();

    startGasReport("Create rat");
    bytes32 ratId = world.ratroom__createRat();
    endGasReport();

    vm.stopPrank();

    assertEq(OwnedRat.get(playerId), ratId);

    // Check rat
    assertEq(uint8(EntityType.get(ratId)), uint8(ENTITY_TYPE.RAT));
    assertEq(Owner.get(ratId), playerId);
    assertEq(Dead.get(ratId), false);
    assertEq(Health.get(ratId), 100);
  }

  function testReverAlreadyHasRat() public {
    setUp();

    vm.startPrank(alice);

    world.ratroom__spawn();

    world.ratroom__createRat();

    vm.expectRevert("already has rat");
    world.ratroom__createRat();

    vm.stopPrank();
  }

  function testAddItemToInventory() public {
    setUp();

    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn();
    world.ratroom__createRat();
    vm.stopPrank();

    prankAdmin();

    startGasReport("Add item to inventory");
    bytes32 itemId = world.ratroom__addItemToInventory(playerId, "test item");
    endGasReport();

    vm.stopPrank();

    // Check item
    assertEq(uint8(EntityType.get(itemId)), uint8(ENTITY_TYPE.ITEM));
    assertEq(Name.get(itemId), "test item");

    // Check inventory
    bytes32[] memory inventory = Inventory.get(playerId);
    assertEq(inventory.length, 1);
    assertEq(inventory[0], itemId);
  }

  function testRemoveItemFromInventory() public {
    setUp();

    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn();
    world.ratroom__createRat();
    vm.stopPrank();

    prankAdmin();

    bytes32 itemId = world.ratroom__addItemToInventory(playerId, "test item");

    startGasReport("Remove item from inventory");
    world.ratroom__removeItemFromInventory(playerId, itemId);
    endGasReport();

    vm.stopPrank();

    // Item should be destroyed
    assertEq(uint8(EntityType.get(itemId)), uint8(ENTITY_TYPE.NONE));
    assertEq(Name.get(itemId), "");

    // Check inventory
    bytes32[] memory inventory = Inventory.get(playerId);
    assertEq(inventory.length, 0);
  }

  // - - - - - - - - - -
  // TODO: test reverts
  // - - - - - - - - - -
}
