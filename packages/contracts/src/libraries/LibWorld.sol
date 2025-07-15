// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import {
  GameConfig,
  GameConfigData,
  ExternalAddressesConfig,
  ExternalAddressesConfigData,
  Name,
  AchievedLevels,
  WorldEvent,
  WorldEventData
} from "../codegen/index.sol";
import {
  MAX_ROOM_PROMPT_LENGTH,
  MIN_ROOM_PROMPT_LENGTH,
  MAX_INVENTORY_SIZE,
  MAX_TRAITS_SIZE,
  COOLDOWN_CLOSE_ROOM,
  COOLDOWN_REENTER_ROOM
} from "../constants.sol";
import { LibUtils } from "./LibUtils.sol";
import { SlopERC20 } from "../external/SlopERC20.sol";
import { GamePool } from "../external/GamePool.sol";

library LibWorld {
  /**
   * @notice Set game config and create tutorial orders
   * @param _adminAddress The address of the admin
   * @param _levels The levels to add to the admin's AchievedLevels
   */
  function init(
    address _adminAddress,
    address erc20Address,
    address gamePoolAddress,
    address mainSaleAddress,
    address serviceAddress,
    address usdcAddress,
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
        mainSaleAddress: mainSaleAddress,
        serviceAddress: serviceAddress,
        usdcAddress: usdcAddress
      })
    );

    // Set admin name
    Name.set(adminId, "RATKING");

    // Add all levels to admins AchievedLevels
    for (uint256 i = 0; i < _levels.length; i++) {
      AchievedLevels.push(adminId, _levels[i]);
    }
  }

  /**
   * @notice Create a world event
   * @param _title The title of the world event
   * @param _prompt The prompt for the world event
   * @param _durationInBlocks The duration of the world event in blocks
   */
  function createWorldEvent(string memory _title, string memory _prompt, uint256 _durationInBlocks) internal {
    WorldEvent.set(
      WorldEventData({
        title: _title,
        prompt: _prompt,
        creationBlock: block.number,
        expirationBlock: block.number + _durationInBlocks
      })
    );
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
