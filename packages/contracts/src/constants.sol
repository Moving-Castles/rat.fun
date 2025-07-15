// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

uint32 constant MAX_INVENTORY_SIZE = 5;
uint32 constant MAX_TRAITS_SIZE = 5;
uint32 constant MAX_ROOM_PROMPT_LENGTH = 280;
uint32 constant MIN_ROOM_PROMPT_LENGTH = 10;

uint32 constant COOLDOWN_CLOSE_ROOM = 60; // About 2 minutes
uint32 constant COOLDOWN_REENTER_ROOM = 10; // About 20 seconds
