// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import {
  EntityType,
  Prompt,
  Owner,
  Index,
  GamePercentagesConfig,
  WorldStats,
  Balance,
  TripCreationCost,
  VisitCount,
  CreationBlock,
  ChallengeTrip,
  FixedMinValueToEnter,
  OverrideMaxValuePerWinPercentage
} from "../codegen/index.sol";
import { LibUtils } from "./LibUtils.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

library LibTrip {
  /**
   * @notice Create a trip
   * @param _prompt The prompt for the trip
   * @param _tripOwner Id of the owner of the trip
   * @param _tripCreationCost The creation cost of the trip
   * @return newTripId The id of the new trip
   */
  function createTrip(
    bytes32 _tripOwner,
    bytes32 _tripId,
    uint256 _tripCreationCost,
    string memory _prompt
  ) internal returns (bytes32 newTripId) {
    // If _tripId is not provided, generate a new unique id
    if (_tripId == bytes32(0)) {
      newTripId = getUniqueEntity();
    } else {
      newTripId = _tripId;
    }

    Owner.set(newTripId, _tripOwner);

    EntityType.set(newTripId, ENTITY_TYPE.TRIP);
    Prompt.set(newTripId, _prompt);

    uint256 newTripIndex = WorldStats.getGlobalTripIndex() + 1;
    WorldStats.setGlobalTripIndex(newTripIndex);
    Index.set(newTripId, newTripIndex);
    CreationBlock.set(newTripId, block.number);

    VisitCount.set(newTripId, 0);

    Balance.set(newTripId, _tripCreationCost);
    TripCreationCost.set(newTripId, _tripCreationCost);
  }

  /**
   * @notice Get the maximum value per win for a trip
   * @param _tripId The id of the trip
   * @return maxValuePerWin The maximum value per win for the trip
   */
  function getMaxValuePerWin(bytes32 _tripId) internal view returns (uint256) {
    uint256 balance = Balance.get(_tripId);
    // Use balance or creation cost, whichever is higher
    uint256 costBalanceMax = LibUtils.max(TripCreationCost.get(_tripId), balance);
    uint256 result;
    if (ChallengeTrip.get(_tripId)) {
      // Multiply by the override maximum value per win percentage
      result = (OverrideMaxValuePerWinPercentage.get(_tripId) * costBalanceMax) / 100;
    } else {
      // Multiply by the configured percentage
      result = (GamePercentagesConfig.getMaxValuePerWin() * costBalanceMax) / 100;
    }
    // Cap to balance
    return LibUtils.min(result, balance);
  }

  /**
   * @notice Get the minimum value to enter a trip
   * @param _tripId The id of the trip
   * @return minValueToEnter The minimum value to enter the trip
   */
  function getMinRatValueToEnter(bytes32 _tripId) internal view returns (uint256) {
    // If the trip is a challenge trip, return the fixed minimum value to enter
    if (ChallengeTrip.get(_tripId)) {
      return FixedMinValueToEnter.get(_tripId);
    }
    // Otherwise, return the minimum value to enter as a percentage of the trip creation cost
    return (GamePercentagesConfig.getMinRatValueToEnter() * TripCreationCost.get(_tripId)) / 100;
  }
}
