// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";

contract PlayerSystemTest is BaseTest {
  function testSpawn() public {
    vm.startPrank(alice);

    startGasReport("Spawn");
    bytes32 playerId = world.ratfun__spawn("alice");
    endGasReport();

    vm.stopPrank();

    // Check player
    assertEq(uint8(EntityType.get(playerId)), uint8(ENTITY_TYPE.PLAYER));
    assertEq(Name.get(playerId), "alice");
    assertEq(Balance.get(playerId), 0);
    assertEq(CreationBlock.get(playerId), block.number);
  }

  function testRevertAlreadySpawned() public {
    vm.startPrank(alice);

    world.ratfun__spawn("alice");

    vm.expectRevert("already spawned");
    world.ratfun__spawn("alice");

    vm.stopPrank();
  }
}
