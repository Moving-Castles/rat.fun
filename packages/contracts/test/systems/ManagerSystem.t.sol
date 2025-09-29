// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";
import { Item } from "../../src/structs.sol";
import { RAT_CREATION_COST } from "../../src/constants.sol";
import { console2 as console } from "forge-std/console2.sol";

contract ManagerSystemTest is BaseTest {
  bytes32 aliceId;
  bytes32 bobId;
  bytes32 ratId;
  bytes32 roomId;
  uint256 initialBalance;

  function setUp() public override {
    super.setUp();

    // Initialize alice, bob and their default rat and room

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
    roomId = world.ratfun__createRoom(bobId, bytes32(0), ROOM_INITIAL_BALANCE, "test room");
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
    world.ratfun__setCooldownCloseRoom(10);

    vm.expectRevert("not allowed");
    world.ratfun__setMaxValuePerWin(10);

    vm.expectRevert("not allowed");
    world.ratfun__setMinRatValueToEnter(10);

    vm.expectRevert("not allowed");
    world.ratfun__setTaxationLiquidateRat(10);

    vm.expectRevert("not allowed");
    world.ratfun__setTaxationCloseRoom(10);

    vm.stopPrank();
  }

  function testApplyOutcomeEmpty() public {
    // As admin
    prankAdmin();
    startGasReport("Apply outcome (empty)");
    world.ratfun__applyOutcome(ratId, roomId, 0, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    assertEq(VisitCount.get(roomId), 1);
    assertEq(TripCount.get(ratId), 1);
    // Check last visit block
    assertEq(LastVisitBlock.get(roomId), block.number);
  }

  function testRevertNotRat() public {
    prankAdmin();

    vm.expectRevert("not rat");
    world.ratfun__applyOutcome(bytes32(0), roomId, 0, new bytes32[](0), new Item[](0));

    vm.stopPrank();
  }

  function testRevertRatIsDead() public {
    prankAdmin();

    Dead.set(ratId, true);
    vm.expectRevert("rat is dead");
    world.ratfun__applyOutcome(ratId, roomId, 0, new bytes32[](0), new Item[](0));

    vm.stopPrank();
  }

  function testRevertNotRoom() public {
    prankAdmin();

    vm.expectRevert("not room");
    world.ratfun__applyOutcome(ratId, bytes32(0), 0, new bytes32[](0), new Item[](0));

    vm.stopPrank();
  }

  function testRevertRatValueTooLow() public {
    prankAdmin();

    // Set rat balance to just below the minimum required to enter the room
    Balance.set(ratId, LibRoom.getMinRatValueToEnter(roomId) - 1);

    vm.expectRevert("rat value too low");
    world.ratfun__applyOutcome(ratId, roomId, 0, new bytes32[](0), new Item[](0));

    vm.stopPrank();
  }

  function testRevertNoRoomBalance() public {
    prankAdmin();

    // Deplete room balance
    Balance.set(roomId, 0);

    vm.expectRevert("no room balance");
    world.ratfun__applyOutcome(ratId, roomId, 0, new bytes32[](0), new Item[](0));

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
    world.ratfun__applyOutcome(ratId, roomId, 0, new bytes32[](0), newItems);
    endGasReport();
    vm.stopPrank();

    // Check added item
    assertEq(Inventory.length(ratId), 1);
    assertEq(Value.get(Inventory.getItem(ratId, 0)), 40);
    assertEq(Name.get(Inventory.getItem(ratId, 0)), "cheese");

    // pre-change balance - 40
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE - 40);
  }

  function testApplyOutcomeAddItemTooExpensive() public {
    // Item to add
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("cheese", ROOM_INITIAL_BALANCE + 1);

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (add item: too expensive)");
    world.ratfun__applyOutcome(ratId, roomId, 0, new bytes32[](0), newItems);
    endGasReport();
    vm.stopPrank();

    // Not enough room balance
    assertEq(Inventory.length(ratId), 0);
    // Initial room balance
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE);
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
    world.ratfun__applyOutcome(ratId, roomId, 0, new bytes32[](0), newItems);
    vm.stopPrank();

    // Check inventory length
    assertEq(Inventory.length(ratId), maxInventorySize);

    Item[] memory extraItems = new Item[](3);
    extraItems[0] = Item("extra cheese", 1);
    extraItems[1] = Item("extra cheese 2", 1);
    extraItems[2] = Item("extra cheese 3", 1);

    prankAdmin();
    world.ratfun__applyOutcome(ratId, roomId, 0, new bytes32[](0), extraItems);
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
    world.ratfun__applyOutcome(ratId, roomId, 0, new bytes32[](0), newItems);
    vm.stopPrank();

    // Check added item
    bytes32 itemId = Inventory.getItem(ratId, 0);
    assertEq(Inventory.length(ratId), 1);
    assertEq(Value.get(itemId), 40);
    assertEq(Name.get(itemId), "cheese");

    // Initial room balance - 40
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE - 40);

    bytes32[] memory itemsToRemove = new bytes32[](1);
    itemsToRemove[0] = itemId;

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (remove item)");
    world.ratfun__applyOutcome(ratId, roomId, 0, itemsToRemove, new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Initial room balance again
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE);
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
    world.ratfun__applyOutcome(ratId, roomId, 0, new bytes32[](0), newItems);
    vm.stopPrank();

    // Check initial inventory length and room balance
    assertEq(Inventory.length(ratId), maxInventorySize);
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE - maxInventorySize);

    // Remove item from middle
    bytes32[] memory itemsToRemove = new bytes32[](1);
    itemsToRemove[0] = Inventory.getItem(ratId, maxInventorySize / 2);

    Item[] memory resultItems = newItems;
    resultItems = _removeFromItemArray(resultItems, string.concat("cheese ", Strings.toString(maxInventorySize / 2)));

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (remove item from middle of full inventory)");
    world.ratfun__applyOutcome(ratId, roomId, 0, itemsToRemove, new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Check balance and items after removal
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE - (maxInventorySize - 1));
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
    world.ratfun__applyOutcome(ratId, roomId, 0, itemsToRemove, new Item[](0));
    vm.stopPrank();

    // Check balance and items after removal
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE - (maxInventorySize - 2));
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
    world.ratfun__applyOutcome(ratId, roomId, 0, itemsToRemove, new Item[](0));
    vm.stopPrank();

    // Check balance and items after removal
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE - (maxInventorySize - 3));
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
    world.ratfun__applyOutcome(ratId, roomId, 20, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Initial balance + 20
    assertEq(Balance.get(ratId), RAT_CREATION_COST + 20);
    // Initial room balance - 20
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE - 20);
    // Initial bob balance - ROOM_CREATION_COST
    assertEq(
      LibWorld.erc20().balanceOf(bob),
      initialBalance - ROOM_INITIAL_BALANCE * 10 ** LibWorld.erc20().decimals()
    );
  }

  function testApplyOutcomeTransferToRoom() public {
    // As admin
    prankAdmin();
    world.ratfun__applyOutcome(ratId, roomId, 50, new bytes32[](0), new Item[](0));
    startGasReport("Apply outcome (transfer to room)");
    world.ratfun__applyOutcome(ratId, roomId, -20, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Initial balance + 50 - 20
    assertEq(Balance.get(ratId), RAT_CREATION_COST + 30);
    // Initial room balance - 50 (transfer to rat) + 20 (transfer back to room)
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE - 50 + 20);
  }

  function testApplyOutcomeOverTransferToRat() public {
    // As admin - try to transfer more than room balance to rat
    prankAdmin();
    // Set maxValuePerWin to 1000% so only room balance can possibly limit the transfer
    GamePercentagesConfig.setMaxValuePerWin(1000);

    startGasReport("Apply outcome (over transfer to rat)");
    world.ratfun__applyOutcome(ratId, roomId, int256(ROOM_INITIAL_BALANCE + 100), new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Balance transfer can not exceed room balance
    assertEq(Balance.get(ratId), RAT_CREATION_COST + ROOM_INITIAL_BALANCE);
    assertEq(Balance.get(roomId), 0);
  }

  function testApplyOutcomeOverTransferToRoom() public {
    // As admin
    prankAdmin();
    world.ratfun__applyOutcome(ratId, roomId, 50, new bytes32[](0), new Item[](0));
    startGasReport("Apply outcome (over transfer to room)");
    world.ratfun__applyOutcome(ratId, roomId, -200, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Rat should have 0 balance and be dead
    assertEq(Balance.get(ratId), 0);
    assertTrue(Dead.get(ratId));
    // Initial room balance + RAT_CREATION_COST
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE + RAT_CREATION_COST);
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
    world.ratfun__applyOutcome(ratId, roomId, 20, new bytes32[](0), newItems);

    // Room balance:
    // initial room balance - 20 (balance transfer) - 30 (items)
    uint256 intermediateRoomBalance = ROOM_INITIAL_BALANCE - 20 - 30;
    assertEq(Balance.get(roomId), intermediateRoomBalance);

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
    world.ratfun__applyOutcome(ratId, roomId, -int256(intermediateRatBalance), new bytes32[](0), new Item[](0));
    endGasReport();

    vm.stopPrank();

    // Room kill count incremented
    assertEq(KillCount.get(roomId), 1);

    // Room balance:
    // intermediate room balance + intermediate rat balance + 30 (items)
    assertEq(Balance.get(roomId), intermediateRoomBalance + intermediateRatBalance + 30);

    // Rat is dead
    assertTrue(Dead.get(ratId));

    // Rat balance is 0
    assertEq(Balance.get(ratId), 0);

    // Global stats set
    assertEq(WorldStats.getGlobalRatKillCount(), 1);
    assertEq(WorldStats.getLastKilledRatBlock(), block.number);
  }

  // * * * *
  // Room Budget Limits
  // * * * *

  function testRoomCannotExceedMaxValuePerWin() public {
    uint256 maxValuePerWin = LibRoom.getMaxValuePerWin(roomId);

    // Verify room setup
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE); // Room has 200 balance
    assertTrue(Balance.get(roomId) > maxValuePerWin); // Room balance > maxValuePerWin

    // Try to transfer more than maxValuePerWin to rat
    int256 transferAmount = int256(maxValuePerWin + 1);

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (room budget limit)");
    world.ratfun__applyOutcome(ratId, roomId, transferAmount, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Verify that only maxValuePerWin was transferred, not the full amount
    assertEq(Balance.get(ratId), RAT_CREATION_COST + maxValuePerWin);
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE - maxValuePerWin);
  }

  function testRoomBudgetLimitedByBalance() public {
    // As admin - set maxValuePerWin to 50% and reduce room balance to be a bit below that
    prankAdmin();
    GamePercentagesConfig.setMaxValuePerWin(50);
    uint256 alteredRoomBalance = ROOM_INITIAL_BALANCE / 2 - 1;
    Balance.set(roomId, alteredRoomBalance);
    vm.stopPrank();

    // Verify room setup
    uint256 maxValuePerWin = LibRoom.getMaxValuePerWin(roomId);
    assertEq(Balance.get(roomId), alteredRoomBalance);
    // Room balance should be equal to maxValuePerWin (which is based on creation cost here, and capped by the balance)
    assertEq(Balance.get(roomId), maxValuePerWin);

    // Try to transfer more than room balance to rat
    int256 transferAmount = int256(maxValuePerWin);

    // As admin
    prankAdmin();
    startGasReport("Apply outcome (room balance limit)");
    world.ratfun__applyOutcome(ratId, roomId, transferAmount, new bytes32[](0), new Item[](0));
    endGasReport();
    vm.stopPrank();

    // Verify that only room balance was transferred, not maxValuePerWin
    assertEq(Balance.get(ratId), RAT_CREATION_COST + alteredRoomBalance);
    assertEq(Balance.get(roomId), 0); // Room balance exhausted
  }

  function testRoomBudgetIncreasedByRatValueAndItemLoss() public {
    uint256 maxValuePerWin = LibRoom.getMaxValuePerWin(roomId);
    assertGt(maxValuePerWin, 0);

    // Add initial item worth 20
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("cheese", 20);

    // As admin
    prankAdmin();
    world.ratfun__applyOutcome(ratId, roomId, 0, new bytes32[](0), newItems);
    vm.stopPrank();

    // Transfer value of 30 from rat to room
    int256 transferAmount = -30;
    // Remove the item worth 20 from rat
    bytes32[] memory itemsToRemove = new bytes32[](1);
    itemsToRemove[0] = Inventory.getItem(ratId, 0);
    // But give rat an item worth more than maxValuePerWin by 50 (removed item + rat value loss)
    newItems = new Item[](1);
    newItems[0] = Item("cheese 2", maxValuePerWin + 50);

    // As admin
    prankAdmin();
    world.ratfun__applyOutcome(ratId, roomId, transferAmount, itemsToRemove, newItems);
    vm.stopPrank();

    assertEq(Inventory.length(ratId), 1);
    assertEq(Name.get(Inventory.getItem(ratId, 0)), "cheese 2");
    assertEq(Value.get(Inventory.getItem(ratId, 0)), maxValuePerWin + 50);
    assertEq(Balance.get(ratId), RAT_CREATION_COST - 30);
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE + 30 - maxValuePerWin - 50);
  }
}
