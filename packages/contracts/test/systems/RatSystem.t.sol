// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";

contract RatSystemTest is BaseTest {
    function testAddTrait() public {
        setUp();

        vm.startPrank(alice);
        bytes32 playerEntity = world.ratroom__spawn();
        bytes32 ratEntity = OwnedRat.get(playerEntity);
        vm.stopPrank();

        prankAdmin();

        startGasReport("Add trait");
        world.ratroom__addTrait(ratEntity, "hungry");
        endGasReport();
        
        vm.stopPrank();

        console.log(Trait.get(ratEntity));

        assertTrue(LibUtils.stringEq(Trait.get(ratEntity), ", hungry"));
    }

    function testChangeStat() public {
        setUp();

        vm.startPrank(alice);
        bytes32 playerEntity = world.ratroom__spawn();
        bytes32 ratEntity = OwnedRat.get(playerEntity);
        vm.stopPrank();

        assertEq(Health.get(ratEntity), 100);

        prankAdmin();

        startGasReport("Change stat");
        world.ratroom__changeStat(ratEntity, "health", 10, false);
        endGasReport();

        vm.stopPrank();

        assertEq(Health.get(ratEntity), 110);

        prankAdmin();
        world.ratroom__changeStat(ratEntity, "health", 20, true);
        vm.stopPrank();

        assertEq(Health.get(ratEntity), 90);

        prankAdmin();
        world.ratroom__changeStat(ratEntity, "health", 200, true);
        vm.stopPrank();

        assertEq(Health.get(ratEntity), 0);
        assertTrue(Dead.get(ratEntity));
    }

    function testRevertNotAllowed() public {
        setUp();

        vm.startPrank(alice);
        bytes32 playerEntity = world.ratroom__spawn();
        bytes32 ratEntity = OwnedRat.get(playerEntity);
        vm.stopPrank();

        vm.expectRevert("not allowed");
        world.ratroom__addTrait(ratEntity, "hungry");

        vm.expectRevert("not allowed");
        world.ratroom__changeStat(ratEntity, "health", 10, true);
    }
}
