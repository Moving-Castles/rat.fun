#!/bin/bash

# Check if player address is provided as argument
if [ $# -eq 0 ]; then
    echo "Usage: $0 <player_address>"
    echo "Example: $0 0x1234567890123456789012345678901234567890"
    exit 1
fi

PLAYER_ADDRESS="$1"
ERC20_ADDRESS="0x0355B7B8cb128fA5692729Ab3AAa199C1753f726"

echo "Checking balance for player: $PLAYER_ADDRESS"
echo "ERC20 Token: $ERC20_ADDRESS"
echo ""

cast call $ERC20_ADDRESS "balanceOf(address)(uint256)" $PLAYER_ADDRESS

