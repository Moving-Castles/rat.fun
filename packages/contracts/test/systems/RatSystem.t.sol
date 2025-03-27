// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";
import { Item } from "../../src/structs.sol";

contract RatSystemTest is BaseTest {
  function testCreateRat() public {
    setUp();

    vm.startPrank(alice);

    bytes32 playerId = world.ratroom__spawn("alice");

    startGasReport("Create rat");
    bytes32 ratId = world.ratroom__createRat("roger");
    endGasReport();

    vm.stopPrank();

    // Check player
    assertEq(OwnedRat.get(playerId), ratId);

    // Check rat
    assertEq(uint8(EntityType.get(ratId)), uint8(ENTITY_TYPE.RAT));
    assertEq(Name.get(ratId), "roger");
    assertEq(Dead.get(ratId), false);
    assertEq(Health.get(ratId), 100);
    assertEq(Balance.get(ratId), 0);
    assertEq(Index.get(ratId), 1);
    assertEq(Level.get(ratId), LevelList.get()[0]);
    assertEq(Owner.get(ratId), playerId);
    assertEq(CreationBlock.get(ratId), block.number);
  }

  function testRevertAlreadyHasRat() public {
    setUp();

    vm.startPrank(alice);
    world.ratroom__spawn("alice");

    world.ratroom__createRat("roger");

    vm.expectRevert("already has rat");
    world.ratroom__createRat("roger");

    vm.stopPrank();
  }

  function testLiquidateRat() public {
    setUp();

    vm.startPrank(alice);

    bytes32 playerId = world.ratroom__spawn("alice");
    world.ratroom__createRat("roger");

    assertEq(Balance.get(playerId), 0);

    startGasReport("Liquidate rat");
    world.ratroom__liquidateRat();
    endGasReport();

    assertEq(Balance.get(playerId), 100);

    vm.stopPrank();
  }

  function testDropItem() public {
    setUp();

    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    world.ratroom__spawn("bob");
    world.ratroom__givePlayerBalance(1000);
    bytes32 roomId = world.ratroom__createRoom("test room", "test room");
    vm.stopPrank();

    // Trait to add
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("cheese", 40);

    // As admin
    prankAdmin();
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), new Item[](0), new bytes32[](0), newItems);
    vm.stopPrank();

    bytes32 newItemId = Inventory.get(ratId)[0];

    // Check added item
    assertEq(Inventory.get(ratId).length, 1);
    assertEq(Value.get(newItemId), 40);
    assertEq(Name.get(newItemId), "cheese");

    // Drop item
    vm.startPrank(alice);
    world.ratroom__dropItem(newItemId);
    vm.stopPrank();

    // Check item is destroyed
    assertEq(Inventory.get(ratId).length, 0);
    assertEq(Value.get(newItemId), 0);
    assertEq(Name.get(newItemId), "");
  }
}
