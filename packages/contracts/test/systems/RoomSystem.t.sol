// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";

contract RoomSystemTest is BaseTest {
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

  function testCreateRoom() public {
    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn("alice");
    vm.stopPrank();

    uint256 initialBalance = setInitialBalance(playerId);

    // As admin
    prankAdmin();
    startGasReport("Create room (user)");
    bytes32 roomId = world.ratroom__createRoom(playerId, LevelList.getItem(0), bytes32(0), "A test room");
    endGasReport();
    vm.stopPrank();

    // Check player balance
    assertEq(Balance.get(playerId), initialBalance - GameConfig.getRoomCreationCost());

    // Check room
    assertEq(uint8(EntityType.get(roomId)), uint8(ENTITY_TYPE.ROOM));
    assertEq(Prompt.get(roomId), "A test room");
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost());
    assertEq(Owner.get(roomId), playerId);
    assertEq(Level.get(roomId), LevelList.getItem(0));
    assertEq(CreationBlock.get(roomId), block.number);
  }

  function testLongRoomPrompt() public {
    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn("alice");
    vm.stopPrank();

    setInitialBalance(playerId);

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

  function testRevertBlanceTooLow() public {
    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn("alice");
    vm.stopPrank();

    prankAdmin();
    world.ratroom__removePlayerBalance(playerId);
    bytes32 firstLevelId = LevelList.getItem(0);
    vm.expectRevert("balance too low");
    world.ratroom__createRoom(playerId, firstLevelId, bytes32(0), "A test room");
    vm.stopPrank();
  }

  function testRevertIdAlreadyInUse() public {
    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn("alice");
    vm.stopPrank();

    prankAdmin();
    bytes32 firstLevelId = LevelList.getItem(0);
    world.ratroom__createRoom(playerId, firstLevelId, bytes32("666"), "A test room");
    vm.expectRevert("room id already in use");
    world.ratroom__createRoom(playerId, firstLevelId, bytes32("666"), "A test room");
    vm.stopPrank();
  }

  function testCloseRoom() public {
    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn("alice");
    vm.stopPrank();

    uint256 initialBalance = setInitialBalance(playerId);

    // As admin
    prankAdmin();
    bytes32 roomId = world.ratroom__createRoom(playerId, LevelList.getItem(0), bytes32(0), "A test room");
    vm.stopPrank();

    // Check player balance
    assertEq(Balance.get(playerId), initialBalance - GameConfig.getRoomCreationCost());

    // Check room balance
    assertEq(Balance.get(roomId), GameConfig.getRoomCreationCost());

    // Close room
    vm.startPrank(alice);
    startGasReport("Close room");
    world.ratroom__closeRoom(roomId);
    endGasReport();

    vm.stopPrank();

    // Check room balance
    assertEq(Balance.get(roomId), 0);

    // Check player balance
    assertEq(Balance.get(playerId), initialBalance);
  }

  function testCloseRoomRevertNotOwner() public {
    vm.startPrank(alice);
    bytes32 aliceId = world.ratroom__spawn("alice");
    vm.stopPrank();

    // As bob
    vm.startPrank(bob);
    world.ratroom__spawn("bob");
    vm.stopPrank();

    setInitialBalance(aliceId);

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
