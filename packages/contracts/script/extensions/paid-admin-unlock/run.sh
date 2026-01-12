# # # # # # # # # # # #
# LOCALHOST
# # # # # # # # # # # #

# LOCALHOST_WORLD_ADDRESS=0x6439113f0e1f64018c3167DA2aC21e2689818086
# LOCALHOST_RPC_URL=http://localhost:8545

# forge script ./DeployUnlockAdminSystem.s.sol --sig run\(address\) $LOCALHOST_WORLD_ADDRESS --rpc-url $LOCALHOST_RPC_URL --broadcast -vvv --batch-size 5
# forge script ./DeployManagerSystem.s.sol --sig run\(address\) $LOCALHOST_WORLD_ADDRESS --rpc-url $LOCALHOST_RPC_URL --broadcast -vvv --batch-size 5
# forge script ./DeployTripSystem.s.sol --sig run\(address\) $LOCALHOST_WORLD_ADDRESS --rpc-url $LOCALHOST_RPC_URL --broadcast -vvv --batch-size 5

# # # # # # # # # # # #
# TESTNET (Base Sepolia)
# # # # # # # # # # # #

# TESTNET_WORLD_ADDRESS=0xb559D9fb876F6fC3AC05B21004B33760B3582042
# TESTNET_RPC_URL=https://base-sepolia.g.alchemy.com/v2/xEQqRE27u_VVjfn5HlN2J

# forge script ./DeployUnlockAdminSystem.s.sol --sig run\(address\) $TESTNET_WORLD_ADDRESS --rpc-url $TESTNET_RPC_URL --broadcast -vvv --batch-size 5
# forge script ./DeployManagerSystem.s.sol --sig run\(address\) $TESTNET_WORLD_ADDRESS --rpc-url $TESTNET_RPC_URL --broadcast -vvv --batch-size 5
# forge script ./DeployTripSystem.s.sol --sig run\(address\) $TESTNET_WORLD_ADDRESS --rpc-url $TESTNET_RPC_URL --broadcast -vvv --batch-size 5

# # # # # # # # # # # #
# MAINNET (Base Mainnet)
# # # # # # # # # # # #

MAINNET_WORLD_ADDRESS=0x28d10E6aAb1a749Be792b4D8aa0519c70E83386a
MAINNET_RPC_URL=https://base-mainnet.g.alchemy.com/v2/-hnbjcqjwXmO7ip5cyHBh

# forge script ./DeployUnlockAdminSystem.s.sol --sig run\(address\) $MAINNET_WORLD_ADDRESS --rpc-url $MAINNET_RPC_URL --broadcast -vvv --batch-size 5
# forge script ./DeployManagerSystem.s.sol --sig run\(address\) $MAINNET_WORLD_ADDRESS --rpc-url $MAINNET_RPC_URL --broadcast -vvv --batch-size 5
# forge script ./DeployTripSystem.s.sol --sig run\(address\) $MAINNET_WORLD_ADDRESS --rpc-url $MAINNET_RPC_URL --broadcast -vvv --batch-size 5

# Verify current ManagerSystem address
echo "=== BEFORE DEPLOYMENT ==="
forge script ./verifyManagerSystem.s.sol --sig run\(address\) $MAINNET_WORLD_ADDRESS --rpc-url $MAINNET_RPC_URL -vvv

# Deploy new ManagerSystem
forge script ./DeployManagerSystem.s.sol --sig run\(address\) $MAINNET_WORLD_ADDRESS --rpc-url $MAINNET_RPC_URL -vvv --batch-size 5 --broadcast

# Verify new ManagerSystem address
echo "=== AFTER DEPLOYMENT ==="
forge script ./verifyManagerSystem.s.sol --sig run\(address\) $MAINNET_WORLD_ADDRESS --rpc-url $MAINNET_RPC_URL -vvv

# forge script ./DeployTripSystem.s.sol --sig run\(address\) $MAINNET_WORLD_ADDRESS --rpc-url $MAINNET_RPC_URL -vvv --batch-size 5 --broadcast
