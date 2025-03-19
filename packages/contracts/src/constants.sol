// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

/// @dev Material amounts and token have 18 decimals
uint256 constant ONE_UNIT = 1e18;

uint32 constant ONE_MINUTE = 60;
uint32 constant ONE_HOUR = 60 * 60;
uint32 constant ONE_DAY = 24 * ONE_HOUR;

uint32 constant MAX_ROOM_PROMPT_LENGTH = 500;
uint32 constant MAX_INVENTORY_SIZE = 5;
uint32 constant MAX_TRAITS_SIZE = 10;
uint256 constant CREATOR_FEE = 33;
uint256 constant LEVEL_UP_COST = 100;
