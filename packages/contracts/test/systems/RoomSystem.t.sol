// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";
import { IERC20Errors } from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract RoomSystemTest is BaseTest {
  function testCreateRoom() public {
    uint256 initialBalance = setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin
    prankAdmin();
    startGasReport("Create room");
    bytes32 roomId = world.ratfun__createRoom(playerId, bytes32(0), ROOM_INITIAL_BALANCE, "A test room");
    endGasReport();
    vm.stopPrank();

    // Check player balance
    assertEq(
      LibWorld.erc20().balanceOf(alice),
      initialBalance - ROOM_INITIAL_BALANCE * 10 ** LibWorld.erc20().decimals()
    );

    // Check room
    assertEq(uint8(EntityType.get(roomId)), uint8(ENTITY_TYPE.ROOM));
    assertEq(Prompt.get(roomId), "A test room");
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE);
    assertEq(Owner.get(roomId), playerId);
    assertEq(CreationBlock.get(roomId), block.number);
  }

  function testLongRoomPrompt() public {
    setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin
    prankAdmin();
    startGasReport("Create room: long prompt");
    world.ratfun__createRoom(
      playerId,
      bytes32(0),
      ROOM_INITIAL_BALANCE,
      "The room has two doors. One doors lead to death, the other to freedom. If a rat does not make a choice within 10 minutes it is killed and the body removed. Each door has a guardian mouse that needs to be defeated to pass."
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

    // As admin - create room with initial balance of 1000
    prankAdmin();
    bytes32 roomId = world.ratfun__createRoom(playerId, bytes32(0), 1000, "A test room");

    // Creation cost is always 1000
    // max 25%, balance 1000 -> 250
    GamePercentagesConfig.setMaxValuePerWin(25);
    assertEq(LibRoom.getMaxValuePerWin(roomId), 250);
    // max 125%, balance 1000 -> 1000
    GamePercentagesConfig.setMaxValuePerWin(125);
    assertEq(LibRoom.getMaxValuePerWin(roomId), 1000);
    // max 125%, balance 2000 -> 2000
    Balance.set(roomId, 2000);
    assertEq(LibRoom.getMaxValuePerWin(roomId), 2000);
    // max 25%, balance 2000 -> 500
    GamePercentagesConfig.setMaxValuePerWin(25);
    assertEq(LibRoom.getMaxValuePerWin(roomId), 500);
    // max 25%, balance 100 -> 100
    Balance.set(roomId, 100);
    assertEq(LibRoom.getMaxValuePerWin(roomId), 100);

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
        ROOM_INITIAL_BALANCE * 10 ** LibWorld.erc20().decimals()
      )
    );
    world.ratfun__createRoom(playerId, bytes32(0), ROOM_INITIAL_BALANCE, "A test room");
    vm.stopPrank();
  }

  function testRevertRoomValueTooLow() public {
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    world.ratfun__giveCallerTokens();
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    prankAdmin();
    LibWorld.gamePool().depositTokens(alice, LibWorld.erc20().balanceOf(alice));
    vm.expectRevert("room value too low");
    world.ratfun__createRoom(playerId, bytes32(0), 0, "A test room");
    vm.stopPrank();
  }

  function testRevertIdAlreadyInUse() public {
    setInitialBalance(alice);
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    prankAdmin();
    world.ratfun__createRoom(playerId, bytes32(uint256(666)), ROOM_INITIAL_BALANCE, "A test room");
    vm.expectRevert("room id already in use");
    world.ratfun__createRoom(playerId, bytes32(uint256(666)), ROOM_INITIAL_BALANCE, "Another test room");
    vm.stopPrank();
  }

  function testCloseRoom() public {
    uint256 initialBalance = setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin
    prankAdmin();
    bytes32 roomId = world.ratfun__createRoom(playerId, bytes32(0), ROOM_INITIAL_BALANCE, "A test room");
    vm.stopPrank();

    // Check player balance
    assertEq(
      LibWorld.erc20().balanceOf(alice),
      initialBalance - ROOM_INITIAL_BALANCE * 10 ** LibWorld.erc20().decimals()
    );

    // Check room balance
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE);

    // Wait for cooldown
    vm.roll(block.number + GameConfig.getCooldownCloseRoom() + 1);

    uint256 adminBalanceBefore = LibWorld.erc20().balanceOf(GameConfig.getAdminAddress());

    // Close room
    vm.startPrank(alice);
    startGasReport("Close room");
    world.ratfun__closeRoom(roomId);
    endGasReport();

    vm.stopPrank();

    // Calculate tax
    uint256 tax = (ROOM_INITIAL_BALANCE * GamePercentagesConfig.getTaxationCloseRoom()) / 100;

    // Check that tax was transferred to admin
    assertEq(
      LibWorld.erc20().balanceOf(GameConfig.getAdminAddress()),
      adminBalanceBefore + (tax * 10 ** LibWorld.erc20().decimals())
    );

    // Check that value minus tax was transfered back to player
    assertEq(LibWorld.erc20().balanceOf(alice), initialBalance - (tax * 10 ** LibWorld.erc20().decimals()));

    // Check room balance
    assertEq(Balance.get(roomId), 0);

    // Check that room has been marked as liquidated
    assertEq(Liquidated.get(roomId), true);

    uint256 liquidationValue = ROOM_INITIAL_BALANCE - (ROOM_INITIAL_BALANCE * GamePercentagesConfig.getTaxationCloseRoom()) / 100;
    assertEq(LiquidationValue.get(roomId), liquidationValue);
    assertEq(LiquidationBlock.get(roomId), block.number);
  }

  function testCloseRoomRevertInCooldown() public {
    setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    bytes32 playerId = world.ratfun__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin
    prankAdmin();
    bytes32 roomId = world.ratfun__createRoom(playerId, bytes32(0), ROOM_INITIAL_BALANCE, "A test room");
    vm.stopPrank();

    // Advance blocks but not enough to pass cooldown
    vm.roll(block.number + GameConfig.getCooldownCloseRoom() - 1);

    vm.startPrank(alice);
    vm.expectRevert("in cooldown");
    world.ratfun__closeRoom(roomId);
    vm.stopPrank();
  }

  function testCloseRoomRevertNotOwner() public {
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
    bytes32 roomId = world.ratfun__createRoom(aliceId, bytes32(0), ROOM_INITIAL_BALANCE, "A test room");
    vm.stopPrank();

    // Check room balance
    assertEq(Balance.get(roomId), ROOM_INITIAL_BALANCE);

    // Bob tries to close alice's room
    vm.startPrank(bob);
    vm.expectRevert("not owner");
    world.ratfun__closeRoom(roomId);
    vm.stopPrank();
  }
}
