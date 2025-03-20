// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
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
    setUp();

    vm.startPrank(alice);
    world.ratroom__spawn("alice");

    vm.expectRevert("not allowed");
    world.ratroom__applyOutcome(
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

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (empty)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), new Item[](0), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();
  }

  // * * * *
  // Health
  // * * * *

  function testApplyOutcomeIncreaseHealth() public {
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

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (increase health)");
    world.ratroom__applyOutcome(ratId, roomId, 20, 0, new bytes32[](0), new Item[](0), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // 100 + 20
    assertEq(Health.get(ratId), 120);
    // 100 - 20 - 33 (CREATOR_FEE)
    assertEq(Balance.get(roomId), 47);
  }

  function testApplyOutcomeReduceHealth() public {
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

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (reduce health)");
    world.ratroom__applyOutcome(
      ratId,
      roomId,
      -20,
      0,
      new bytes32[](0),
      new Item[](0),
      new bytes32[](0),
      new Item[](0)
    );
    endGasReport();
    vm.stopPrank();

    // 100 - 20
    assertEq(Health.get(ratId), 80);
    // 100 + 20 - 33 (CREATOR_FEE)
    assertEq(Balance.get(roomId), 87);
  }

  function testApplyOutcomeOverIncreaseHealth() public {
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

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (over-increase health)");
    world.ratroom__applyOutcome(
      ratId,
      roomId,
      200,
      0,
      new bytes32[](0),
      new Item[](0),
      new bytes32[](0),
      new Item[](0)
    );
    endGasReport();
    vm.stopPrank();

    // 100 +  67 (because room only had 95 credits to give after creator fee)
    assertEq(Health.get(ratId), 167);
    // 100 - 67 - 33 (CREATOR_FEE)
    assertEq(Balance.get(roomId), 0);
  }

  function testApplyOutcomeOverReduceHealth() public {
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

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (over-reduce health)");
    world.ratroom__applyOutcome(
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
    // 100 + 100 (because rat only had 100 health to give) - 33 (CREATOR_FEE)
    assertEq(Balance.get(roomId), 167);
  }

  function testApplyOutcomeValueTransferOnDeath() public {
    setUp();

    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    world.ratroom__givePlayerBalance(1000);
    bytes32 roomId = world.ratroom__createRoom("test room", "test room");
    vm.stopPrank();

    // Traits to add
    Item[] memory newTraits = new Item[](2);
    newTraits[0] = Item("happy", 20);
    newTraits[1] = Item("sad", -20);

    // Item to add
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("cheese", 30);

    // As admin
    prankAdmin();

    // Add traits and items and transfer balance to rat
    world.ratroom__applyOutcome(ratId, roomId, 0, 20, new bytes32[](0), newTraits, new bytes32[](0), newItems);

    // Room balance:
    // Traits cancel out
    // 100 - 20 (balance transfer) - 30 (item) - 33 (CREATOR_FEE)
    assertEq(Balance.get(roomId), 17);

    // Check balance transfer to creator
    // 1000 (initial credits) - 100 (ROOM_CREATION_COST) + 33 (CREATOR_FEE)
    assertEq(Balance.get(bobId), 933);

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
    assertEq(Value.get(traits[1]), -20);

    // Check that items are added
    bytes32[] memory items = Inventory.get(ratId);
    assertEq(items.length, 1);
    assertEq(Name.get(items[0]), "cheese");
    assertEq(Value.get(items[0]), 30);

    startGasReport("Apply outcome (value transfer on death)");
    world.ratroom__applyOutcome(
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

    // Rat is dead
    assertEq(Health.get(ratId), 0);
    assertTrue(Dead.get(ratId));
    // Rat is cleared
    assertEq(Balance.get(ratId), 0);
    assertEq(Traits.get(ratId).length, 0);
    assertEq(Inventory.get(ratId).length, 0);
    // Room balance:
    // 17 (pre-change balance) + 100 (health from rat) + 20 (balance) + 20 (positive trait) + 30 (positive item) - 17 (!!!!) (CREATOR_FEE)
    // TODO: Change claculation of creator fee?
    assertEq(Balance.get(roomId), 170);
  }

  // * * * *
  // Traits
  // * * * *

  function testApplyOutcomeAddPositiveTrait() public {
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
    Item[] memory newTraits = new Item[](1);
    newTraits[0] = Item("happy", 40);

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (add positive trait)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), newTraits, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Check added trait
    assertEq(Traits.get(ratId).length, 1);
    assertEq(Value.get(Traits.get(ratId)[0]), 40);
    assertEq(Name.get(Traits.get(ratId)[0]), "happy");

    // 100 - 40 - 33  (CREATOR_FEE)
    assertEq(Balance.get(roomId), 27);
  }

  function testApplyOutcomeAddNegativeTrait() public {
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
    Item[] memory newTraits = new Item[](1);
    newTraits[0] = Item("sad", -40);

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (add negative trait)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), newTraits, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Check added trait
    assertEq(Traits.get(ratId).length, 1);
    assertEq(Value.get(Traits.get(ratId)[0]), -40);
    assertEq(Name.get(Traits.get(ratId)[0]), "sad");

    // 100 + 40 - 33 (CREATOR_FEE)
    assertEq(Balance.get(roomId), 107);
  }

  function testApplyOutcomeAddPositiveTraitTooExpensive() public {
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
    Item[] memory newTraits = new Item[](1);
    newTraits[0] = Item("happy", 400);

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (add positive trait: too expensive)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), newTraits, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Not enough room balance, so only creator fee is subtracted
    assertEq(Traits.get(ratId).length, 0);
    // 100 - 33 (CREATOR_FEE)
    assertEq(Balance.get(roomId), 67);
  }

  function testApplyOutcomeRemovePositiveTrait() public {
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
    Item[] memory newTraits = new Item[](1);
    newTraits[0] = Item("happy", 40);

    // As admin
    prankAdmin();
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), newTraits, new bytes32[](0), new Item[](0));
    vm.stopPrank();

    // Check added trait
    bytes32 traitId = Traits.get(ratId)[0];
    assertEq(Traits.get(ratId).length, 1);
    assertEq(Value.get(traitId), 40);
    assertEq(Name.get(traitId), "happy");

    // 100 - 40 - 33 (CREATOR_FEE)
    assertEq(Balance.get(roomId), 27);

    bytes32[] memory traitsToRemove = new bytes32[](1);
    traitsToRemove[0] = traitId;

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (remove positive trait)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, traitsToRemove, new Item[](0), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // 27 (pre-change balance) + 40 (positive trait) - 27 !!!! (CREATOR_FEE)
    assertEq(Balance.get(roomId), 40);
    assertEq(Traits.get(ratId).length, 0);
  }

  function testApplyOutcomeRemoveNegativeTrait() public {
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
    Item[] memory newTraits = new Item[](1);
    newTraits[0] = Item("sad", -40);

    // As admin
    prankAdmin();
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), newTraits, new bytes32[](0), new Item[](0));
    vm.stopPrank();

    // Check added trait
    bytes32 traitId = Traits.get(ratId)[0];
    assertEq(Traits.get(ratId).length, 1);
    assertEq(Value.get(traitId), -40);
    assertEq(Name.get(traitId), "sad");

    // 100 + 40 - 33 (CREATOR_FEE)
    assertEq(Balance.get(roomId), 107);

    bytes32[] memory traitsToRemove = new bytes32[](1);
    traitsToRemove[0] = traitId;

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (remove negative trait)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, traitsToRemove, new Item[](0), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // 107 (pre-change balance) - 40 (negative trait) - 33 (CREATOR_FEE)
    assertEq(Balance.get(roomId), 34);
    assertEq(Traits.get(ratId).length, 0);
  }

  // function testApplyOutcomeRemoveNegativeTraitTooExpensive() public {
  //   setUp();

  //   // As alice
  //   vm.startPrank(alice);
  //   world.ratroom__spawn("alice");
  //   bytes32 ratId = world.ratroom__createRat("roger");
  //   vm.stopPrank();

  //   // As bob
  //   vm.startPrank(bob);
  //   world.ratroom__spawn("bob");
  //   world.ratroom__givePlayerBalance(1000);
  //   bytes32 roomId = world.ratroom__createRoom("test room", "test room");
  //   vm.stopPrank();

  //   // Trait to add
  //   Item[] memory newTraits = new Item[](1);
  //   newTraits[0] = Item("sad", -40);

  //   // As admin
  //   prankAdmin();
  //   world.ratroom__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), newTraits, new bytes32[](0), new Item[](0));
  //   vm.stopPrank();

  //   // Check added trait
  //   bytes32 traitId = Traits.get(ratId)[0];
  //   assertEq(Traits.get(ratId).length, 1);
  //   assertEq(Value.get(traitId), -40);
  //   assertEq(Name.get(traitId), "sad");

  //   // 100 + 40 - 33 (CREATOR_FEE)
  //   assertEq(Balance.get(roomId), 107);

  //   bytes32[] memory traitsToRemove = new bytes32[](1);
  //   traitsToRemove[0] = traitId;

  //   // As admin
  //   prankAdmin();
  //   // Transfer 120 to rat
  //   world.ratroom__applyOutcome(
  //     ratId,
  //     roomId,
  //     0,
  //     120,
  //     new bytes32[](0),
  //     new Item[](0),
  //     new bytes32[](0),
  //     new Item[](0)
  //   );

  //   // 135 - 120 - 33 (CREATOR_FEE)
  //   assertEq(Balance.get(roomId), 10);

  //   startGasReport("Apply outcome (remove negative trait: too expensive)");
  //   world.ratroom__applyOutcome(ratId, roomId, 0, 0, traitsToRemove, new Item[](0), new bytes32[](0), new Item[](0));
  //   endGasReport();
  //   vm.stopPrank();

  //   // Trait not removed because not enough room balance
  //   assertEq(Traits.get(ratId).length, 1);
  //   assertEq(Value.get(traitId), -40);
  //   assertEq(Name.get(traitId), "sad");
  //   // 10 - 5 (CREATOR_FEE)
  //   assertEq(Balance.get(roomId), 5);
  // }

  // // * * * *
  // // Items
  // // * * * *

  function testApplyOutcomeAddPositiveItem() public {
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
    startGasReport("Apply outcome (add positive item)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), new Item[](0), new bytes32[](0), newItems);
    endGasReport();
    vm.stopPrank();

    // Check added item
    assertEq(Inventory.get(ratId).length, 1);
    assertEq(Value.get(Inventory.get(ratId)[0]), 40);
    assertEq(Name.get(Inventory.get(ratId)[0]), "cheese");

    // 100 - 40 - 33 (CREATOR_FEE)
    assertEq(Balance.get(roomId), 27);
  }

  function testApplyOutcomeAddNegativeItem() public {
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
    newItems[0] = Item("rotten cheese", -40);

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (add negative item)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), new Item[](0), new bytes32[](0), newItems);
    endGasReport();
    vm.stopPrank();

    // Check added item
    assertEq(Inventory.get(ratId).length, 1);
    // Items should always be positive
    // Negative values will be converted to positive
    assertEq(Value.get(Inventory.get(ratId)[0]), 40);
    assertEq(Name.get(Inventory.get(ratId)[0]), "rotten cheese");

    // 100 - 40 - 33 (CREATOR_FEE)
    assertEq(Balance.get(roomId), 27);
  }

  function testApplyOutcomeAddPositiveItemTooExpensive() public {
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
    // Item to add
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("cheese", 200);

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (add positive item: too expensive)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), new Item[](0), new bytes32[](0), newItems);
    endGasReport();
    vm.stopPrank();

    // Not enough room balance
    assertEq(Inventory.get(ratId).length, 0);
    // 100 - 33 (CREATOR_FEE)
    assertEq(Balance.get(roomId), 67);
  }

  function testApplyOutcomeRemovePositiveItem() public {
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

    // Check added item
    bytes32 itemId = Inventory.get(ratId)[0];
    assertEq(Inventory.get(ratId).length, 1);
    assertEq(Value.get(itemId), 40);
    assertEq(Name.get(itemId), "cheese");

    // 100 - 40 - 33 (CREATOR_FEE)
    assertEq(Balance.get(roomId), 27);

    bytes32[] memory itemsToRemove = new bytes32[](1);
    itemsToRemove[0] = itemId;

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (remove positive item)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), new Item[](0), itemsToRemove, new Item[](0));
    endGasReport();
    vm.stopPrank();

    // 27 + 40 - 27 !!! (CREATOR_FEE)
    assertEq(Balance.get(roomId), 40);
    assertEq(Inventory.get(ratId).length, 0);
  }

  // // * * * * * * * * *
  // // Balance transfer
  // // * * * * * * * * *

  function testApplyOutcomeTransferToRat() public {
    setUp();

    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    world.ratroom__givePlayerBalance(1000);
    bytes32 roomId = world.ratroom__createRoom("test room", "test room");
    vm.stopPrank();

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (transfer to rat)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 20, new bytes32[](0), new Item[](0), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // 0 + 20
    assertEq(Balance.get(ratId), 20);
    // 100 - 20 - 33  (CREATOR_FEE)
    assertEq(Balance.get(roomId), 47);
    // 1000 (initial credits) - 100 (ROOM_CREATION_COST) + 33 (CREATOR_FEE)
    assertEq(Balance.get(bobId), 933);
  }

  function testApplyOutcomeTransferToRoom() public {
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

    // As admin
    prankAdmin();
    world.ratroom__applyOutcome(ratId, roomId, 0, 50, new bytes32[](0), new Item[](0), new bytes32[](0), new Item[](0));
    startGasReport("Apply outcome (transfer to room)");
    world.ratroom__applyOutcome(
      ratId,
      roomId,
      0,
      -20,
      new bytes32[](0),
      new Item[](0),
      new bytes32[](0),
      new Item[](0)
    );
    endGasReport();
    vm.stopPrank();

    // 0 + 50 - 20
    assertEq(Balance.get(ratId), 30);
    // TODO: Figure out why this is 20
    assertEq(Balance.get(roomId), 20);
  }

  function testApplyOutcomeOverTransferToRat() public {
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

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (over transfer to rat)");
    world.ratroom__applyOutcome(
      ratId,
      roomId,
      0,
      200,
      new bytes32[](0),
      new Item[](0),
      new bytes32[](0),
      new Item[](0)
    );
    endGasReport();
    vm.stopPrank();

    // 0 + 67 (because room only had 95 credits to give)
    assertEq(Balance.get(ratId), 67);
    // 100 - 67 - 33 (CREATOR_FEE)
    assertEq(Balance.get(roomId), 0);
  }

  function testApplyOutcomeOverTransferToRoom() public {
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

    // As admin
    prankAdmin();
    world.ratroom__applyOutcome(ratId, roomId, 0, 50, new bytes32[](0), new Item[](0), new bytes32[](0), new Item[](0));
    startGasReport("Apply outcome (over transfer to room)");
    world.ratroom__applyOutcome(
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
    // 100 - 50 + 50 - 2 x 33 (CREATOR_FEE)
    // TODO: Figure out why this is 50
    assertEq(Balance.get(roomId), 50);
  }

  // * * * * * * * *
  // Complex outcomes
  // * * * * * * * *

  // ...
}
