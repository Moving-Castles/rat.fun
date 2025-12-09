// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { System } from "@latticexyz/world/src/System.sol";
import {
  GameConfig,
  GamePercentagesConfig,
  EntityType,
  Balance,
  Owner,
  CreationBlock,
  Liquidated,
  LiquidationValue,
  LiquidationBlock,
  LiquidationTaxPercentage,
  ExternalAddressesConfig
} from "../codegen/index.sol";
import { LibTrip, LibUtils, LibWorld } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

contract TripSystem is System {
  /**
   * @dev Modifier to restrict access to admin only
   */
  modifier onlyAdmin() {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
    _;
  }

  /**
   * @notice Create a trip.
   * @dev Only admin can call this function
   * @param _playerId The id of the player creating the trip
   * @param _tripId The id of the trip
   * @param _tripCreationCost Custom trip creation cost
   * @param _prompt The prompt for the trip
   * @return newTripId The id of the new trip
   */
  function createTrip(
    bytes32 _playerId,
    bytes32 _tripId,
    uint256 _tripCreationCost,
    string memory _prompt
  ) public onlyAdmin returns (bytes32 newTripId) {
    // Disallow trips with 0 value
    require(_tripCreationCost > 0, "trip value too low");
    // Trip id can be 0 (which generates a new id) or an unused entity id
    require(_tripId == bytes32(0) || EntityType.get(_tripId) == ENTITY_TYPE.NONE, "trip id already in use");

    newTripId = LibTrip.createTrip(_playerId, _tripId, _tripCreationCost, _prompt);

    // Deposit player tokens in pool
    // ERC-20 will check that player has sufficient balance, and approval for pool to transfer it
    LibWorld.gamePool().depositTokens(
      LibUtils.entityKeyToAddress(_playerId),
      _tripCreationCost * 10 ** LibWorld.erc20().decimals()
    );
  }

  /**
   * @notice Add balance to an existing trip
   * @dev Only trip owner can call this function
   * @param _tripId The id of the trip
   * @param _amount The amount to add to the trip balance
   */
  function addTripBalance(bytes32 _tripId, uint256 _amount) public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    require(Owner.get(_tripId) == playerId, "not owner");
    require(EntityType.get(_tripId) == ENTITY_TYPE.TRIP, "not a trip");
    require(Balance.get(_tripId) > 0, "trip is dead");
    require(_amount > 0, "amount must be positive");

    Balance.set(_tripId, Balance.get(_tripId) + _amount);

    LibWorld.gamePool().depositTokens(_msgSender(), _amount * 10 ** LibWorld.erc20().decimals());
  }

  /**
   * @notice Close a trip
   * @param _tripId The id of the trip to close
   */
  function closeTrip(bytes32 _tripId) public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    require(Owner.get(_tripId) == playerId, "not owner");
    require(block.number > (CreationBlock.get(_tripId) + GameConfig.getCooldownCloseTrip()), "in cooldown");

    uint256 valueToPlayer = Balance.get(_tripId);
    require(valueToPlayer > 0, "trip depleted or already closed");

    // Set Gross liquidation value, before taxation, on trip
    LiquidationValue.set(_tripId, valueToPlayer);

    uint256 currentTaxPercentage = GamePercentagesConfig.getTaxationCloseTrip();

    // Set taxation percentage on trip
    LiquidationTaxPercentage.set(_tripId, currentTaxPercentage);

    // Calculate tax
    uint256 tax = (valueToPlayer * currentTaxPercentage) / 100;
    valueToPlayer -= tax;

    Balance.set(_tripId, 0);

    // Indicate that the trip has been closed by owner
    Liquidated.set(_tripId, true);
    LiquidationBlock.set(_tripId, block.number);

    // Withdraw tokens equal to trip value from pool to player
    // ERC-20 will check that pool has sufficient balance
    if (valueToPlayer > 0) {
      LibWorld.gamePool().withdrawTokens(_msgSender(), valueToPlayer * 10 ** LibWorld.erc20().decimals());
    }

    // Withdraw tokens equal to tax from pool to fee account
    if (tax > 0) {
      LibWorld.gamePool().withdrawTokens(
        ExternalAddressesConfig.getFeeAddress(),
        tax * 10 ** LibWorld.erc20().decimals()
      );
    }
  }
}
