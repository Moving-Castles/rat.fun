// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE, ROOM_TYPE } from "../../src/codegen/common.sol";

contract RoomSystemTest is BaseTest {

  function testCreateRoom() public {
    setUp();

    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn("alice");
    world.ratroom__givePlayerBalance(1000);

    assertEq(Balance.get(playerId), 1000);

    startGasReport("Create room (user)");
    bytes32 roomId = world.ratroom__createRoom("A test room", ROOM_TYPE.ONE_PLAYER);
    endGasReport();

    console.logBytes32(roomId);

    vm.stopPrank();

    // Check player balance (100 = room creation cost)
    assertEq(Balance.get(playerId), 1000 - 100);

    // Check room
    assertEq(uint8(EntityType.get(roomId)), uint8(ENTITY_TYPE.ROOM));
    assertEq(RoomPrompt.get(roomId), "A test room");
    assertEq(Balance.get(roomId), 100);
    assertEq(Owner.get(roomId), playerId);
    assertEq(Level.get(roomId), LevelList.get()[0]);
  }

  function testLongRoomPrompt() public {
    setUp();

    vm.startPrank(alice);
    bytes32 playerId = world.ratroom__spawn("alice");
    world.ratroom__givePlayerBalance(1000);
    
    assertEq(Balance.get(playerId), 1000);

    startGasReport("Create room: long prompt");
    world.ratroom__createRoom(
      "The room has two doors. One doors lead to death, the other to freedom. If a rat does not make a choice within 10 minutes it is killed and the body removed. Each door has a guardian mouse that needs to be defeated to pass.", 
      ROOM_TYPE.ONE_PLAYER
    );
    endGasReport();

    vm.stopPrank();
  }

  function testRevertPromptTooShort() public {
    setUp();

    prankAdmin();
    vm.expectRevert("prompt too short");
    world.ratroom__createRoom("", ROOM_TYPE.ONE_PLAYER);
    vm.stopPrank();
  }

  function testRevertPromptTooLong() public {
    setUp();

    prankAdmin();
    vm.expectRevert("prompt too long");
    world.ratroom__createRoom(
      "The room has two doors. One doors lead to death, the other to freedom. If a rat does not make a choice within 10 minutes it is killed and the body removed. Each door has a guardian mouse that needs to be defeated to pass. The room has two doors. One doors lead to death, the other to freedom. If a rat does not make a choice within 10 minutes it is killed and the body removed. Each door has a guardian mouse that needs to be defeated to pass. The room has two doors. One doors lead to death, the other to freedom. If a rat does not make a choice within 10 minutes it is killed and the body removed. Each door has a guardian mouse that needs to be defeated to pass.",
      ROOM_TYPE.ONE_PLAYER
    );
    vm.stopPrank();
  }

  function testRevertBlanceTooLow() public {
    setUp();

    vm.startPrank(alice);

    vm.expectRevert("balance too low");
    world.ratroom__createRoom("A test room", ROOM_TYPE.ONE_PLAYER);

    vm.stopPrank();
  }
}
