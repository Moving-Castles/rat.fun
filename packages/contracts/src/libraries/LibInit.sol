// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { GameConfig, GameConfigData } from "../codegen/index.sol";
import { ROOM_CREATION_COST, MAX_ROOM_PROMPT_LENGTH } from "../constants.sol";

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
        globalRoomIndex: 0,
        globalRatIndex: 0,
        roomCreationCost: ROOM_CREATION_COST,
        maxRoomPromptLength: MAX_ROOM_PROMPT_LENGTH
      })
    );
  }
}
