// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";

contract BrainSystemTest is BaseTest {
  function testCreateBrain() public {
    setUp();

    vm.startPrank(alice);

    startGasReport("Create brain");
    bytes32 playerEntity = world.ratroom__createBrain(100, 100, 100, 100);
    endGasReport();

    vm.stopPrank();

    BrainData memory brain = Brain.get(playerEntity);

    assertEq(brain.traitA, 100);
    assertEq(brain.traitB, 100);
    assertEq(brain.traitC, 100);
    assertEq(brain.traitD, 100);
  }

  function testRevertMaxPointsExceeded() public {
    setUp();

    vm.startPrank(alice);
    vm.expectRevert("max points exceeded");
    world.ratroom__createBrain(200, 100, 100, 100);
    vm.stopPrank();
  }
}
