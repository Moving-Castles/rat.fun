#!/bin/bash

# Check if player address is provided as argument
if [ $# -eq 0 ]; then
    echo "Usage: $0 <player_address>"
    echo "Example: $0 0x1234567890123456789012345678901234567890"
    exit 1
fi

PLAYER_ADDRESS="$1"
ERC20_ADDRESS="0x202CCe504e04bEd6fC0521238dDf04Bc9E8E15aB"
GAMEPOOL_ADDRESS="0xf4B146FbA71F41E0592668ffbF264F1D186b2Ca8"

echo "Checking allowance for player: $PLAYER_ADDRESS"
echo "ERC20 Token: $ERC20_ADDRESS"
echo "GamePool: $GAMEPOOL_ADDRESS"
echo ""

cast call $ERC20_ADDRESS "allowance(address,address)(uint256)" $PLAYER_ADDRESS $GAMEPOOL_ADDRESS

