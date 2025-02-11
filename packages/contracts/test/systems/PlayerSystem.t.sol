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
    bytes32 playerId = world.ratroom__spawn("alice");
    endGasReport();

    vm.stopPrank();

    // Check player
    assertEq(uint8(EntityType.get(playerId)), uint8(ENTITY_TYPE.PLAYER));
    assertEq(Name.get(playerId), "alice");
    assertEq(Balance.get(playerId), 0);
  }

  function testTransferBalanceToRat() public {
    setUp();

    vm.startPrank(alice);

    bytes32 playerId = world.ratroom__spawn("alice");
    world.ratroom__givePlayerBalance(1000);

    world.ratroom__createRat("roger");

    startGasReport("Transfer balance to rat");
    world.ratroom__transferBalanceToRat(500);
    endGasReport();

    vm.stopPrank();

    assertEq(Balance.get(playerId), 500);
    assertEq(Balance.get(OwnedRat.get(playerId)), 500);
  }

  function testTransferBalanceToPlayer() public {
    setUp();

    vm.startPrank(alice);

    bytes32 playerId = world.ratroom__spawn("alice");
    world.ratroom__givePlayerBalance(1000);

    world.ratroom__createRat("roger");

    world.ratroom__transferBalanceToRat(500);

    startGasReport("Transfer balance to rat");
    world.ratroom__transferBalanceToPlayer(200);
    endGasReport();

    vm.stopPrank();

    assertEq(Balance.get(playerId), 700);
    assertEq(Balance.get(OwnedRat.get(playerId)), 300);
  }

  function testRevertInsufficientBalance() public {
    setUp();

    // As player
    vm.startPrank(alice);

    world.ratroom__spawn("alice");
    world.ratroom__givePlayerBalance(1000);

    world.ratroom__createRat("roger");

    vm.expectRevert("insufficient balance");
    world.ratroom__transferBalanceToRat(6900);

    vm.expectRevert("insufficient balance");
    world.ratroom__transferBalanceToPlayer(6900);

    vm.stopPrank();
  }

  // function testTransferItemToInventory() public {
  //   setUp();

  //   // As player
  //   vm.startPrank(alice);
  //   bytes32 playerId = world.ratroom__spawn("alice");
  //   bytes32 ratId = world.ratroom__createRat("roger");
  //   vm.stopPrank();

  //   // As admin
  //   prankAdmin();
  //   startGasReport("Add item to load out");
  //   bytes32 itemId = world.ratroom__addItemToLoadOut(ratId, "test item", 20);
  //   endGasReport();
  //   vm.stopPrank();

  //   // Check that item is in load out
  //   assertEq(LoadOut.get(ratId).length, 1);
  //   assertEq(LoadOut.get(ratId)[0], itemId);
  //   assertEq(Inventory.get(playerId).length, 0);

  //   // As player
  //   vm.startPrank(alice);
  //   startGasReport("Transfer item from load out to inventory");
  //   world.ratroom__transferItemToInventory(itemId);
  //   endGasReport();
  //   vm.stopPrank();

  //   // check that item was transferred
  //   assertEq(Inventory.get(playerId).length, 1);
  //   assertEq(Inventory.get(playerId)[0], itemId);
  //   assertEq(LoadOut.get(ratId).length, 0);
  // }

  // function testTransferItemToLoadOut() public {
  //   setUp();

  //   // As player
  //   vm.startPrank(alice);
  //   bytes32 playerId = world.ratroom__spawn("alice");
  //   bytes32 ratId = world.ratroom__createRat("roger");
  //   vm.stopPrank();

  //   // As admin
  //   prankAdmin();
  //   startGasReport("Add item to load out");
  //   bytes32 itemId = world.ratroom__addItemToLoadOut(ratId, "test item", 20);
  //   endGasReport();
  //   vm.stopPrank();

  //   // Check that item is in load out
  //   assertEq(LoadOut.get(ratId).length, 1);
  //   assertEq(LoadOut.get(ratId)[0], itemId);
  //   assertEq(Inventory.get(playerId).length, 0);

  //   // As player
  //   vm.startPrank(alice);
  //   world.ratroom__transferItemToInventory(itemId);

  //   assertEq(Inventory.get(playerId).length, 1);
  //   assertEq(Inventory.get(playerId)[0], itemId);
  //   assertEq(LoadOut.get(ratId).length, 0);

  //   startGasReport("Transfer item from inventory to load out");
  //   world.ratroom__transferItemToLoadOut(itemId);
  //   endGasReport();
  //   vm.stopPrank();

  //   // Check that item is back in load out
  //   assertEq(LoadOut.get(ratId).length, 1);
  //   assertEq(LoadOut.get(ratId)[0], itemId);
  //   assertEq(Inventory.get(playerId).length, 0);
  // }

  function testRevertItemNotFound() public {
    setUp();

    // As player
    vm.startPrank(alice);

    world.ratroom__spawn("alice");
    world.ratroom__givePlayerBalance(1000);

    world.ratroom__createRat("roger");

    vm.expectRevert("item not found");
    world.ratroom__transferItemToInventory(bytes32(0));

    vm.expectRevert("item not found");
    world.ratroom__transferItemToLoadOut(bytes32(0));

    vm.stopPrank();
  }
}
