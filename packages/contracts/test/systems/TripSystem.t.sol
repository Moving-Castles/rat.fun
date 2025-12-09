// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";
import { IERC20Errors } from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import { Item } from "../../src/structs.sol";

contract TripSystemTest is BaseTest {
  function testCreateTrip() public {
    uint256 initialBalance = setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin
    prankAdmin();
    startGasReport("Create trip");
    bytes32 tripId = world.ratfun__createTrip(playerId, bytes32(0), TRIP_INITIAL_BALANCE, "A test trip");
    endGasReport();
    vm.stopPrank();

    // Check player balance
    assertEq(
      LibWorld.erc20().balanceOf(alice),
      initialBalance - TRIP_INITIAL_BALANCE * 10 ** LibWorld.erc20().decimals()
    );

    // Check trip
    assertEq(uint8(EntityType.get(tripId)), uint8(ENTITY_TYPE.TRIP));
    assertEq(Prompt.get(tripId), "A test trip");
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE);
    assertEq(Owner.get(tripId), playerId);
    assertEq(CreationBlock.get(tripId), block.number);
  }

  function testLongTripPrompt() public {
    setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin
    prankAdmin();
    startGasReport("Create trip: long prompt");
    world.ratfun__createTrip(
      playerId,
      bytes32(0),
      TRIP_INITIAL_BALANCE,
      "The trip has two doors. One doors lead to death, the other to freedom. If a rat does not make a choice within 10 minutes it is killed and the body removed. Each door has a guardian mouse that needs to be defeated to pass."
    );
    endGasReport();
    vm.stopPrank();
  }

  function testMaxValuePerWin() public {
    setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin - create trip with initial balance of 1000
    prankAdmin();
    bytes32 tripId = world.ratfun__createTrip(playerId, bytes32(0), 1000, "A test trip");

    // Creation cost is always 1000
    // max 25%, balance 1000 -> 250
    GamePercentagesConfig.setMaxValuePerWin(25);
    assertEq(LibTrip.getMaxValuePerWin(tripId), 250);
    // max 125%, balance 1000 -> 1000
    GamePercentagesConfig.setMaxValuePerWin(125);
    assertEq(LibTrip.getMaxValuePerWin(tripId), 1000);
    // max 125%, balance 2000 -> 2000
    Balance.set(tripId, 2000);
    assertEq(LibTrip.getMaxValuePerWin(tripId), 2000);
    // max 25%, balance 2000 -> 500
    GamePercentagesConfig.setMaxValuePerWin(25);
    assertEq(LibTrip.getMaxValuePerWin(tripId), 500);
    // max 25%, balance 100 -> 100
    Balance.set(tripId, 100);
    assertEq(LibTrip.getMaxValuePerWin(tripId), 100);

    vm.stopPrank();
  }

  function testRevertBalanceTooLow() public {
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    world.ratfun__giveCallerTokens();
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    prankAdmin();
    LibWorld.gamePool().depositTokens(alice, LibWorld.erc20().balanceOf(alice));
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC20Errors.ERC20InsufficientBalance.selector,
        alice,
        0,
        TRIP_INITIAL_BALANCE * 10 ** LibWorld.erc20().decimals()
      )
    );
    world.ratfun__createTrip(playerId, bytes32(0), TRIP_INITIAL_BALANCE, "A test trip");
    vm.stopPrank();
  }

  function testRevertTripValueTooLow() public {
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    world.ratfun__giveCallerTokens();
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    prankAdmin();
    LibWorld.gamePool().depositTokens(alice, LibWorld.erc20().balanceOf(alice));
    vm.expectRevert("trip value too low");
    world.ratfun__createTrip(playerId, bytes32(0), 0, "A test trip");
    vm.stopPrank();
  }

  function testRevertIdAlreadyInUse() public {
    setInitialBalance(alice);
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    prankAdmin();
    world.ratfun__createTrip(playerId, bytes32(uint256(666)), TRIP_INITIAL_BALANCE, "A test trip");
    vm.expectRevert("trip id already in use");
    world.ratfun__createTrip(playerId, bytes32(uint256(666)), TRIP_INITIAL_BALANCE, "Another test trip");
    vm.stopPrank();
  }

  function testCloseTrip() public {
    uint256 initialBalance = setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin
    prankAdmin();
    bytes32 tripId = world.ratfun__createTrip(playerId, bytes32(0), TRIP_INITIAL_BALANCE, "A test trip");
    vm.stopPrank();

    // Check player balance
    assertEq(
      LibWorld.erc20().balanceOf(alice),
      initialBalance - TRIP_INITIAL_BALANCE * 10 ** LibWorld.erc20().decimals()
    );

    // Check trip balance
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE);

    // Wait for cooldown
    vm.roll(block.number + GameConfig.getCooldownCloseTrip() + 1);

    uint256 adminBalanceBefore = LibWorld.erc20().balanceOf(GameConfig.getAdminAddress());

    // Close trip
    vm.startPrank(alice);
    startGasReport("Close trip");
    world.ratfun__closeTrip(tripId);
    endGasReport();

    vm.stopPrank();

    // Calculate tax
    uint256 tax = (TRIP_INITIAL_BALANCE * GamePercentagesConfig.getTaxationCloseTrip()) / 100;

    // Check that tax was transferred to admin
    assertEq(
      LibWorld.erc20().balanceOf(GameConfig.getAdminAddress()),
      adminBalanceBefore + (tax * 10 ** LibWorld.erc20().decimals())
    );

    // Check that value minus tax was transfered back to player
    assertEq(LibWorld.erc20().balanceOf(alice), initialBalance - (tax * 10 ** LibWorld.erc20().decimals()));

    // Check trip balance
    assertEq(Balance.get(tripId), 0);

    // Check that trip has been marked as liquidated
    assertEq(Liquidated.get(tripId), true);

    // Liquidation value is gross value, before taxation
    assertEq(LiquidationValue.get(tripId), TRIP_INITIAL_BALANCE);

    assertEq(LiquidationTaxPercentage.get(tripId), GamePercentagesConfig.getTaxationCloseTrip());

    assertEq(LiquidationBlock.get(tripId), block.number);
  }

  function testCloseTripRevertInCooldown() public {
    setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin
    prankAdmin();
    bytes32 tripId = world.ratfun__createTrip(playerId, bytes32(0), TRIP_INITIAL_BALANCE, "A test trip");
    vm.stopPrank();

    // Advance blocks but not enough to pass cooldown
    vm.roll(block.number + GameConfig.getCooldownCloseTrip() - 1);

    vm.startPrank(alice);
    vm.expectRevert("in cooldown");
    world.ratfun__closeTrip(tripId);
    vm.stopPrank();
  }

  function testCloseTripRevertNotOwner() public {
    setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    bytes32 aliceId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    setInitialBalance(bob);
    // As bob
    vm.startPrank(bob);
    world.ratfun__spawn("bob");
    vm.stopPrank();

    // As admin
    prankAdmin();
    bytes32 tripId = world.ratfun__createTrip(aliceId, bytes32(0), TRIP_INITIAL_BALANCE, "A test trip");
    vm.stopPrank();

    // Check trip balance
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE);

    // Bob tries to close alice's trip
    vm.startPrank(bob);
    vm.expectRevert("not owner");
    world.ratfun__closeTrip(tripId);
    vm.stopPrank();
  }

  function testCloseLowValueTrip() public {
    setInitialBalance(alice);
    vm.startPrank(alice);
    bytes32 aliceId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    bytes32 ratId = world.ratfun__createRat("roger");
    vm.stopPrank();

    prankAdmin();
    // Trip balance: 1000
    // Min value to enter trip: 10% of 1000 = 100
    // Max value per win: 25% of 1000 = 250
    bytes32 tripId = world.ratfun__createTrip(aliceId, bytes32(0), 1000, "test trip");
    // Drain the trip in steps, because of maxValuePerWin restriction
    // Transfer 250 tokens to rat
    world.ratfun__applyOutcome(ratId, tripId, 250, new bytes32[](0), new Item[](0));
    // Transfer another 250 tokens to rat
    world.ratfun__applyOutcome(ratId, tripId, 250, new bytes32[](0), new Item[](0));
    // Transfer another 250 tokens to rat
    world.ratfun__applyOutcome(ratId, tripId, 250, new bytes32[](0), new Item[](0));
    // Finally, transfer another 249 tokens to rat
    world.ratfun__applyOutcome(ratId, tripId, 249, new bytes32[](0), new Item[](0));
    vm.stopPrank();

    assertEq(Balance.get(tripId), 1);

    // Get balances before liquidation
    uint256 adminBalanceBeforeLiquidation = LibWorld.erc20().balanceOf(GameConfig.getAdminAddress());
    uint256 playerBalanceBeforeLiquidation = LibWorld.erc20().balanceOf(alice);

    // Wait for cooldown
    vm.roll(block.number + GameConfig.getCooldownCloseTrip() + 1);

    vm.startPrank(alice);
    world.ratfun__closeTrip(tripId);
    vm.stopPrank();

    // Value to player is 1
    // Tax is 0

    // Check that no tokens are transferred to admin
    assertEq(LibWorld.erc20().balanceOf(GameConfig.getAdminAddress()), adminBalanceBeforeLiquidation);

    // Check that 1 token is transferred back to player
    assertEq(LibWorld.erc20().balanceOf(alice), playerBalanceBeforeLiquidation + 10 ** LibWorld.erc20().decimals());

    // Liquidation value is gross value, before taxation
    assertEq(LiquidationValue.get(tripId), 1);

    vm.stopPrank();
  }

  function testRevertCloseTripTwice() public {
    setInitialBalance(alice);
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    prankAdmin();
    bytes32 tripId = world.ratfun__createTrip(playerId, bytes32(0), TRIP_INITIAL_BALANCE, "A test trip");
    vm.stopPrank();

    // Wait for cooldown
    vm.roll(block.number + GameConfig.getCooldownCloseTrip() + 1);

    // Close trip first time - should succeed
    vm.startPrank(alice);
    world.ratfun__closeTrip(tripId);

    // Verify trip is closed
    assertEq(Balance.get(tripId), 0);
    assertEq(Liquidated.get(tripId), true);

    // Try to close again - should revert
    vm.expectRevert("trip depleted or already closed");
    world.ratfun__closeTrip(tripId);
    vm.stopPrank();
  }

  function testRevertCloseDepletedTrip() public {
    setInitialBalance(alice);
    vm.startPrank(alice);
    bytes32 aliceId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    bytes32 ratId = world.ratfun__createRat("roger");
    vm.stopPrank();

    prankAdmin();
    bytes32 tripId = world.ratfun__createTrip(aliceId, bytes32(0), 1000, "test trip");

    // Deplete the trip balance through applyOutcome
    // Max value per win is 25% of 1000 = 250
    world.ratfun__applyOutcome(ratId, tripId, 250, new bytes32[](0), new Item[](0));
    world.ratfun__applyOutcome(ratId, tripId, 250, new bytes32[](0), new Item[](0));
    world.ratfun__applyOutcome(ratId, tripId, 250, new bytes32[](0), new Item[](0));
    world.ratfun__applyOutcome(ratId, tripId, 250, new bytes32[](0), new Item[](0));
    vm.stopPrank();

    // Verify trip is depleted but NOT explicitly liquidated
    assertEq(Balance.get(tripId), 0, "Trip should be depleted");
    assertEq(Liquidated.get(tripId), false, "Trip should not be marked as liquidated");

    // Wait for cooldown
    vm.roll(block.number + GameConfig.getCooldownCloseTrip() + 1);

    // Try to close depleted trip - should revert
    vm.startPrank(alice);
    vm.expectRevert("trip depleted or already closed");
    world.ratfun__closeTrip(tripId);
    vm.stopPrank();
  }

  function testAddTripBalance() public {
    uint256 initialBalance = setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin - create trip
    prankAdmin();
    bytes32 tripId = world.ratfun__createTrip(playerId, bytes32(0), TRIP_INITIAL_BALANCE, "A test trip");
    vm.stopPrank();

    // Check initial balances
    uint256 playerBalanceAfterCreate = LibWorld.erc20().balanceOf(alice);
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE);
    assertEq(playerBalanceAfterCreate, initialBalance - TRIP_INITIAL_BALANCE * 10 ** LibWorld.erc20().decimals());

    // Add balance to trip
    uint256 amountToAdd = 500;
    vm.startPrank(alice);
    startGasReport("Add trip balance");
    world.ratfun__addTripBalance(tripId, amountToAdd);
    endGasReport();
    vm.stopPrank();

    // Check trip balance increased
    assertEq(Balance.get(tripId), TRIP_INITIAL_BALANCE + amountToAdd);

    // Check player balance decreased
    assertEq(
      LibWorld.erc20().balanceOf(alice),
      playerBalanceAfterCreate - amountToAdd * 10 ** LibWorld.erc20().decimals()
    );

    // Check that TripCreationCost is unchanged
    assertEq(TripCreationCost.get(tripId), TRIP_INITIAL_BALANCE);
  }

  function testAddTripBalanceRevertNotOwner() public {
    setInitialBalance(alice);
    vm.startPrank(alice);
    bytes32 aliceId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    setInitialBalance(bob);
    vm.startPrank(bob);
    world.ratfun__spawn("bob");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin - create trip owned by alice
    prankAdmin();
    bytes32 tripId = world.ratfun__createTrip(aliceId, bytes32(0), TRIP_INITIAL_BALANCE, "A test trip");
    vm.stopPrank();

    // Bob tries to add balance to alice's trip
    vm.startPrank(bob);
    vm.expectRevert("not owner");
    world.ratfun__addTripBalance(tripId, 500);
    vm.stopPrank();
  }

  function testAddTripBalanceRevertTripClosed() public {
    setInitialBalance(alice);
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin - create trip
    prankAdmin();
    bytes32 tripId = world.ratfun__createTrip(playerId, bytes32(0), TRIP_INITIAL_BALANCE, "A test trip");
    vm.stopPrank();

    // Wait for cooldown and close trip
    vm.roll(block.number + GameConfig.getCooldownCloseTrip() + 1);
    vm.startPrank(alice);
    world.ratfun__closeTrip(tripId);

    // Try to add balance to closed trip (balance is 0)
    vm.expectRevert("trip is dead");
    world.ratfun__addTripBalance(tripId, 500);
    vm.stopPrank();
  }

  function testAddTripBalanceRevertAmountZero() public {
    setInitialBalance(alice);
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin - create trip
    prankAdmin();
    bytes32 tripId = world.ratfun__createTrip(playerId, bytes32(0), TRIP_INITIAL_BALANCE, "A test trip");
    vm.stopPrank();

    // Try to add 0 balance
    vm.startPrank(alice);
    vm.expectRevert("amount must be positive");
    world.ratfun__addTripBalance(tripId, 0);
    vm.stopPrank();
  }

  function testAddTripBalanceRevertTripDepleted() public {
    setInitialBalance(alice);
    vm.startPrank(alice);
    bytes32 aliceId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    bytes32 ratId = world.ratfun__createRat("roger");
    vm.stopPrank();

    // As admin - create trip and drain it
    prankAdmin();
    bytes32 tripId = world.ratfun__createTrip(aliceId, bytes32(0), 1000, "test trip");
    // Drain the trip completely
    world.ratfun__applyOutcome(ratId, tripId, 250, new bytes32[](0), new Item[](0));
    world.ratfun__applyOutcome(ratId, tripId, 250, new bytes32[](0), new Item[](0));
    world.ratfun__applyOutcome(ratId, tripId, 250, new bytes32[](0), new Item[](0));
    world.ratfun__applyOutcome(ratId, tripId, 250, new bytes32[](0), new Item[](0));
    vm.stopPrank();

    // Verify trip is depleted but not liquidated
    assertEq(Balance.get(tripId), 0);
    assertEq(Liquidated.get(tripId), false);

    // Try to add balance to depleted trip
    vm.startPrank(alice);
    vm.expectRevert("trip is dead");
    world.ratfun__addTripBalance(tripId, 500);
    vm.stopPrank();
  }

  function testAddTripBalanceRevertNotTrip() public {
    setInitialBalance(alice);
    vm.startPrank(alice);
    world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    // Create a rat - rats are owned by the player, so alice will own this rat
    bytes32 ratId = world.ratfun__createRat("ratty");
    vm.stopPrank();

    // Try to add balance to a rat entity (not a trip)
    // The ownership check passes (rat is owned by alice's playerId)
    // Then the entity type check should fail (rat is ENTITY_TYPE.RAT, not TRIP)
    vm.startPrank(alice);
    vm.expectRevert("not a trip");
    world.ratfun__addTripBalance(ratId, 500);
    vm.stopPrank();
  }

  function testAddTripBalanceAffectsMaxValuePerWin() public {
    setInitialBalance(alice);
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin - create trip with balance 1000
    prankAdmin();
    bytes32 tripId = world.ratfun__createTrip(playerId, bytes32(0), 1000, "A test trip");

    // maxValuePerWin = min(25% * max(1000, 1000), 1000) = 250
    GamePercentagesConfig.setMaxValuePerWin(25);
    assertEq(LibTrip.getMaxValuePerWin(tripId), 250);
    vm.stopPrank();

    // Add 1000 more balance (total: 2000)
    vm.startPrank(alice);
    world.ratfun__addTripBalance(tripId, 1000);
    vm.stopPrank();

    // maxValuePerWin = min(25% * max(1000, 2000), 2000) = min(500, 2000) = 500
    assertEq(LibTrip.getMaxValuePerWin(tripId), 500);

    // TripCreationCost should still be 1000
    assertEq(TripCreationCost.get(tripId), 1000);

    // minRatValueToEnter should still be based on creation cost (10% of 1000 = 100)
    assertEq(LibTrip.getMinRatValueToEnter(tripId), 100);
  }
}
