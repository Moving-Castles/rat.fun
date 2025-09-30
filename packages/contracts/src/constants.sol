// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

uint256 constant RAT_CREATION_COST = 100;

uint32 constant MAX_INVENTORY_SIZE = 6;
uint32 constant MAX_ROOM_PROMPT_LENGTH = 280;
uint32 constant MIN_ROOM_PROMPT_LENGTH = 10;

uint32 constant COOLDOWN_CLOSE_ROOM = 60; // About 2 minutes

uint32 constant MAX_VALUE_PER_WIN_PERCENTAGE = 25; // 25%
uint32 constant MIN_RAT_VALUE_TO_ENTER_PERCENTAGE = 10; // 10%
uint32 constant TAXATION_LIQUIDATE_RAT_PERCENTAGE = 10; // 10%
uint32 constant TAXATION_CLOSE_ROOM_PERCENTAGE = 10; // 10%
