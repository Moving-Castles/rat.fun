#!/bin/bash

# Require explicit chain ID parameter
CHAIN_ID=$1
VALUE=$2

# Function to get RPC URL by chain ID
get_rpc_url() {
    local chain_id=$1
    case $chain_id in
        "31337")
            echo "http://localhost:8545"
            ;;
        "8453")
            echo "https://mainnet.base.org"
            ;;
        "84532")
            echo "https://sepolia.base.org"
            ;;
        *)
            echo "Error: Unknown chain ID '$chain_id'"
            echo "Supported chain IDs:"
            echo "  31337 - localhost"
            echo "  8453  - base-mainnet"
            echo "  84532 - base-sepolia"
            exit 1
            ;;
    esac
}

# Function to get world address from worlds.json
get_world_address() {
    local chain_id=$1
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local worlds_file="$script_dir/../../worlds.json"

    if [ ! -f "$worlds_file" ]; then
        echo "Error: $worlds_file not found"
        exit 1
    fi

    local address
    address=$(jq -r --arg id "$chain_id" '.[$id].address' "$worlds_file")

    if [ "$address" = "null" ] || [ -z "$address" ]; then
        echo "Error: No world address found for chain ID $chain_id in $worlds_file"
        exit 1
    fi

    echo "$address"
}

# Check if chain ID is provided
if [ -z "$CHAIN_ID" ]; then
    echo "Error: Chain ID parameter is required"
    echo "Usage: $0 <chain-id> <value>"
    echo "  Supported chain IDs:"
    echo "    31337 - localhost"
    echo "    8453  - base-mainnet"
    echo "    84532 - base-sepolia"
    echo "  Value: number of blocks for cooldown (Base ~2s/block)"
    echo "    e.g., 300 = ~10 minutes"
    exit 1
fi

# Check if value is provided
if [ -z "$VALUE" ]; then
    echo "Error: Value parameter is required"
    echo "Usage: $0 <chain-id> <value>"
    echo "  Value: number of blocks for cooldown (Base ~2s/block)"
    echo "    e.g., 300 = ~10 minutes"
    exit 1
fi

# Validate value is a positive number
if ! [[ "$VALUE" =~ ^[0-9]+$ ]] || [ "$VALUE" -lt 0 ]; then
    echo "Error: Value must be a positive number"
    exit 1
fi

# Get RPC URL and world address
RPC=$(get_rpc_url "$CHAIN_ID")
WORLD_ADDRESS=$(get_world_address "$CHAIN_ID")

# Display chain info
case $CHAIN_ID in
    "31337")
        echo "Targeting localhost chain (ID: $CHAIN_ID)..."
        ;;
    "8453")
        echo "Targeting Base Mainnet chain (ID: $CHAIN_ID)..."
        ;;
    "84532")
        echo "Targeting Base Sepolia chain (ID: $CHAIN_ID)..."
        ;;
esac

echo "RPC URL: $RPC"
echo "World Address: $WORLD_ADDRESS"
echo "Setting CooldownCloseTrip to: $VALUE blocks (~$(($VALUE * 2 / 60)) minutes on Base)"
echo ""

forge script SetCooldownCloseTrip --sig run\(address,uint32\) $WORLD_ADDRESS $VALUE --broadcast --rpc-url $RPC -vvvv
