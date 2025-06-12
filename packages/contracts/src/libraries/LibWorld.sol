// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { GameConfig, GameConfigData, ExternalAddressesConfig, ExternalAddressesConfigData, Name, VisitedLevels, WorldPrompt } from "../codegen/index.sol";
import { MAX_ROOM_PROMPT_LENGTH, MIN_ROOM_PROMPT_LENGTH, MAX_INVENTORY_SIZE, MAX_TRAITS_SIZE, COOLDOWN_CLOSE_ROOM, COOLDOWN_REENTER_ROOM } from "../constants.sol";
import { LibUtils } from "./LibUtils.sol";
import { SlopERC20 } from "../external/SlopERC20.sol";
import { GamePool } from "../external/GamePool.sol";

library LibWorld {
  /**
   * @notice Set game config and create tutorial orders
   * @param _adminAddress The address of the admin
   * @param _levels The levels to add to the admin's VisitedLevels
   */
  function init(
    address _adminAddress,
    address erc20Address,
    address gamePoolAddress,
    address mainSaleAddress,
    bytes32[] memory _levels
  ) internal {
    bytes32 adminId = LibUtils.addressToEntityKey(_adminAddress);

    // Set game config
    GameConfig.set(
      GameConfigData({
        adminAddress: _adminAddress,
        adminId: adminId,
        globalRoomIndex: 0,
        globalRatIndex: 0,
        roomCreationCost: 250,
        ratCreationCost: 100,
        maxInventorySize: MAX_INVENTORY_SIZE,
        maxTraitsSize: MAX_TRAITS_SIZE,
        minRoomPromptLength: MIN_ROOM_PROMPT_LENGTH,
        maxRoomPromptLength: MAX_ROOM_PROMPT_LENGTH,
        cooldownCloseRoom: COOLDOWN_CLOSE_ROOM,
        cooldownReenterRoom: COOLDOWN_REENTER_ROOM
      })
    );
    ExternalAddressesConfig.set(
      ExternalAddressesConfigData({
        erc20Address: erc20Address,
        gamePoolAddress: gamePoolAddress,
        mainSaleAddress: mainSaleAddress
      })
    );

    // Set admin name
    Name.set(adminId, "RATKING");

    // Add all levels to admins VisitedLevels
    for (uint256 i = 0; i < _levels.length; i++) {
      VisitedLevels.push(adminId, _levels[i]);
    }
  }

  /**
   * @notice Set the world prompt
   * @param _worldPrompt The prompt for the world
   */
  function setWorldPrompt(string memory _worldPrompt) internal {
    WorldPrompt.set(_worldPrompt);
  }

  /**
   * @notice Get the erc20 token contract used by the world
   */
  function erc20() internal view returns (SlopERC20) {
    return SlopERC20(ExternalAddressesConfig.getErc20Address());
  }

  /**
   * @notice Get the game pool contract used by the world
   */
  function gamePool() internal view returns (GamePool) {
    return GamePool(ExternalAddressesConfig.getGamePoolAddress());
  }
}
