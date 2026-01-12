// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { Item } from "../../src/structs.sol";
import { RAT_CREATION_COST } from "../../src/constants.sol";
import { console2 as console } from "forge-std/console2.sol";

contract ManagerSystemTest is BaseTest {
  bytes32 aliceId;
  bytes32 bobId;
  bytes32 ratId;
  bytes32 tripId;
  uint256 initialBalance;

  function setUp() public override {
    super.setUp();

    // Initialize alice, bob and their default rat and trip

    initialBalance = setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    aliceId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    ratId = world.ratfun__createRat("roger");
    vm.stopPrank();

    setInitialBalance(bob);
    // As bob
    vm.startPrank(bob);
    bobId = world.ratfun__spawn("bob");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    prankAdmin();
    tripId = world.ratfun__createTrip(bobId, bytes32(0), TRIP_INITIAL_BALANCE, false, 0, 0, "test trip");
    vm.stopPrank();
  }

  function _removeFromItemArray(
    Item[] memory _array,
    string memory _name
  ) internal pure returns (Item[] memory newArray) {
    bool found = false;
    uint256 foundIndex = 0;

    for (uint256 i = 0; i < _array.length; i++) {
      if (keccak256(bytes(_array[i].name)) == keccak256(bytes(_name))) {
        found = true;
        foundIndex = i;
        break;
      }
    }

    if (!found) {
      return _array;
    }

    newArray = new Item[](_array.length - 1);

    uint256 j = 0;
    for (uint256 i = 0; i < _array.length; i++) {
      if (i != foundIndex) {
        newArray[j] = _array[i];
        j++;
      }
    }

    return newArray;
  }

  // * * * *
  // Basic
  // * * * *

  function testRevertNotAllowed() public {
    vm.startPrank(alice);

    vm.expectRevert("not allowed");
    world.ratfun__applyOutcome(bytes32(0), bytes32(0), 0, new bytes32[](0), new Item[](0));

    vm.expectRevert("not allowed");
    world.ratfun__giveMasterKey(aliceId);

    vm.expectRevert("not allowed");
    world.ratfun__setWorldEvent("", "", "", 1);

    vm.expectRevert("not allowed");
    world.ratfun__removeWorldEvent();

    vm.expectRevert("not allowed");
    world.ratfun__setCooldownCloseTrip(10);

    vm.expectRevert("not allowed");
    world.ratfun__setMaxValuePerWin(10);

    vm.expectRevert("not allowed");
    world.ratfun__setMinRatValueToEnter(10);

    vm.expectRevert("not allowed");
    world.ratfun__setTaxationLiquidateRat(10);

    vm.expectRevert("not allowed");
    world.ratfun__setTaxationCloseTrip(10);

    vm.stopPrank();
  }

  function testApplyOutcomeEmpty() public {
    // As admin
    prankAdmin();
    startGasReport("Apply outcome (empty)");
    world.ratfun__applyOutcome(ratId, tripId, 0, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    assertEq(VisitCount.get(tripId), 1);
    assertEq(TripCount.get(ratId), 1);
    // Check last visit block
    assertEq(LastVisitBlock.get(tripId), block.number);
  }

  function testRevertNotRat() public {
    prankAdmin();

    vm.expectRevert("not rat");
    world.ratfun__applyOutcome(bytes32(0), tripId, 0, new bytes32[](0), new Item[](0));

    vm.stopPrank();
  }

  function testRevertRatIsDead() public {
    prankAdmin();

    Dead.set(ratId, true);
    vm.expectRevert("rat is dead");
    world.ratfun__applyOutcome(ratId, tripId, 0, new bytes32[](0), new Item[](0));

    vm.stopPrank();
  }

  function testRevertNotTrip() public {
    prankAdmin();

    vm.expectRevert("not trip");
    world.ratfun__applyOutcome(ratId, bytes32(0), 0, new bytes32[](0), new Item[](0));

    vm.stopPrank();
  }

  function testRevertRatValueTooLow() public {
    prankAdmin();

    // Set rat balance to just below the minimum required to enter the trip
    Balance.set(ratId, LibTrip.getMinRatValueToEnter(tripId) - 1);

    vm.expectRevert("rat value too low");
    world.ratfun__applyOutcome(ratId, tripId, 0, new bytes32[](0), new Item[](0));

    vm.stopPrank();
  }

  function testRevertNoTripBalance() public {
    prankAdmin();

    // Deplete trip balance
    Balance.set(tripId, 0);

    vm.expectRevert("no trip balance");
    world.ratfun__applyOutcome(ratId, tripId, 0, new bytes32[](0), new Item[](0));

    vm.stopPrank();
  }

  // * * * *
  // Items
  // * * * *

  function testApplyOutcomeAddItem() public {
    // Item to add
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("cheese", 40);

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (add item)");
    world.ratfun__applyOutcome(ratId, tripId, 0, new bytes32[](0), newItems);
    endGasReport();
    vm.stopPrank();

    // Check added item
    assertEq(Inventory.length(ratId), 1);
    assertEq(Value.get(Inventory.getItem(ratId, 0)), 40);
    assertEq(Name.get(Inventory.getItem(ratId, 0)), "cheese");

    // pre-change balance - 40
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE - 40);
  }

  function testApplyOutcomeAddItemTooExpensive() public {
    // Item to add
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("cheese", TRIP_INITIAL_BALANCE + 1);

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (add item: too expensive)");
    world.ratfun__applyOutcome(ratId, tripId, 0, new bytes32[](0), newItems);
    endGasReport();
    vm.stopPrank();

    // Not enough trip balance
    assertEq(Inventory.length(ratId), 0);
    // Initial trip balance
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE);
  }

  function testApplyOutcomeAddItemInventoryFull() public {
    uint256 maxInventorySize = GameConfig.getMaxInventorySize();

    // Item to add
    Item[] memory newItems = new Item[](maxInventorySize);

    for (uint256 i = 0; i < maxInventorySize; i++) {
      newItems[i] = Item(string.concat("cheese ", Strings.toString(i)), 1);
    }

    // As admin
    prankAdmin();
    world.ratfun__applyOutcome(ratId, tripId, 0, new bytes32[](0), newItems);
    vm.stopPrank();

    // Check inventory length
    assertEq(Inventory.length(ratId), maxInventorySize);

    Item[] memory extraItems = new Item[](3);
    extraItems[0] = Item("extra cheese", 1);
    extraItems[1] = Item("extra cheese 2", 1);
    extraItems[2] = Item("extra cheese 3", 1);

    prankAdmin();
    world.ratfun__applyOutcome(ratId, tripId, 0, new bytes32[](0), extraItems);
    vm.stopPrank();

    // Inventory length should still be maxInventorySize
    assertEq(Inventory.length(ratId), maxInventorySize);
  }

  function testApplyOutcomeRemoveItem() public {
    // Item to add
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("cheese", 40);

    // As admin
    prankAdmin();
    world.ratfun__applyOutcome(ratId, tripId, 0, new bytes32[](0), newItems);
    vm.stopPrank();

    // Check added item
    bytes32 itemId = Inventory.getItem(ratId, 0);
    assertEq(Inventory.length(ratId), 1);
    assertEq(Value.get(itemId), 40);
    assertEq(Name.get(itemId), "cheese");

    // Initial trip balance - 40
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE - 40);

    bytes32[] memory itemsToRemove = new bytes32[](1);
    itemsToRemove[0] = itemId;

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (remove item)");
    world.ratfun__applyOutcome(ratId, tripId, 0, itemsToRemove, new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Initial trip balance again
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE);
    assertEq(Inventory.length(ratId), 0);
  }

  function testApplyOutcomeRemoveItemsFromDifferentArrayPositions() public {
    uint256 maxInventorySize = GameConfig.getMaxInventorySize();

    // Items to add
    Item[] memory newItems = new Item[](maxInventorySize);

    for (uint256 i = 0; i < maxInventorySize; i++) {
      newItems[i] = Item(string.concat("cheese ", Strings.toString(i)), 1);
    }

    // As admin
    prankAdmin();
    world.ratfun__applyOutcome(ratId, tripId, 0, new bytes32[](0), newItems);
    vm.stopPrank();

    // Check initial inventory length and trip balance
    assertEq(Inventory.length(ratId), maxInventorySize);
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE - maxInventorySize);

    // Remove item from middle
    bytes32[] memory itemsToRemove = new bytes32[](1);
    itemsToRemove[0] = Inventory.getItem(ratId, maxInventorySize / 2);

    Item[] memory resultItems = newItems;
    resultItems = _removeFromItemArray(resultItems, string.concat("cheese ", Strings.toString(maxInventorySize / 2)));

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (remove item from middle of full inventory)");
    world.ratfun__applyOutcome(ratId, tripId, 0, itemsToRemove, new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Check balance and items after removal
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE - (maxInventorySize - 1));
    assertEq(Inventory.length(ratId), maxInventorySize - 1);
    for (uint256 i = 0; i < Inventory.length(ratId); i++) {
      bytes32 itemId = Inventory.getItem(ratId, i);
      assertEq(Name.get(itemId), resultItems[i].name);
    }

    // Remove item from end
    itemsToRemove[0] = Inventory.getItem(ratId, Inventory.length(ratId) - 1);
    resultItems = _removeFromItemArray(resultItems, string.concat("cheese ", Strings.toString(maxInventorySize - 1)));

    // As admin
    prankAdmin();
    world.ratfun__applyOutcome(ratId, tripId, 0, itemsToRemove, new Item[](0));
    vm.stopPrank();

    // Check balance and items after removal
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE - (maxInventorySize - 2));
    assertEq(Inventory.length(ratId), maxInventorySize - 2);
    for (uint256 i = 0; i < Inventory.length(ratId); i++) {
      bytes32 itemId = Inventory.getItem(ratId, i);
      assertEq(Name.get(itemId), resultItems[i].name);
    }

    // Remove item from start
    itemsToRemove[0] = Inventory.getItem(ratId, 0);
    resultItems = _removeFromItemArray(resultItems, string.concat("cheese 0"));

    // As admin
    prankAdmin();
    world.ratfun__applyOutcome(ratId, tripId, 0, itemsToRemove, new Item[](0));
    vm.stopPrank();

    // Check balance and items after removal
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE - (maxInventorySize - 3));
    assertEq(Inventory.length(ratId), maxInventorySize - 3);
    for (uint256 i = 0; i < Inventory.length(ratId); i++) {
      bytes32 itemId = Inventory.getItem(ratId, i);
      assertEq(Name.get(itemId), resultItems[i].name);
    }
  }

  // * * * * * * * * *
  // Balance transfer
  // * * * * * * * * *

  function testApplyOutcomeTransferToRat() public {
    // As admin
    prankAdmin();
    startGasReport("Apply outcome (transfer to rat)");
    world.ratfun__applyOutcome(ratId, tripId, 20, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Initial balance + 20
    assertEq(Balance.get(ratId), RAT_CREATION_COST + 20);
    // Initial trip balance - 20
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE - 20);
    // Initial bob balance - TRIP_CREATION_COST
    assertEq(
      LibWorld.erc20().balanceOf(bob),
      initialBalance - TRIP_INITIAL_BALANCE * 10 ** LibWorld.erc20().decimals()
    );
  }

  function testApplyOutcomeTransferToTrip() public {
    // As admin
    prankAdmin();
    world.ratfun__applyOutcome(ratId, tripId, 50, new bytes32[](0), new Item[](0));
    startGasReport("Apply outcome (transfer to trip)");
    world.ratfun__applyOutcome(ratId, tripId, -20, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Initial balance + 50 - 20
    assertEq(Balance.get(ratId), RAT_CREATION_COST + 30);
    // Initial trip balance - 50 (transfer to rat) + 20 (transfer back to trip)
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE - 50 + 20);
  }

  function testApplyOutcomeOverTransferToRat() public {
    // As admin - try to transfer more than trip balance to rat
    prankAdmin();
    // Set maxValuePerWin to 1000% so only trip balance can possibly limit the transfer
    GamePercentagesConfig.setMaxValuePerWin(1000);

    startGasReport("Apply outcome (over transfer to rat)");
    world.ratfun__applyOutcome(ratId, tripId, int256(TRIP_INITIAL_BALANCE + 100), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Balance transfer can not exceed trip balance
    assertEq(Balance.get(ratId), RAT_CREATION_COST + TRIP_INITIAL_BALANCE);
    assertEq(Balance.get(tripId), 0);
  }

  function testApplyOutcomeOverTransferToTrip() public {
    // As admin
    prankAdmin();
    world.ratfun__applyOutcome(ratId, tripId, 50, new bytes32[](0), new Item[](0));
    startGasReport("Apply outcome (over transfer to trip)");
    world.ratfun__applyOutcome(ratId, tripId, -200, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Rat should have 0 balance and be dead
    assertEq(Balance.get(ratId), 0);
    assertTrue(Dead.get(ratId));
    // Initial trip balance + RAT_CREATION_COST
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE + RAT_CREATION_COST);
  }

  // * * * *
  // Death
  // * * * *

  function testApplyOutcomeValueTransferOnDeath() public {
    // Item to add
    Item[] memory newItems = new Item[](2);
    newItems[0] = Item("cheese", 10);
    newItems[1] = Item("stick", 20);

    // As admin
    prankAdmin();

    // Add items and transfer balance to rat
    world.ratfun__applyOutcome(ratId, tripId, 20, new bytes32[](0), newItems);

    // Trip balance:
    // initial trip balance - 20 (balance transfer) - 30 (items)
    uint256 intermediateTripBalance = TRIP_INITIAL_BALANCE - 20 - 30;
    assertEq(Balance.get(tripId), intermediateTripBalance);

    // Check rat balance
    // Initial balance + 20 (balance transfer)
    uint256 intermediateRatBalance = RAT_CREATION_COST + 20;
    assertEq(Balance.get(ratId), intermediateRatBalance);

    // Check that items are added
    bytes32[] memory items = Inventory.get(ratId);
    assertEq(items.length, 2);
    assertEq(Name.get(items[0]), "cheese");
    assertEq(Value.get(items[0]), 10);
    assertEq(Name.get(items[1]), "stick");
    assertEq(Value.get(items[1]), 20);

    startGasReport("Apply outcome (value transfer on death)");
    world.ratfun__applyOutcome(ratId, tripId, -int256(intermediateRatBalance), new bytes32[](0), new Item[](0));
    endGasReport();

    vm.stopPrank();

    // Trip kill count incremented
    assertEq(KillCount.get(tripId), 1);

    // Trip balance:
    // intermediate trip balance + intermediate rat balance + 30 (items)
    assertEq(Balance.get(tripId), intermediateTripBalance + intermediateRatBalance + 30);

    // Rat is dead
    assertTrue(Dead.get(ratId));

    // Rat balance is 0
    assertEq(Balance.get(ratId), 0);

    // Global stats set
    assertEq(WorldStats.getGlobalRatKillCount(), 1);
    assertEq(WorldStats.getLastKilledRatBlock(), block.number);
  }

  // * * * *
  // Trip Budget Limits
  // * * * *

  function testTripCannotExceedMaxValuePerWin() public {
    uint256 maxValuePerWin = LibTrip.getMaxValuePerWin(tripId);

    // Verify trip setup
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE); // Trip has 200 balance
    assertTrue(Balance.get(tripId) > maxValuePerWin); // Trip balance > maxValuePerWin

    // Try to transfer more than maxValuePerWin to rat
    int256 transferAmount = int256(maxValuePerWin + 1);

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (trip budget limit)");
    world.ratfun__applyOutcome(ratId, tripId, transferAmount, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Verify that only maxValuePerWin was transferred, not the full amount
    assertEq(Balance.get(ratId), RAT_CREATION_COST + maxValuePerWin);
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE - maxValuePerWin);
  }

  function testTripBudgetLimitedByBalance() public {
    // As admin - set maxValuePerWin to 50% and reduce trip balance to be a bit below that
    prankAdmin();
    GamePercentagesConfig.setMaxValuePerWin(50);
    uint256 alteredTripBalance = TRIP_INITIAL_BALANCE / 2 - 1;
    Balance.set(tripId, alteredTripBalance);
    vm.stopPrank();

    // Verify trip setup
    uint256 maxValuePerWin = LibTrip.getMaxValuePerWin(tripId);
    assertEq(Balance.get(tripId), alteredTripBalance);
    // Trip balance should be equal to maxValuePerWin (which is based on creation cost here, and capped by the balance)
    assertEq(Balance.get(tripId), maxValuePerWin);

    // Try to transfer more than trip balance to rat
    int256 transferAmount = int256(maxValuePerWin);

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (trip balance limit)");
    world.ratfun__applyOutcome(ratId, tripId, transferAmount, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Verify that only trip balance was transferred, not maxValuePerWin
    assertEq(Balance.get(ratId), RAT_CREATION_COST + alteredTripBalance);
    assertEq(Balance.get(tripId), 0); // Trip balance exhausted
  }

  function testTripBudgetIncreasedByRatValueAndItemLoss() public {
    uint256 maxValuePerWin = LibTrip.getMaxValuePerWin(tripId);
    assertGt(maxValuePerWin, 0);

    // Add initial item worth 20
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("cheese", 20);

    // As admin
    prankAdmin();
    world.ratfun__applyOutcome(ratId, tripId, 0, new bytes32[](0), newItems);
    vm.stopPrank();

    // Transfer value of 30 from rat to trip
    int256 transferAmount = -30;
    // Remove the item worth 20 from rat
    bytes32[] memory itemsToRemove = new bytes32[](1);
    itemsToRemove[0] = Inventory.getItem(ratId, 0);
    // But give rat an item worth more than maxValuePerWin by 50 (removed item + rat value loss)
    newItems = new Item[](1);
    newItems[0] = Item("cheese 2", maxValuePerWin + 50);

    // As admin
    prankAdmin();
    world.ratfun__applyOutcome(ratId, tripId, transferAmount, itemsToRemove, newItems);
    vm.stopPrank();

    assertEq(Inventory.length(ratId), 1);
    assertEq(Name.get(Inventory.getItem(ratId, 0)), "cheese 2");
    assertEq(Value.get(Inventory.getItem(ratId, 0)), maxValuePerWin + 50);
    assertEq(Balance.get(ratId), RAT_CREATION_COST - 30);
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE + 30 - maxValuePerWin - 50);
  }

  function testRemoveItemNotOwnedByRat() public {
    // Create another rat (eve's rat) with an item
    setInitialBalance(eve);
    vm.startPrank(eve);
    world.ratfun__spawn("eve");
    approveGamePool(type(uint256).max);
    bytes32 eveRatId = world.ratfun__createRat("eveRat");
    vm.stopPrank();

    // Give eve's rat an item worth 50 (within trip budget)
    // Note: maxValuePerWin is 25% of TRIP_INITIAL_BALANCE (250) = 62.5
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("expensive_item", 50);

    prankAdmin();
    world.ratfun__applyOutcome(eveRatId, tripId, 0, new bytes32[](0), newItems);
    vm.stopPrank();

    // Get the item ID from eve's rat
    bytes32 eveItemId = Inventory.getItem(eveRatId, 0);
    assertEq(Value.get(eveItemId), 50);
    assertEq(Inventory.length(eveRatId), 1);

    // Verify initial state for alice's rat
    uint256 aliceRatInventoryLength = Inventory.length(ratId);
    uint256 initialTripBalance = Balance.get(tripId);
    assertEq(aliceRatInventoryLength, 0, "Alice's rat should have no items");

    // Try to "remove" Eve's item from Alice's rat
    bytes32[] memory itemsToRemove = new bytes32[](1);
    itemsToRemove[0] = eveItemId;

    prankAdmin();
    world.ratfun__applyOutcome(ratId, tripId, 0, itemsToRemove, new Item[](0));
    vm.stopPrank();

    // Alice's rat inventory is unchanged (doesn't own the item)
    assertEq(Inventory.length(ratId), aliceRatInventoryLength, "Alice's rat inventory should be unchanged");

    // Eve's rat still has the item
    assertEq(Inventory.length(eveRatId), 1, "Eve's rat should still have the item");

    // Trip balance should be unchanged as no item was removed
    assertEq(Balance.get(tripId), initialTripBalance);
  }

  function testRemoveNonExistentItemId() public {
    // Add a real item to alice's rat
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("cheese", 40);

    prankAdmin();
    world.ratfun__applyOutcome(ratId, tripId, 0, new bytes32[](0), newItems);
    vm.stopPrank();

    // Verify initial state
    uint256 initialRatInventoryLength = Inventory.length(ratId);
    uint256 initialTripBalance = Balance.get(tripId);
    assertEq(initialRatInventoryLength, 1);
    assertEq(initialTripBalance, TRIP_INITIAL_BALANCE - 40);

    // Try to remove a completely random item ID that doesn't exist anywhere
    bytes32[] memory itemsToRemove = new bytes32[](1);
    itemsToRemove[0] = bytes32(uint256(0xdeadbeefdeadbeefdeadbeefdeadbeef));

    prankAdmin();
    world.ratfun__applyOutcome(ratId, tripId, 0, itemsToRemove, new Item[](0));
    vm.stopPrank();

    // Nothing should have changed - no revert, just silently ignored
    assertEq(Inventory.length(ratId), initialRatInventoryLength, "Rat inventory should be unchanged");
    assertEq(Balance.get(tripId), initialTripBalance, "Trip balance should be unchanged");
  }

  // * * * * * * * * * * * * * * * * * *
  // Item Removal Budget Contribution
  // * * * * * * * * * * * * * * * * * *

  /**
   * @notice Tests that item removal value should be available for balance transfer
   * @dev This test demonstrates the desired behavior where removing an item
   *      adds its value to the available budget BEFORE the balance transfer is applied.
   *
   *      Scenario:
   *      - Trip balance: 1000
   *      - Rat has item worth 100
   *      - LLM removes item and requests transfer of 1100 (1000 trip + 100 item value)
   *
   *      Current behavior (bug): Transfer is capped to 1000, item removal adds 100 back to trip
   *      Desired behavior: Item removal happens first, making 1100 available for transfer
   */
  function testItemRemovalValueAvailableForBalanceTransfer() public {
    // Set up: high maxValuePerWin so only trip balance limits transfer
    prankAdmin();
    GamePercentagesConfig.setMaxValuePerWin(100); // 100% so no percentage limit
    vm.stopPrank();

    // Set trip balance to exactly 1000
    uint256 tripBalance = 1000;
    prankAdmin();
    Balance.set(tripId, tripBalance);
    vm.stopPrank();

    // Give rat an item worth 100
    uint256 itemValue = 100;
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("valuable_item", itemValue);

    prankAdmin();
    world.ratfun__applyOutcome(ratId, tripId, 0, new bytes32[](0), newItems);
    vm.stopPrank();

    // Verify setup: trip has 900 (1000 - 100 for item), rat has 1 item
    assertEq(Balance.get(tripId), tripBalance - itemValue, "Trip should have 900 after giving item");
    assertEq(Inventory.length(ratId), 1, "Rat should have 1 item");

    // Reset trip balance to 1000 for the actual test scenario
    prankAdmin();
    Balance.set(tripId, tripBalance);
    vm.stopPrank();

    // Now the scenario: trip has 1000, rat has item worth 100
    // LLM says: remove item, give rat 1100 (full trip balance + item value)
    uint256 initialRatBalance = Balance.get(ratId);
    bytes32[] memory itemsToRemove = new bytes32[](1);
    itemsToRemove[0] = Inventory.getItem(ratId, 0);

    // Transfer amount = trip balance + item value = 1100
    int256 transferAmount = int256(tripBalance + itemValue);

    prankAdmin();
    startGasReport("Apply outcome (item removal contributes to budget)");
    world.ratfun__applyOutcome(ratId, tripId, transferAmount, itemsToRemove, new Item[](0));
    endGasReport();
    vm.stopPrank();

    // DESIRED BEHAVIOR:
    // - Item removal should happen first, adding 100 to trip balance (1000 -> 1100)
    // - Budget should then be 1100
    // - Transfer of 1100 should succeed fully
    // - Trip should end with 0 balance
    // - Rat should receive the full 1100

    assertEq(Inventory.length(ratId), 0, "Item should be removed from rat");
    assertEq(Balance.get(tripId), 0, "Trip balance should be fully depleted");
    assertEq(
      Balance.get(ratId),
      initialRatBalance + tripBalance + itemValue,
      "Rat should receive full transfer amount (trip balance + item value)"
    );
  }

  /**
   * @notice Tests challenge trip winner-takes-all with item removal
   * @dev In a challenge trip, when the LLM decides a player wins everything,
   *      including compensation for items lost, the trip should be fully depleted
   *      and the winner should be set.
   *
   *      Scenario:
   *      - Challenge trip with balance 1000
   *      - Rat enters with item worth 100
   *      - LLM: "You win! Take everything (1000 + 100 for your lost item)"
   *      - Contract removes item and transfers 1100
   *
   *      Expected: Trip depleted to 0, challenge winner set
   */
  function testChallengeTripWinnerTakesAllWithItemRemoval() public {
    // Create a challenge trip
    prankAdmin();
    bytes32 challengeTripId = world.ratfun__createTrip(
      bobId,
      bytes32(0),
      1000, // Trip balance
      true, // isChallenge = true
      1, // fixedMinValueToEnter (required for challenge trips)
      100, // overrideMaxValuePerWinPercentage = 100% (winner takes all)
      "challenge trip"
    );
    vm.stopPrank();

    // Verify challenge trip setup
    assertTrue(ChallengeTrip.get(challengeTripId), "Should be a challenge trip");
    assertEq(Balance.get(challengeTripId), 1000, "Challenge trip should have 1000 balance");

    // Give rat an item worth 100
    uint256 itemValue = 100;
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("challenge_item", itemValue);

    prankAdmin();
    world.ratfun__applyOutcome(ratId, challengeTripId, 0, new bytes32[](0), newItems);
    vm.stopPrank();

    // Now trip has 900, rat has item worth 100
    assertEq(Balance.get(challengeTripId), 900, "Trip should have 900 after giving item");

    // Reset trip balance to 1000 for the winner-takes-all scenario
    prankAdmin();
    Balance.set(challengeTripId, 1000);
    vm.stopPrank();

    // The scenario: rat enters with item worth 100, trip has 1000
    // LLM decides: rat wins everything, including compensation for lost item
    uint256 initialRatBalance = Balance.get(ratId);
    bytes32[] memory itemsToRemove = new bytes32[](1);
    itemsToRemove[0] = Inventory.getItem(ratId, 0);

    // Transfer = trip balance + item value compensation
    int256 transferAmount = int256(1000 + itemValue);

    prankAdmin();
    startGasReport("Apply outcome (challenge trip winner takes all with item)");
    world.ratfun__applyOutcome(ratId, challengeTripId, transferAmount, itemsToRemove, new Item[](0));
    endGasReport();
    vm.stopPrank();

    // DESIRED BEHAVIOR for challenge trips:
    // - Item removed, its value (100) added to trip budget
    // - Full transfer of 1100 succeeds
    // - Trip balance reaches 0
    // - Challenge winner is set to the rat's owner (alice)

    assertEq(Inventory.length(ratId), 0, "Item should be removed");
    assertEq(Balance.get(challengeTripId), 0, "Challenge trip should be fully depleted");
    assertEq(Balance.get(ratId), initialRatBalance + 1000 + itemValue, "Rat should receive full amount");
    assertEq(ChallengeWinner.get(challengeTripId), aliceId, "Alice (rat owner) should be the challenge winner");
  }

  /**
   * @notice Tests multiple items removed should all contribute to budget
   * @dev When multiple items are removed, their combined value should be
   *      available for the balance transfer.
   */
  function testMultipleItemsRemovalContributesToBudget() public {
    // Set up: high maxValuePerWin
    prankAdmin();
    GamePercentagesConfig.setMaxValuePerWin(100);
    Balance.set(tripId, 1000);
    vm.stopPrank();

    // Give rat multiple items: 50 + 30 + 20 = 100 total
    Item[] memory newItems = new Item[](3);
    newItems[0] = Item("item_a", 50);
    newItems[1] = Item("item_b", 30);
    newItems[2] = Item("item_c", 20);

    prankAdmin();
    world.ratfun__applyOutcome(ratId, tripId, 0, new bytes32[](0), newItems);
    vm.stopPrank();

    // Reset trip balance
    prankAdmin();
    Balance.set(tripId, 1000);
    vm.stopPrank();

    uint256 initialRatBalance = Balance.get(ratId);

    // Remove all items and request transfer of 1100 (1000 + 100 from items)
    bytes32[] memory itemsToRemove = new bytes32[](3);
    itemsToRemove[0] = Inventory.getItem(ratId, 0);
    itemsToRemove[1] = Inventory.getItem(ratId, 1);
    itemsToRemove[2] = Inventory.getItem(ratId, 2);

    prankAdmin();
    world.ratfun__applyOutcome(ratId, tripId, 1100, itemsToRemove, new Item[](0));
    vm.stopPrank();

    // DESIRED: All 3 items' values (100 total) contribute to budget
    assertEq(Inventory.length(ratId), 0, "All items should be removed");
    assertEq(Balance.get(tripId), 0, "Trip should be depleted");
    assertEq(Balance.get(ratId), initialRatBalance + 1100, "Rat should receive full amount");
  }
}
