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
  CreationBlock
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

  function getMaxValuePerWin(bytes32 _tripId) internal view returns (uint256) {
    uint256 balance = Balance.get(_tripId);
    // Use balance or creation cost, whichever is higher
    uint256 costBalanceMax = LibUtils.max(TripCreationCost.get(_tripId), balance);
    // Multiply by the configured percentage
    uint256 result = (GamePercentagesConfig.getMaxValuePerWin() * costBalanceMax) / 100;
    // Cap to balance
    return LibUtils.min(result, balance);
  }

  function getMinRatValueToEnter(bytes32 _tripId) internal view returns (uint256) {
    return (GamePercentagesConfig.getMinRatValueToEnter() * TripCreationCost.get(_tripId)) / 100;
  }
}
