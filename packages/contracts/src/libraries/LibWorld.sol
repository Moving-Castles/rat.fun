// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import {
  GameConfig,
  GamePercentagesConfig,
  GamePercentagesConfigData,
  GameConfigData,
  ExternalAddressesConfig,
  ExternalAddressesConfigData,
  Name,
  WorldEvent,
  WorldEventData
} from "../codegen/index.sol";
import {
  RAT_CREATION_COST,
  MAX_ROOM_PROMPT_LENGTH,
  MIN_ROOM_PROMPT_LENGTH,
  MAX_INVENTORY_SIZE,
  COOLDOWN_CLOSE_ROOM,
  MAX_VALUE_PER_WIN_PERCENTAGE,
  MIN_RAT_VALUE_TO_ENTER_PERCENTAGE,
  TAXATION_LIQUIDATE_RAT_PERCENTAGE,
  TAXATION_CLOSE_ROOM_PERCENTAGE
} from "../constants.sol";
import { LibUtils } from "./LibUtils.sol";
import { SlopERC20 } from "../external/SlopERC20.sol";
import { GamePool } from "../external/GamePool.sol";

library LibWorld {
  /**
   * @notice Set game config and create tutorial orders
   * @param _adminAddress The address of the admin
   * @param erc20Address The address of the erc20 token
   * @param gamePoolAddress The address of the game pool
   * @param mainSaleAddress The address of the main sale
   * @param serviceAddress The address of the service
   * @param usdcAddress The address of the usdc token
   */
  function init(
    address _adminAddress,
    address erc20Address,
    address gamePoolAddress,
    address mainSaleAddress,
    address serviceAddress,
    address usdcAddress
  ) internal {
    bytes32 adminId = LibUtils.addressToEntityKey(_adminAddress);

    // Set game config
    GameConfig.set(
      GameConfigData({
        adminAddress: _adminAddress,
        adminId: adminId,
        ratCreationCost: RAT_CREATION_COST,
        maxInventorySize: MAX_INVENTORY_SIZE,
        maxRoomPromptLength: MAX_ROOM_PROMPT_LENGTH,
        cooldownCloseRoom: COOLDOWN_CLOSE_ROOM
      })
    );

    GamePercentagesConfig.set(
      GamePercentagesConfigData({
        maxValuePerWin: MAX_VALUE_PER_WIN_PERCENTAGE,
        minRatValueToEnter: MIN_RAT_VALUE_TO_ENTER_PERCENTAGE,
        taxationLiquidateRat: TAXATION_LIQUIDATE_RAT_PERCENTAGE,
        taxationCloseRoom: TAXATION_CLOSE_ROOM_PERCENTAGE
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
    // Approve game pool to spend admin's tokens
    erc20().approve(address(gamePool()), type(uint256).max);
  }

  /**
   * @notice Set a world event
   * @param _cmsId The id of the world event in the CMS
   * @param _title The title of the world event
   * @param _prompt The prompt for the world event
   * @param _durationInBlocks The duration of the world event in blocks
   */
  function setWorldEvent(
    string memory _cmsId,
    string memory _title,
    string memory _prompt,
    uint256 _durationInBlocks
  ) internal {
    WorldEvent.set(
      WorldEventData({
        cmsId: _cmsId,
        title: _title,
        prompt: _prompt,
        creationBlock: block.number,
        expirationBlock: block.number + _durationInBlocks
      })
    );
  }

  /**
   * @notice Remove the world event
   */
  function removeWorldEvent() internal {
    WorldEvent.set(WorldEventData({ cmsId: "", title: "", prompt: "", creationBlock: 0, expirationBlock: 0 }));
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
