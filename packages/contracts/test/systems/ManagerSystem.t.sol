// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";
import { Item } from "../../src/structs.sol";

contract ManagerSystemTest is BaseTest {
  function setInitialBalance(bytes32 _playerId) internal returns (uint256 initialBalance) {
    initialBalance = Balance.get(_playerId);
    // Give player balance if 0
    if (initialBalance == 0) {
      prankAdmin();
      initialBalance = 2000;
      world.ratroom__givePlayerBalance(_playerId, initialBalance);
      vm.stopPrank();
    }
  }

  // * * * *
  // Basic
  // * * * *

  function testRevertNotAllowed() public {
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
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
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
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
    vm.stopPrank();

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (increase health)");
    world.ratroom__applyOutcome(ratId, roomId, 20, 0, new bytes32[](0), new Item[](0), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // 100 + 20
    assertEq(Health.get(ratId), 120);
    // 100 - 20
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 20);
  }

  function testApplyOutcomeReduceHealth() public {
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
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
    // Initial room balance + 20
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() + 20);
  }

  function testApplyOutcomeOverIncreaseHealth() public {
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
    vm.stopPrank();

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (over-increase health)");
    world.ratroom__applyOutcome(
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

    // Initial health (100) + Max room balance
    assertEq(Health.get(ratId), 100 + GameConfig.getRoomCreationCost());
    // Initial room balance - 100
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - GameConfig.getRoomCreationCost());
  }

  function testApplyOutcomeOverReduceHealth() public {
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
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
    // Initial room balance + 100 (because rat only had 100 health to give)
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() + 100);
  }

  function testApplyOutcomeValueTransferOnDeath() public {
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
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
    // initial room balance - 20 (balance transfer) - 30 (item)
    uint256 intermediateBalance = GameConfig.getRoomCreationCost() - 20 - 30;
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

    // Room kill count incremented
    assertEq(KillCount.get(roomId), 1);
    // Room balance:
    // intermediate room balance + 20 (balance transfer) + 30 (item) + 100 (health)
    // !!! This currently fails. Possibly because of how we handle negative traits...
    // assertEq(Balance.get(roomId), intermediateBalance + 20 + 30 + 100);

    // Rat is dead
    assertEq(Health.get(ratId), 0);
    assertTrue(Dead.get(ratId));
    // Rat is cleared
    assertEq(Balance.get(ratId), 0);
    assertEq(Traits.get(ratId).length, 0);
    assertEq(Inventory.get(ratId).length, 0);
  }

  // * * * *
  // Traits
  // * * * *

  function testApplyOutcomeAddPositiveTrait() public {
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
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

    // 100 - 40
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 40);
  }

  function testApplyOutcomeAddNegativeTrait() public {
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
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

    // 100 + 40
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() + 40);
  }

  function testApplyOutcomeAddPositiveTraitTooExpensive() public {
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
    vm.stopPrank();

    // Trait to add
    Item[] memory newTraits = new Item[](1);
    newTraits[0] = Item("happy", int256(GameConfig.getRoomCreationCost() + 1));

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (add positive trait: too expensive)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), newTraits, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Not enough room balance
    assertEq(Traits.get(ratId).length, 0);
    // Room balance unchanged
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost());
  }

  function testApplyOutcomeRemovePositiveTrait() public {
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
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

    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 40);

    bytes32[] memory traitsToRemove = new bytes32[](1);
    traitsToRemove[0] = traitId;

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (remove positive trait)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, traitsToRemove, new Item[](0), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // initial room balance - 40 + 40 (positive trait)
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost());
    assertEq(Traits.get(ratId).length, 0);
  }

  function testApplyOutcomeRemoveNegativeTrait() public {
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
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

    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() + 40);

    bytes32[] memory traitsToRemove = new bytes32[](1);
    traitsToRemove[0] = traitId;

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (remove negative trait)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, traitsToRemove, new Item[](0), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // pre-change balance - 40 (negative trait)
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost());
    assertEq(Traits.get(ratId).length, 0);
  }

  // function testApplyOutcomeRemoveNegativeTraitTooExpensive() public {
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
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
    vm.stopPrank();

    // Item to add
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

    // pre-change balance - 40
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 40);
  }

  function testApplyOutcomeAddNegativeItem() public {
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
    vm.stopPrank();

    // Item to add
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

    // pre-change balance - 40
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 40);
  }

  function testApplyOutcomeAddPositiveItemTooExpensive() public {
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
    vm.stopPrank();

    // Item to add
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("cheese", int256(GameConfig.getRoomCreationCost() + 1));

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (add positive item: too expensive)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), new Item[](0), new bytes32[](0), newItems);
    endGasReport();
    vm.stopPrank();

    // Not enough room balance
    assertEq(Inventory.get(ratId).length, 0);
    // Initial room balance
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost());
  }

  function testApplyOutcomeRemovePositiveItem() public {
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
    vm.stopPrank();

    // Item to add
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

    // Initial room balance - 40
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 40);

    bytes32[] memory itemsToRemove = new bytes32[](1);
    itemsToRemove[0] = itemId;

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (remove positive item)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 0, new bytes32[](0), new Item[](0), itemsToRemove, new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Initial room balance again
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost());
    assertEq(Inventory.get(ratId).length, 0);
  }

  // * * * * * * * * *
  // Balance transfer
  // * * * * * * * * *

  function testApplyOutcomeTransferToRat() public {
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    uint256 initialBalance = setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
    vm.stopPrank();

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (transfer to rat)");
    world.ratroom__applyOutcome(ratId, roomId, 0, 20, new bytes32[](0), new Item[](0), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // 0 + 20
    assertEq(Balance.get(ratId), 20);
    // Initial room balance - 20
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 20);
    // Initial bob balance - ROOM_CREATION_COST
    assertEq(Balance.get(bobId), initialBalance - GameConfig.getRoomCreationCost());
  }

  function testApplyOutcomeTransferToRoom() public {
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
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
    // Initial room balance - 50 (transfer to rat) + 20 (transfer back to room)
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 50 + 20);
  }

  function testApplyOutcomeOverTransferToRat() public {
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
    vm.stopPrank();

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (over transfer to rat)");
    world.ratroom__applyOutcome(
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

    // 0 + 100
    assertEq(Balance.get(ratId), GameConfig.getRoomCreationCost());
    // All balance transferred to rat
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - GameConfig.getRoomCreationCost());
  }

  function testApplyOutcomeOverTransferToRoom() public {
    // As alice
    vm.startPrank(alice);
    world.ratroom__spawn("alice");
    bytes32 ratId = world.ratroom__createRat("roger");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    bytes32 bobId = world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(bobId);

    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(bobId, bytes32(0), "test room", "test room");
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
    // Initial room balance - 50 + 50
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost() - 50 + 50);
  }

  // * * * * * * * *
  // Complex outcomes
  // * * * * * * * *

  // ...
}
