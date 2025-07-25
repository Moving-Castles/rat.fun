// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";
import { Item } from "../../src/structs.sol";
import { RAT_CREATION_COST } from "../../src/constants.sol";

contract ManagerSystemTest is BaseTest {
  // * * * *
  // Basic
  // * * * *

  function testRevertNotAllowed() public {
    vm.startPrank(alice);
    world.ratfun__spawn("alice");

    vm.expectRevert("not allowed");
    world.ratfun__applyOutcome(bytes32(0), bytes32(0), 0, new bytes32[](0), new Item[](0));

    vm.stopPrank();
  }

  function testApplyOutcomeEmpty() public {
    setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    bytes32 ratId = world.ratfun__createRat("roger");
    vm.stopPrank();

    setInitialBalance(bob);
    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratfun__spawn("bob");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    prankAdmin();
    bytes32 roomId = world.ratfun__createRoom(bobId, LevelList.getItem(0), bytes32(0), "test room");
    vm.stopPrank();

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (empty)");
    world.ratfun__applyOutcome(ratId, roomId, 0, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Check last visit block
    assertEq(LastVisitBlock.get(roomId), block.number);
  }

  // * * * *
  // Items
  // * * * *

  function testApplyOutcomeAddPositiveItem() public {
    setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    bytes32 ratId = world.ratfun__createRat("roger");
    vm.stopPrank();

    setInitialBalance(bob);
    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratfun__spawn("bob");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    prankAdmin();
    bytes32 roomId = world.ratfun__createRoom(bobId, LevelList.getItem(0), bytes32(0), "test room");
    vm.stopPrank();

    // Item to add
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("cheese", 40);

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (add positive item)");
    world.ratfun__applyOutcome(ratId, roomId, 0, new bytes32[](0), newItems);
    endGasReport();
    vm.stopPrank();

    // Check added item
    assertEq(Inventory.length(ratId), 1);
    assertEq(Value.get(Inventory.getItem(ratId, 0)), 40);
    assertEq(Name.get(Inventory.getItem(ratId, 0)), "cheese");

    // pre-change balance - 40
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 40);
  }

  function testApplyOutcomeAddPositiveItemTooExpensive() public {
    setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    bytes32 ratId = world.ratfun__createRat("roger");
    vm.stopPrank();

    setInitialBalance(bob);
    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratfun__spawn("bob");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    prankAdmin();
    bytes32 roomId = world.ratfun__createRoom(bobId, LevelList.getItem(0), bytes32(0), "test room");
    vm.stopPrank();

    // Item to add
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("cheese", GameConfig.getRoomCreationCost() + 1);

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (add positive item: too expensive)");
    world.ratfun__applyOutcome(ratId, roomId, 0, new bytes32[](0), newItems);
    endGasReport();
    vm.stopPrank();

    // Not enough room balance
    assertEq(Inventory.length(ratId), 0);
    // Initial room balance
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost());
  }

  function testApplyOutcomeRemovePositiveItem() public {
    setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    bytes32 ratId = world.ratfun__createRat("roger");
    vm.stopPrank();

    setInitialBalance(bob);
    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratfun__spawn("bob");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    prankAdmin();
    bytes32 roomId = world.ratfun__createRoom(bobId, LevelList.getItem(0), bytes32(0), "test room");
    vm.stopPrank();

    // Item to add
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("cheese", 40);

    // As admin
    prankAdmin();
    world.ratfun__applyOutcome(ratId, roomId, 0, new bytes32[](0), newItems);
    vm.stopPrank();

    // Check added item
    bytes32 itemId = Inventory.getItem(ratId, 0);
    assertEq(Inventory.length(ratId), 1);
    assertEq(Value.get(itemId), 40);
    assertEq(Name.get(itemId), "cheese");

    // Initial room balance - 40
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 40);

    bytes32[] memory itemsToRemove = new bytes32[](1);
    itemsToRemove[0] = itemId;

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (remove positive item)");
    world.ratfun__applyOutcome(ratId, roomId, 0, itemsToRemove, new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Initial room balance again
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost());
    assertEq(Inventory.length(ratId), 0);
  }

  // * * * * * * * * *
  // Balance transfer
  // * * * * * * * * *

  function testApplyOutcomeTransferToRat() public {
    // As alice
    setInitialBalance(alice);
    vm.startPrank(alice);
    world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    bytes32 ratId = world.ratfun__createRat("roger");
    vm.stopPrank();

    // As bob
    uint256 initialBalance = setInitialBalance(bob);
    vm.startPrank(bob);
    bytes32 bobId = world.ratfun__spawn("bob");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin
    prankAdmin();
    bytes32 roomId = world.ratfun__createRoom(bobId, LevelList.getItem(0), bytes32(0), "test room");
    startGasReport("Apply outcome (transfer to rat)");
    world.ratfun__applyOutcome(ratId, roomId, 20, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Initial balance + 20
    assertEq(Balance.get(ratId), RAT_CREATION_COST + 20);
    // Initial room balance - 20
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 20);
    // Initial bob balance - ROOM_CREATION_COST
    assertEq(
      LibWorld.erc20().balanceOf(bob),
      initialBalance - GameConfig.getRoomCreationCost() * 10 ** LibWorld.erc20().decimals()
    );
  }

  function testApplyOutcomeTransferToRoom() public {
    // As alice
    setInitialBalance(alice);
    vm.startPrank(alice);
    world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    bytes32 ratId = world.ratfun__createRat("roger");
    vm.stopPrank();

    // As bob
    setInitialBalance(bob);
    vm.startPrank(bob);
    bytes32 bobId = world.ratfun__spawn("bob");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin
    prankAdmin();
    bytes32 roomId = world.ratfun__createRoom(bobId, LevelList.getItem(0), bytes32(0), "test room");
    world.ratfun__applyOutcome(ratId, roomId, 50, new bytes32[](0), new Item[](0));
    startGasReport("Apply outcome (transfer to room)");
    world.ratfun__applyOutcome(ratId, roomId, -20, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Initial balance + 50 - 20
    assertEq(Balance.get(ratId), RAT_CREATION_COST + 30);
    // Initial room balance - 50 (transfer to rat) + 20 (transfer back to room)
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 50 + 20);
  }

  function testApplyOutcomeOverTransferToRat() public {
    // As alice
    setInitialBalance(alice);
    vm.startPrank(alice);
    world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    bytes32 ratId = world.ratfun__createRat("roger");
    vm.stopPrank();

    // As bob
    setInitialBalance(bob);
    vm.startPrank(bob);
    bytes32 bobId = world.ratfun__spawn("bob");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin
    prankAdmin();
    bytes32 roomId = world.ratfun__createRoom(bobId, LevelList.getItem(0), bytes32(0), "test room");
    startGasReport("Apply outcome (over transfer to rat)");
    world.ratfun__applyOutcome(
      ratId,
      roomId,
      int256(GameConfig.getRoomCreationCost() + 100),
      new bytes32[](0),
      new Item[](0)
    );
    endGasReport();
    vm.stopPrank();

    // Initial balance + half of room creation cost (because room can only give half of its creation cost)
    assertEq(Balance.get(ratId), RAT_CREATION_COST + GameConfig.getRoomCreationCost() / 2);
    // Half of room creation cost was given to rat
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() / 2);
  }

  function testApplyOutcomeOverTransferToRoom() public {
    // As alice
    setInitialBalance(alice);
    vm.startPrank(alice);
    world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    bytes32 ratId = world.ratfun__createRat("roger");
    vm.stopPrank();

    // As bob
    setInitialBalance(bob);
    vm.startPrank(bob);
    bytes32 bobId = world.ratfun__spawn("bob");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin
    prankAdmin();
    bytes32 roomId = world.ratfun__createRoom(bobId, LevelList.getItem(0), bytes32(0), "test room");
    world.ratfun__applyOutcome(ratId, roomId, 50, new bytes32[](0), new Item[](0));
    startGasReport("Apply outcome (over transfer to room)");
    world.ratfun__applyOutcome(ratId, roomId, -200, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Rat should have 0 balance and be dead
    assertEq(Balance.get(ratId), 0);
    assertTrue(Dead.get(ratId));
    // Initial room balance + RAT_CREATION_COST
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() + RAT_CREATION_COST);
  }

  // * * * *
  // Death
  // * * * *

  function testApplyOutcomeValueTransferOnDeath() public {
    // As alice
    setInitialBalance(alice);
    vm.startPrank(alice);
    world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    bytes32 ratId = world.ratfun__createRat("roger");
    vm.stopPrank();

    // As bob
    setInitialBalance(bob);
    vm.startPrank(bob);
    bytes32 bobId = world.ratfun__spawn("bob");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // Item to add
    Item[] memory newItems = new Item[](2);
    newItems[0] = Item("cheese", 30);
    newItems[1] = Item("stick", 20);

    // As admin
    prankAdmin();

    // Create room
    bytes32 roomId = world.ratfun__createRoom(bobId, LevelList.getItem(0), bytes32(0), "test room");

    // Add items and transfer balance to rat
    world.ratfun__applyOutcome(ratId, roomId, 20, new bytes32[](0), newItems);

    // Room balance:
    // initial room balance - 20 (balance transfer) - 50 (items)
    uint256 intermediateRoomBalance = GameConfig.getRoomCreationCost() - 20 - 50;
    assertEq(Balance.get(roomId), intermediateRoomBalance);

    // Check rat balance
    // Initial balance + 20 (balance transfer)
    uint256 intermediateRatBalance = RAT_CREATION_COST + 20;
    assertEq(Balance.get(ratId), intermediateRatBalance);

    // Check that items are added
    bytes32[] memory items = Inventory.get(ratId);
    assertEq(items.length, 2);
    assertEq(Name.get(items[0]), "cheese");
    assertEq(Value.get(items[0]), 30);
    assertEq(Name.get(items[1]), "stick");
    assertEq(Value.get(items[1]), 20);

    startGasReport("Apply outcome (value transfer on death)");
    world.ratfun__applyOutcome(ratId, roomId, -int256(intermediateRatBalance), new bytes32[](0), new Item[](0));
    endGasReport();

    vm.stopPrank();

    // Room kill count incremented
    assertEq(KillCount.get(roomId), 1);

    // Room balance:
    // intermediate room balance + intermediate rat balance + 50 (items)
    assertEq(Balance.get(roomId), intermediateRoomBalance + intermediateRatBalance + 50);

    // Rat is dead
    assertTrue(Dead.get(ratId));

    // Rat balance is 0
    assertEq(Balance.get(ratId), 0);

    // Global stats set
    assertEq(WorldStats.getGlobalRatKillCount(), 1);
    assertEq(WorldStats.getLastKilledRatBlock(), block.number);
  }
}
