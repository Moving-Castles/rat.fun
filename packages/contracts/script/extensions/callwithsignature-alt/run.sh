# # # # # # # # # # # #
# LOCALHOST
# # # # # # # # # # # #

# LOCALHOST_WORLD_ADDRESS=0x6439113f0e1f64018c3167DA2aC21e2689818086
#LOCALHOST_RPC_URL=http://localhost:8545

# forge script InstallCallWithSignatureAltModule --sig run\(address\) $LOCALHOST_WORLD_ADDRESS --rpc-url $LOCALHOST_RPC_URL --broadcast -vvv --batch-size 5

# # # # # # # # # # # #
# MAINNET (Base Mainnet)
# # # # # # # # # # # #

# MAINNET_WORLD_ADDRESS=0x28d10E6aAb1a749Be792b4D8aa0519c70E83386a
# MAINNET_RPC_URL=https://base-mainnet.g.alchemy.com/v2/-hnbjcqjwXmO7ip5cyHBh

# forge script InstallCallWithSignatureAltModule --sig run\(address\) $MAINNET_WORLD_ADDRESS --rpc-url $MAINNET_RPC_URL --broadcast -vvv --batch-size 5
# forge script RegisterCallWithSignatureAltSystem --sig run\(address\) $MAINNET_WORLD_ADDRESS --rpc-url $MAINNET_RPC_URL --broadcast -vvv --batch-size 5

# # # # # # # # # # # #
# BASE SEPOLIA
# # # # # # # # # # # #

BASE_SEPOLIA_WORLD_ADDRESS=0x85e4771925b8755f0F9Dd835aAa77303cbe9d684
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/-hnbjcqjwXmO7ip5cyHBh

forge script InstallCallWithSignatureAltModule --sig run\(address\) $BASE_SEPOLIA_WORLD_ADDRESS --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast -vvv --batch-size 5
forge script RegisterCallWithSignatureAltSystem --sig run\(address\) $BASE_SEPOLIA_WORLD_ADDRESS --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast -vvv --batch-size 5

# # # # # # # # # # # #
# DEBUG SIGNATURE
# # # # # # # # # # # #
# Fill in these values from the client logs when testing
# SIGNER=0xa34f0A5c90e44A2e19c5454C95996a39BaCb815B
# SYSTEM_ID=0x73790000000000000000000000000000526567697374726174696f6e00000000
# CALL_DATA=0x1d2257ba000000000000000000000000119ef8981d7c8b5c4c3a8ec1b6117e52e6cbb6da73790000000000000000000000000000756e6c696d697465640000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000
# NONCE=0
# SIGNATURE=0xba37d4096bb67ba34594df453df9e37c1c9763a4a858b5485ba98fb1c8c9ec2601688e2572be230adea34a9da5fd8e85611958fa7be935522dcf78dbafd24a1f1c

# forge script DebugSignature --sig "run(address,address,bytes32,bytes,uint256,bytes)" \
#   $MAINNET_WORLD_ADDRESS $SIGNER $SYSTEM_ID $CALL_DATA $NONCE $SIGNATURE \
#   --rpc-url $MAINNET_RPC_URL -vvvv

