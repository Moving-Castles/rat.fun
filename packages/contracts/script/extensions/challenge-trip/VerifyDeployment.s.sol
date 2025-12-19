// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { IStore } from "@latticexyz/store/src/IStore.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { RESOURCE_SYSTEM, RESOURCE_TABLE } from "@latticexyz/world/src/worldResourceTypes.sol";
import { SystemRegistry } from "@latticexyz/world/src/codegen/tables/SystemRegistry.sol";
import { Systems } from "@latticexyz/world/src/codegen/tables/Systems.sol";
import { FunctionSelectors } from "@latticexyz/world/src/codegen/tables/FunctionSelectors.sol";
import { ResourceIds } from "@latticexyz/store/src/codegen/tables/ResourceIds.sol";

// Table imports for resource IDs
import { ChallengeTrip } from "../../../src/codegen/tables/ChallengeTrip.sol";
import { ChallengeWinner } from "../../../src/codegen/tables/ChallengeWinner.sol";
import { FixedMinValueToEnter } from "../../../src/codegen/tables/FixedMinValueToEnter.sol";
import { OverrideMaxValuePerWinPercentage } from "../../../src/codegen/tables/OverrideMaxValuePerWinPercentage.sol";

/**
 * @title VerifyDeployment
 * @notice Verifies that challenge trip tables and systems are properly registered
 */
contract VerifyDeployment is Script {
  function run(address worldAddress) external {
    console.log("=== Verifying Challenge Trip Deployment ===");
    console.log("World address:", worldAddress);
    console.log("");

    // Point StoreSwitch to the world (not a view function)
    StoreSwitch.setStoreAddress(worldAddress);

    // ============================================
    // CHECK TABLES
    // ============================================
    console.log("--- TABLES ---");

    // Check ChallengeTrip table
    ResourceId challengeTripTableId = ChallengeTrip._tableId;
    bool challengeTripExists = ResourceIds.getExists(challengeTripTableId);
    console.log("ChallengeTrip table:");
    console.log("  Resource ID:");
    console.logBytes32(ResourceId.unwrap(challengeTripTableId));
    console.log("  Registered:", challengeTripExists);

    // Check ChallengeWinner table
    ResourceId challengeWinnerTableId = ChallengeWinner._tableId;
    bool challengeWinnerExists = ResourceIds.getExists(challengeWinnerTableId);
    console.log("ChallengeWinner table:");
    console.log("  Resource ID:");
    console.logBytes32(ResourceId.unwrap(challengeWinnerTableId));
    console.log("  Registered:", challengeWinnerExists);

    // Check FixedMinValueToEnter table
    ResourceId fixedMinValueTableId = FixedMinValueToEnter._tableId;
    bool fixedMinValueExists = ResourceIds.getExists(fixedMinValueTableId);
    console.log("FixedMinValueToEnter table:");
    console.log("  Resource ID:");
    console.logBytes32(ResourceId.unwrap(fixedMinValueTableId));
    console.log("  Registered:", fixedMinValueExists);

    // Check OverrideMaxValuePerWinPercentage table
    ResourceId overrideMaxValueTableId = OverrideMaxValuePerWinPercentage._tableId;
    bool overrideMaxValueExists = ResourceIds.getExists(overrideMaxValueTableId);
    console.log("OverrideMaxValuePerWinPercentage table:");
    console.log("  Resource ID:");
    console.logBytes32(ResourceId.unwrap(overrideMaxValueTableId));
    console.log("  Registered:", overrideMaxValueExists);

    console.log("");

    // ============================================
    // CHECK SYSTEMS
    // ============================================
    console.log("--- SYSTEMS ---");

    // Check TripSystem
    ResourceId tripSystemResource = WorldResourceIdLib.encode(RESOURCE_SYSTEM, "ratfun", "TripSystem");
    (address tripSystemAddr, bool tripSystemPublic) = Systems.get(tripSystemResource);
    console.log("TripSystem:");
    console.log("  Resource ID:");
    console.logBytes32(ResourceId.unwrap(tripSystemResource));
    console.log("  Address:", tripSystemAddr);
    console.log("  Public:", tripSystemPublic);

    // Check ManagerSystem
    ResourceId managerSystemResource = WorldResourceIdLib.encode(RESOURCE_SYSTEM, "ratfun", "ManagerSystem");
    (address managerSystemAddr, bool managerSystemPublic) = Systems.get(managerSystemResource);
    console.log("ManagerSystem:");
    console.log("  Resource ID:");
    console.logBytes32(ResourceId.unwrap(managerSystemResource));
    console.log("  Address:", managerSystemAddr);
    console.log("  Public:", managerSystemPublic);

    console.log("");

    // ============================================
    // CHECK FUNCTION SELECTORS
    // ============================================
    console.log("--- FUNCTION SELECTORS ---");

    // Check applyOutcome selector (0x674fcbf9)
    bytes4 applyOutcomeSelector = bytes4(
      keccak256("ratfun__applyOutcome(bytes32,bytes32,int256,bytes32[],(string,uint256)[])")
    );
    (ResourceId applyOutcomeSystemId, bytes4 applyOutcomeSystemSelector) = FunctionSelectors.get(applyOutcomeSelector);
    console.log("ratfun__applyOutcome:");
    console.log("  World selector:", vm.toString(applyOutcomeSelector));
    console.log("  Maps to system resource:");
    console.logBytes32(ResourceId.unwrap(applyOutcomeSystemId));
    console.log("  System function selector:", vm.toString(applyOutcomeSystemSelector));
    console.log("  Registered:", ResourceId.unwrap(applyOutcomeSystemId) != bytes32(0));

    // Check createTrip selector (new 7-param version)
    bytes4 createTripSelector = bytes4(
      keccak256("ratfun__createTrip(bytes32,bytes32,uint256,bool,uint256,uint256,string)")
    );
    (ResourceId createTripSystemId, bytes4 createTripSystemSelector) = FunctionSelectors.get(createTripSelector);
    console.log("ratfun__createTrip (7 params):");
    console.log("  World selector:", vm.toString(createTripSelector));
    console.log("  Maps to system resource:");
    console.logBytes32(ResourceId.unwrap(createTripSystemId));
    console.log("  System function selector:", vm.toString(createTripSystemSelector));
    console.log("  Registered:", ResourceId.unwrap(createTripSystemId) != bytes32(0));

    console.log("");
    console.log("=== Verification Complete ===");
  }
}
