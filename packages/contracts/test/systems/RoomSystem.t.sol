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
    bytes32 playerId = world.ratroom__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin
    prankAdmin();
    startGasReport("Create room (user)");
    bytes32 roomId = world.ratroom__createRoom(playerId, LevelList.getItem(0), bytes32(0), "A test room");
    endGasReport();
    vm.stopPrank();

    // Check player balance
    assertEq(
      LibWorld.erc20().balanceOf(alice),
      initialBalance - GameConfig.getRoomCreationCost() * 10 ** LibWorld.erc20().decimals()
    );

    // Check room
    assertEq(uint8(EntityType.get(roomId)), uint8(ENTITY_TYPE.ROOM));
    assertEq(Prompt.get(roomId), "A test room");
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost());
    assertEq(Owner.get(roomId), playerId);
    assertEq(Level.get(roomId), LevelList.getItem(0));
    assertEq(CreationBlock.get(roomId), block.number);
  }

  function testLongRoomPrompt() public {
    setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin
    prankAdmin();
    startGasReport("Create room: long prompt");
    world.ratroom__createRoom(
      playerId,
      LevelList.getItem(0),
      bytes32(0),
      "The room has two doors. One doors lead to death, the other to freedom. If a rat does not make a choice within 10 minutes it is killed and the body removed. Each door has a guardian mouse that needs to be defeated to pass."
    );
    endGasReport();
    vm.stopPrank();
  }

  function testRevertBalanceTooLow() public {
    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    prankAdmin();
    LibWorld.gamePool().depositTokens(alice, LibWorld.erc20().balanceOf(alice));
    bytes32 firstLevelId = LevelList.getItem(0);
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC20Errors.ERC20InsufficientBalance.selector,
        alice,
        0,
        GameConfig.getRoomCreationCost() * 10 ** LibWorld.erc20().decimals()
      )
    );
    world.ratroom__createRoom(playerId, firstLevelId, bytes32(0), "A test room");
    vm.stopPrank();
  }

  function testRevertIdAlreadyInUse() public {
    setInitialBalance(alice);
    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    prankAdmin();
    bytes32 firstLevelId = LevelList.getItem(0);
    world.ratroom__createRoom(playerId, firstLevelId, bytes32("666"), "A test room");
    vm.expectRevert("room id already in use");
    world.ratroom__createRoom(playerId, firstLevelId, bytes32("666"), "A test room");
    vm.stopPrank();
  }

  function testCloseRoom() public {
    uint256 initialBalance = setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin
    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(playerId, LevelList.getItem(0), bytes32(0), "A test room");
    vm.stopPrank();

    // Check player balance
    assertEq(
      LibWorld.erc20().balanceOf(alice),
      initialBalance - GameConfig.getRoomCreationCost() * 10 ** LibWorld.erc20().decimals()
    );

    // Check room balance
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost());

    // Wait for cooldown
    vm.roll(block.number + GameConfig.getCooldownCloseRoom() + 1);

    // Close room
    vm.startPrank(alice);
    startGasReport("Close room");
    world.ratroom__closeRoom(roomId);
    endGasReport();

    vm.stopPrank();

    // Check room balance
    assertEq(Balance.get(roomId), 0);

    // Check player balance
    assertEq(LibWorld.erc20().balanceOf(alice), initialBalance);
  }

  function testCloseRoomRevertInCooldown() public {
    setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    // As admin
    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(playerId, LevelList.getItem(0), bytes32(0), "A test room");
    vm.stopPrank();

    // Advance blocks but not enough to pass cooldown
    vm.roll(block.number + GameConfig.getCooldownCloseRoom() - 1);

    vm.startPrank(alice);
    vm.expectRevert("in cooldown");
    world.ratroom__closeRoom(roomId);
    vm.stopPrank();
  }

  function testCloseRoomRevertNotOwner() public {
    setInitialBalance(alice);
    // As alice
    vm.startPrank(alice);
    bytes32 aliceId = world.ratroom__spawn("alice");
    approveGamePool(type(uint256).max);
    vm.stopPrank();

    setInitialBalance(bob);
    // As bob
    vm.startPrank(bob);
    world.ratroom__spawn("bob");
    vm.stopPrank();

    // As admin
    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(aliceId, LevelList.getItem(0), bytes32(0), "A test room");
    vm.stopPrank();

    // Check room balance
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost());

    // Bob tries to close alice's room
    vm.startPrank(bob);
    vm.expectRevert("not owner");
    world.ratroom__closeRoom(roomId);
    vm.stopPrank();
  }
}
