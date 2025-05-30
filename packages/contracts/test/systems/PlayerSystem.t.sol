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
    bytes32 playerId = world.ratroom__spawn("alice");
    endGasReport();

    vm.stopPrank();

    // Check player
    assertEq(uint8(EntityType.get(playerId)), uint8(ENTITY_TYPE.PLAYER));
    assertEq(Name.get(playerId), "alice");
    assertEq(Balance.get(playerId), GameConfig.getStartingBalance());
    assertEq(CreationBlock.get(playerId), block.number);
  }

  function testRevertAlreadySpawned() public {
    vm.startPrank(alice);

    world.ratroom__spawn("alice");

    vm.expectRevert("already spawned");
    world.ratroom__spawn("alice");

    vm.stopPrank();
  }
}
