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
        bytes32 hungryTraitId = world.ratroom__addTrait(ratEntity, "hungry");
        endGasReport();
        
        vm.stopPrank();

        assertEq(uint8(EntityType.get(hungryTraitId)), uint8(ENTITY_TYPE.TRAIT));
        assertTrue(LibUtils.stringEq(Name.get(hungryTraitId), "hungry"));

        bytes32[] memory traits = Traits.get(ratEntity);
        assertEq(traits.length, 1);
        assertEq(traits[0], hungryTraitId);
    }

    function testRemoveTrait() public {
        setUp();

        vm.startPrank(alice);
        bytes32 playerEntity = world.ratroom__spawn();
        bytes32 ratEntity = OwnedRat.get(playerEntity);
        vm.stopPrank();

        prankAdmin();

        bytes32 hungryTraitId = world.ratroom__addTrait(ratEntity, "hungry");

        assertEq(uint8(EntityType.get(hungryTraitId)), uint8(ENTITY_TYPE.TRAIT));
        assertTrue(LibUtils.stringEq(Name.get(hungryTraitId), "hungry"));

        startGasReport("Remove trait");
        world.ratroom__removeTrait(ratEntity, hungryTraitId);
        endGasReport();
        
        vm.stopPrank();

        assertEq(uint8(EntityType.get(hungryTraitId)), uint8(ENTITY_TYPE.NONE));
        assertTrue(LibUtils.stringEq(Name.get(hungryTraitId), ""));

        bytes32[] memory traits = Traits.get(ratEntity);
        assertEq(traits.length, 0);
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
        world.ratroom__removeTrait(ratEntity, bytes32(0));

        vm.expectRevert("not allowed");
        world.ratroom__changeStat(ratEntity, "health", 10, true);
    }
}
