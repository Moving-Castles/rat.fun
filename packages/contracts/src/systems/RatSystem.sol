// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Owner, CurrentRat, Dead, Inventory, GameConfig, Value, Balance } from "../codegen/index.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { LibUtils, LibRat, LibWorld } from "../libraries/Libraries.sol";

contract RatSystem is System {
  /**
   * @notice Create a rat
   * @param _name The name of the rat
   * @return ratId The id of the new rat
   */
  function createRat(string calldata _name) public returns (bytes32 ratId) {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());

    bytes32 currentRat = CurrentRat.get(playerId);

    // Can't create a new rat if the player already has a live rat
    require(currentRat == bytes32(0) || Dead.get(currentRat), "already has live rat");

    ratId = LibRat.createRat(_name);

    // Set ownership
    CurrentRat.set(playerId, ratId);
    Owner.set(ratId, playerId);

    // Deposit player tokens in pool
    // ERC-20 will check that player has sufficient balance, and approval for pool to transfer it
    LibWorld.gamePool().depositTokens(
      _msgSender(),
      GameConfig.getRatCreationCost() * 10 ** LibWorld.erc20().decimals()
    );
  }

  /**
   * @notice Liquidate the player's rat
   */
  function liquidateRat() public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    bytes32 ratId = CurrentRat.get(playerId);

    require(ratId != bytes32(0), "no rat");

    // Check that the rat is alive
    require(!Dead.get(ratId), "rat is dead");

    uint256 valueToPlayer = LibRat.killRat(ratId);

    // Calculate tax
    uint256 tax = (valueToPlayer * GameConfig.getTaxationLiquidateRat()) / 100;
    valueToPlayer -= tax;

    // Withdraw tokens equal to rat value minus tax from pool to player
    // ERC-20 will check that pool has sufficient balance
    LibWorld.gamePool().withdrawTokens(_msgSender(), valueToPlayer * 10 ** LibWorld.erc20().decimals());

    // Withdraw tokens equal to tax from pool to admin
    LibWorld.gamePool().withdrawTokens(GameConfig.getAdminAddress(), tax * 10 ** LibWorld.erc20().decimals());
  }
}
