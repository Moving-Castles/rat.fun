// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";
import { Item } from "../../src/structs.sol";
import { RAT_CREATION_COST } from "../../src/constants.sol";

contract RatSystemTest is BaseTest {
  function testCreateRat() public {
    setInitialBalance(alice);
    vm.startPrank(alice);

    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);

    startGasReport("Create rat");
    bytes32 ratId = world.ratfun__createRat("roger");
    endGasReport();

    vm.stopPrank();

    // Check player
    assertEq(CurrentRat.get(playerId), ratId);
    assertEq(AchievedLevels.get(playerId).length, 1);
    assertEq(AchievedLevels.getItem(playerId, 0), LevelList.getItem(0));

    // Check rat
    assertEq(uint8(EntityType.get(ratId)), uint8(ENTITY_TYPE.RAT));
    assertEq(Name.get(ratId), "roger");
    assertEq(Dead.get(ratId), false);
    assertEq(Balance.get(ratId), RAT_CREATION_COST);
    assertEq(Index.get(ratId), 1);
    assertEq(Level.get(ratId), LevelList.getItem(0));
    assertEq(Owner.get(ratId), playerId);
    assertEq(CreationBlock.get(ratId), block.number);
  }

  function testRevertAlreadyHasRat() public {
    setInitialBalance(alice);
    vm.startPrank(alice);
    world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);

    world.ratfun__createRat("roger");

    vm.expectRevert("already has live rat");
    world.ratfun__createRat("roger");

    vm.stopPrank();
  }

  function testCreateRatWithDeadRat() public {
    setInitialBalance(alice);
    vm.startPrank(alice);

    bytes32 alice = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);

    bytes32 ratId = world.ratfun__createRat("roger");

    world.ratfun__liquidateRat();

    bytes32 ratId2 = world.ratfun__createRat("roger2");

    vm.stopPrank();

    assertNotEq(ratId, ratId2);
    assertEq(CurrentRat.get(alice), ratId2);
  }

  function testLiquidateRat() public {
    setInitialBalance(alice);
    vm.startPrank(alice);

    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);

    uint256 initialBalance = setInitialBalance(alice);

    bytes32 ratId = world.ratfun__createRat("roger");

    // Get admin balance before liquidation
    uint256 adminBalanceBefore = LibWorld.erc20().balanceOf(GameConfig.getAdminAddress());

    startGasReport("Liquidate rat");
    world.ratfun__liquidateRat();
    endGasReport();

    // Calculate tax based on rat value
    uint256 ratValue = RAT_CREATION_COST;
    uint256 tax = (ratValue * GameConfig.getTaxationLiquidateRat()) / 100;

    // Check that tax was transferred to admin
    assertEq(
      LibWorld.erc20().balanceOf(GameConfig.getAdminAddress()),
      adminBalanceBefore + (tax * 10 ** LibWorld.erc20().decimals())
    );

    // Check that value minus tax was transfered back to player
    assertEq(LibWorld.erc20().balanceOf(alice), initialBalance - (tax * 10 ** LibWorld.erc20().decimals()));

    assertEq(PastRats.length(playerId), 1);
    assertEq(PastRats.getItem(playerId, 0), ratId);

    // Global stats set
    assertEq(WorldStats.getGlobalRatKillCount(), 1);
    assertEq(WorldStats.getLastKilledRatBlock(), block.number);

    vm.stopPrank();
  }

  function testRevertLiquidateNoRat() public {
    setInitialBalance(alice);
    vm.startPrank(alice);
    world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);

    vm.expectRevert("no rat");
    world.ratfun__liquidateRat();

    vm.stopPrank();
  }

  function testRevertLiquidateRatIsDead() public {
    setInitialBalance(alice);
    vm.startPrank(alice);
    world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);

    world.ratfun__createRat("roger");

    world.ratfun__liquidateRat();

    vm.expectRevert("rat is dead");
    world.ratfun__liquidateRat();

    vm.stopPrank();
  }

  function testRevertLiquidateDeadRat() public {
    setInitialBalance(alice);
    vm.startPrank(alice);
    world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);

    bytes32 ratId = world.ratfun__createRat("roger");
    vm.stopPrank();

    prankAdmin();
    Dead.set(ratId, true);
    vm.stopPrank();

    vm.startPrank(alice);
    // Dead rat cannot be liquidated
    vm.expectRevert("rat is dead");
    world.ratfun__liquidateRat();

    // But a new rat can be created
    bytes32 newRatId = world.ratfun__createRat("roger");
    vm.stopPrank();

    assertNotEq(ratId, newRatId);
  }

  function testSellItem() public {
    setInitialBalance(alice);

    // As alice
    vm.startPrank(alice);
    world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    bytes32 ratId = world.ratfun__createRat("roger");
    vm.stopPrank();

    uint256 aliceBalance = LibWorld.erc20().balanceOf(alice);

    // Item to add
    Item[] memory newItems = new Item[](1);
    newItems[0] = Item("cheese", 40);

    // As admin
    prankAdmin();
    approveGamePool(type(uint256).max);
    bytes32 roomId = world.ratfun__createRoom(GameConfig.getAdminId(), LevelList.getItem(0), bytes32(0), "test room");
    world.ratfun__applyOutcome(ratId, roomId, 0, new bytes32[](0), new Item[](0), new bytes32[](0), newItems);
    vm.stopPrank();

    bytes32 newItemId = Inventory.getItem(ratId, 0);

    // Check added item
    assertEq(Inventory.length(ratId), 1);
    assertEq(Value.get(newItemId), 40);
    assertEq(Name.get(newItemId), "cheese");

    uint256 adminBalance = LibWorld.erc20().balanceOf(GameConfig.getAdminAddress());

    // Sell item
    vm.startPrank(alice);
    startGasReport("Sell item");
    world.ratfun__sellItem(newItemId);
    endGasReport();
    vm.stopPrank();

    // Calculate tax
    uint256 tax = (40 * GameConfig.getTaxationSellItem()) / 100;

    // Check that tax was transferred to admin
    assertEq(
      LibWorld.erc20().balanceOf(GameConfig.getAdminAddress()),
      adminBalance + tax * 10 ** LibWorld.erc20().decimals()
    );

    // Check that value minus tax was transfered to player
    assertEq(LibWorld.erc20().balanceOf(alice), aliceBalance + (40 - tax) * 10 ** LibWorld.erc20().decimals());
  }
}
