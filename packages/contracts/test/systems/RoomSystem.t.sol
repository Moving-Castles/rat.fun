// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";

contract RoomSystemTest is BaseTest {
  function testCreateRoom() public {
    setUp();

    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn("alice");
    world.ratroom__givePlayerBalance(1000);
    vm.stopPrank();

    assertEq(Balance.get(playerId), 1000);

    prankAdmin();
    startGasReport("Create room (user)");
    bytes32 roomId = world.ratroom__createRoom(playerId, "Test room", "A test room");
    endGasReport();
    vm.stopPrank();

    // Check player balance (100 = room creation cost)
    assertEq(Balance.get(playerId), 1000 - 100);

    // Check room
    assertEq(uint8(EntityType.get(roomId)), uint8(ENTITY_TYPE.ROOM));
    assertEq(Name.get(roomId), "Test room");
    assertEq(RoomPrompt.get(roomId), "A test room");
    assertEq(Balance.get(roomId), 100);
    assertEq(Owner.get(roomId), playerId);
    assertEq(Level.get(roomId), LevelList.get()[0]);
    assertEq(CreationBlock.get(roomId), block.number);
  }

  function testLongRoomPrompt() public {
    setUp();

    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn("alice");
    world.ratroom__givePlayerBalance(1000);
    vm.stopPrank();
    assertEq(Balance.get(playerId), 1000);

    prankAdmin();
    startGasReport("Create room: long prompt");
    world.ratroom__createRoom(
      playerId,
      "Test room",
      "The room has two doors. One doors lead to death, the other to freedom. If a rat does not make a choice within 10 minutes it is killed and the body removed. Each door has a guardian mouse that needs to be defeated to pass."
    );
    endGasReport();
    vm.stopPrank();
  }

  function testRevertBlanceTooLow() public {
    setUp();

    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn("alice");
    vm.stopPrank();

    prankAdmin();
    vm.expectRevert("balance too low");
    world.ratroom__createRoom(playerId, "Test room", "A test room");
    vm.stopPrank();
  }
}
