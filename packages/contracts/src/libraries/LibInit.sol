// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { GameConfig, GameConfigData } from "../codegen/index.sol";
import { MAX_ROOM_PROMPT_LENGTH, MIN_ROOM_PROMPT_LENGTH, MAX_ROOM_NAME_LENGTH, MIN_ROOM_NAME_LENGTH, MAX_INVENTORY_SIZE, MAX_TRAITS_SIZE, CREATOR_FEE } from "../constants.sol";
import { LibUtils } from "./LibUtils.sol";

library LibInit {
  /**
   * @notice Set game config and create tutorial orders
   * @param _adminAddress The address of the admin
   */
  function init(address _adminAddress) internal {
    // Set game config
    GameConfig.set(
      GameConfigData({
        adminAddress: _adminAddress,
        adminId: LibUtils.addressToEntityKey(_adminAddress),
        globalRoomIndex: 0,
        globalRatIndex: 0,
        maxInventorySize: MAX_INVENTORY_SIZE,
        maxTraitsSize: MAX_TRAITS_SIZE,
        ratCreationCost: 100,
        creatorFee: CREATOR_FEE,
        minRoomPromptLength: MIN_ROOM_PROMPT_LENGTH,
        maxRoomPromptLength: MAX_ROOM_PROMPT_LENGTH,
        minRoomNameLength: MIN_ROOM_NAME_LENGTH,
        maxRoomNameLength: MAX_ROOM_NAME_LENGTH
      })
    );
  }
}
