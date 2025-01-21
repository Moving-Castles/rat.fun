// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";
import { ROOM_CREATION_COST } from "../../src/constants.sol";

contract RoomSystemTest is BaseTest {
  function testCreateRoomAdmin() public {
    setUp();

    prankAdmin();

    startGasReport("Create room (admin)");
    bytes32 roomId = world.ratroom__createRoom("A test room");
    endGasReport();

    vm.stopPrank();

    // Check room
    assertEq(uint8(EntityType.get(roomId)), uint8(ENTITY_TYPE.ROOM));
    assertEq(RoomPrompt.get(roomId), "A test room");
    assertEq(Balance.get(roomId), ROOM_CREATION_COST);
  }

  function testLongRoomPromptAdmin() public {
    setUp();

    prankAdmin();

    startGasReport("Create room: long prompt");
    world.ratroom__createRoom(
      "The room has two doors. One doors lead to death, the other to freedom. If a rat does not make a choice within 10 minutes it is killed and the body removed. Each door has a guardian mouse that needs to be defeated to pass."
    );
    endGasReport();

    vm.stopPrank();
  }

  function testCreateRoomUser() public {
    setUp();


    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn();

    assertEq(Balance.get(playerId), 1000);

    startGasReport("Create room (user)");
    bytes32 roomId = world.ratroom__createRoom("A test room");
    endGasReport();

    vm.stopPrank();

    // Check player balance
    assertEq(Balance.get(playerId), 1000 - ROOM_CREATION_COST);

    // Check room
    assertEq(uint8(EntityType.get(roomId)), uint8(ENTITY_TYPE.ROOM));
    assertEq(RoomPrompt.get(roomId), "A test room");
    assertEq(Balance.get(roomId), ROOM_CREATION_COST);
  }

  function testRevertBlanceTooLow() public {
    setUp();

    vm.startPrank(alice);

    vm.expectRevert("balance too low");
    world.ratroom__createRoom("A test room");

    vm.stopPrank();
  }

  function testChangeRoomBalance() public {
    setUp();

    prankAdmin();

    bytes32 roomId = world.ratroom__createRoom("A test room");

    startGasReport("Increase room balance");
    world.ratroom__increaseRoomBalance(roomId, 10);
    endGasReport();

    assertEq(Balance.get(roomId), 110);

    startGasReport("Decrease room balance");
    world.ratroom__decreaseRoomBalance(roomId, 20);
    endGasReport();

    assertEq(Balance.get(roomId), 90);

    vm.stopPrank();
  }

  function testRevertNotAllowed() public {
    setUp();

    vm.startPrank(alice);

    vm.expectRevert("not allowed");
    world.ratroom__increaseRoomBalance(bytes32(0), 10);

    vm.stopPrank();
  }

  function testTransferBalanceToPlayer() public {
    setUp();

    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn();
    bytes32 roomId = world.ratroom__createRoom("A test room");
    vm.stopPrank();

    assertEq(Balance.get(roomId), ROOM_CREATION_COST);
    assertEq(Balance.get(playerId), 1000 - ROOM_CREATION_COST);

    prankAdmin();
    startGasReport("Transfer balance to player");
    world.ratroom__transferBalanceToPlayer(roomId, playerId, 50);
    endGasReport();
    vm.stopPrank();

    assertEq(Balance.get(roomId), ROOM_CREATION_COST - 50);
    assertEq(Balance.get(playerId), (1000 - ROOM_CREATION_COST) + 50);
  }
}
