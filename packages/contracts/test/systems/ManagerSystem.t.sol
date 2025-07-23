// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";
import { Item } from "../../src/structs.sol";

contract ManagerSystemTest is BaseTest {
  // * * * *
  // Basic
  // * * * *

  function testRevertNotAllowed() public {
    vm.startPrank(alice);
    world.ratfun__spawn("alice");

    vm.expectRevert("not allowed");
    world.ratfun__applyOutcome(
      bytes32(0),
      bytes32(0),
      0,
      0,
      new bytes32[](0),
      new Item[](0),
      new bytes32[](0),
      new Item[](0)
    );

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
    world.ratfun__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), new Item[](0), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Check last visit block
    assertEq(LastVisitBlock.get(roomId), block.number);
  }

  // * * * *
  // Health
  // * * * *

  function testApplyOutcomeIncreaseHealth() public {
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
    startGasReport("Apply outcome (increase health)");
    world.ratfun__applyOutcome(ratId, roomId, 20, 0, new bytes32[](0), new Item[](0), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // 100 + 20
    assertEq(Health.get(ratId), 120);
    // 100 - 20
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 20);
  }

  function testApplyOutcomeReduceHealth() public {
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
    startGasReport("Apply outcome (reduce health)");
    world.ratfun__applyOutcome(ratId, roomId, -20, 0, new bytes32[](0), new Item[](0), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // 100 - 20
    assertEq(Health.get(ratId), 80);
    // Initial room balance + 20
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() + 20);
  }

  function testApplyOutcomeOverIncreaseHealth() public {
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
    startGasReport("Apply outcome (over-increase health)");
    world.ratfun__applyOutcome(
      ratId,
      roomId,
      int256(GameConfig.getRoomCreationCost() + 1),
      0,
      new bytes32[](0),
      new Item[](0),
      new bytes32[](0),
      new Item[](0)
    );
    endGasReport();
    vm.stopPrank();

    // Initial health (100) + Half of room creation cost
    assertEq(Health.get(ratId), 100 + (GameConfig.getRoomCreationCost() / 2));
    // Initial room balance - Half of room creation cost
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - (GameConfig.getRoomCreationCost() / 2));
  }

  function testApplyOutcomeOverReduceHealth() public {
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
    startGasReport("Apply outcome (over-reduce health)");
    world.ratfun__applyOutcome(
      ratId,
      roomId,
      -200,
      0,
      new bytes32[](0),
      new Item[](0),
      new bytes32[](0),
      new Item[](0)
    );
    endGasReport();
    vm.stopPrank();

    // 100 - 100 (because rat only had 100 health to give)
    assertEq(Health.get(ratId), 0);
    // Rat is dead
    assertTrue(Dead.get(ratId));
    // Initial room balance + 100 (because rat only had 100 health to give)
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() + 100);
  }

  function testApplyOutcomeValueTransferOnDeath() public {
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

    // Traits to add
    Item[] memory newTraits = new Item[](2);
    newTraits[0] = Item("happy", 20);
    newTraits[1] = Item("sad", 0);

    // Item to add
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("cheese", 30);

    // As admin
    prankAdmin();

    // Add traits and items and transfer balance to rat
    world.ratfun__applyOutcome(ratId, roomId, 0, 20, new bytes32[](0), newTraits, new bytes32[](0), newItems);

    // Room balance:
    // initial room balance - 20 (balance transfer) - 30 (item) - 20 (trait)
    uint256 intermediateBalance = GameConfig.getRoomCreationCost() - 20 - 30 - 20;
    assertEq(Balance.get(roomId), intermediateBalance);

    // Check rat balance
    // 0 + 20 (balance transfer)
    assertEq(Balance.get(ratId), 20);

    assertEq(Health.get(ratId), 100);

    // Check that traits are added
    bytes32[] memory traits = Traits.get(ratId);
    assertEq(traits.length, 2);
    assertEq(Name.get(traits[0]), "happy");
    assertEq(Value.get(traits[0]), 20);
    assertEq(Name.get(traits[1]), "sad");
    assertEq(Value.get(traits[1]), 0);

    // Check that items are added
    bytes32[] memory items = Inventory.get(ratId);
    assertEq(items.length, 1);
    assertEq(Name.get(items[0]), "cheese");
    assertEq(Value.get(items[0]), 30);

    startGasReport("Apply outcome (value transfer on death)");
    world.ratfun__applyOutcome(
      ratId,
      roomId,
      -200,
      0,
      new bytes32[](0),
      new Item[](0),
      new bytes32[](0),
      new Item[](0)
    );
    endGasReport();

    vm.stopPrank();

    // Room kill count incremented
    assertEq(KillCount.get(roomId), 1);
    // Room balance:
    // intermediate room balance + 20 (balance transfer) + 30 (item) + 20 (trait) + 100 (health)
    assertEq(Balance.get(roomId), intermediateBalance + 20 + 30 + 20 + 100);

    // Rat is dead
    assertEq(Health.get(ratId), 0);
    assertTrue(Dead.get(ratId));
    // Rat is cleared
    assertEq(Balance.get(ratId), 0);

    // Global stats set
    assertEq(WorldStats.getGlobalRatKillCount(), 1);
    assertEq(WorldStats.getLastKilledRatBlock(), block.number);
  }

  // * * * *
  // Traits
  // * * * *

  function testApplyOutcomeAddPositiveTrait() public {
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

    // Trait to add
    Item[] memory newTraits = new Item[](1);
    newTraits[0] = Item("happy", 40);

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (add positive trait)");
    world.ratfun__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), newTraits, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Check added trait
    assertEq(Traits.length(ratId), 1);
    assertEq(Value.get(Traits.getItem(ratId, 0)), 40);
    assertEq(Name.get(Traits.getItem(ratId, 0)), "happy");

    // 100 - 40
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 40);
  }

  function testApplyOutcomeAddPositiveTraitTooExpensive() public {
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

    // Trait to add
    Item[] memory newTraits = new Item[](1);
    newTraits[0] = Item("happy", GameConfig.getRoomCreationCost() + 1);

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (add positive trait: too expensive)");
    world.ratfun__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), newTraits, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Not enough room balance
    assertEq(Traits.length(ratId), 0);
    // Room balance unchanged
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost());
  }

  function testApplyOutcomeRemovePositiveTrait() public {
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

    // Trait to add
    Item[] memory newTraits = new Item[](1);
    newTraits[0] = Item("happy", 40);

    // As admin
    prankAdmin();
    world.ratfun__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), newTraits, new bytes32[](0), new Item[](0));
    vm.stopPrank();

    // Check added trait
    bytes32 traitId = Traits.getItem(ratId, 0);
    assertEq(Traits.length(ratId), 1);
    assertEq(Value.get(traitId), 40);
    assertEq(Name.get(traitId), "happy");

    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 40);

    bytes32[] memory traitsToRemove = new bytes32[](1);
    traitsToRemove[0] = traitId;

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (remove positive trait)");
    world.ratfun__applyOutcome(ratId, roomId, 0, 0, traitsToRemove, new Item[](0), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // initial room balance - 40 + 40 (positive trait)
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost());
    assertEq(Traits.length(ratId), 0);
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
    world.ratfun__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), new Item[](0), new bytes32[](0), newItems);
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
    world.ratfun__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), new Item[](0), new bytes32[](0), newItems);
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
    world.ratfun__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), new Item[](0), new bytes32[](0), newItems);
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
    world.ratfun__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), new Item[](0), itemsToRemove, new Item[](0));
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
    setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    bytes32 ratId = world.ratfun__createRat("roger");
    vm.stopPrank();

    uint256 initialBalance = setInitialBalance(bob);
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
    startGasReport("Apply outcome (transfer to rat)");
    world.ratfun__applyOutcome(ratId, roomId, 0, 20, new bytes32[](0), new Item[](0), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // 0 + 20
    assertEq(Balance.get(ratId), 20);
    // Initial room balance - 20
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 20);
    // Initial bob balance - ROOM_CREATION_COST
    assertEq(
      LibWorld.erc20().balanceOf(bob),
      initialBalance - GameConfig.getRoomCreationCost() * 10 ** LibWorld.erc20().decimals()
    );
  }

  function testApplyOutcomeTransferToRoom() public {
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
    world.ratfun__applyOutcome(ratId, roomId, 0, 50, new bytes32[](0), new Item[](0), new bytes32[](0), new Item[](0));
    startGasReport("Apply outcome (transfer to room)");
    world.ratfun__applyOutcome(ratId, roomId, 0, -20, new bytes32[](0), new Item[](0), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // 0 + 50 - 20
    assertEq(Balance.get(ratId), 30);
    // Initial room balance - 50 (transfer to rat) + 20 (transfer back to room)
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 50 + 20);
  }

  function testApplyOutcomeOverTransferToRat() public {
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
    startGasReport("Apply outcome (over transfer to rat)");
    world.ratfun__applyOutcome(
      ratId,
      roomId,
      0,
      int256(GameConfig.getRoomCreationCost() + 100),
      new bytes32[](0),
      new Item[](0),
      new bytes32[](0),
      new Item[](0)
    );
    endGasReport();
    vm.stopPrank();

    // 0 + half of room creation cost (because room can only give half of its creation cost)
    assertEq(Balance.get(ratId), GameConfig.getRoomCreationCost() / 2);
    // Half of room creation cost was given to rat
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() / 2);
  }

  function testApplyOutcomeOverTransferToRoom() public {
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
    world.ratfun__applyOutcome(ratId, roomId, 0, 50, new bytes32[](0), new Item[](0), new bytes32[](0), new Item[](0));
    startGasReport("Apply outcome (over transfer to room)");
    world.ratfun__applyOutcome(
      ratId,
      roomId,
      0,
      -200,
      new bytes32[](0),
      new Item[](0),
      new bytes32[](0),
      new Item[](0)
    );
    endGasReport();
    vm.stopPrank();

    // 0 + 50 - 50 (because rat only had 50 credits to give)
    assertEq(Balance.get(ratId), 0);
    // Initial room balance - 50 + 50
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 50 + 50);
  }

  // * * * * * * * *
  // Complex outcomes
  // * * * * * * * *

  // ...
}
