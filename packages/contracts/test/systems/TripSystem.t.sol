// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";
import { IERC20Errors } from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

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
}
