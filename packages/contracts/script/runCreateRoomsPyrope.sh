RPC=https://rpc.pyropechain.com
WORLD_ADDRESS=0xe52D8837ebF79aa0575590C4D33b8c3f42A7c47F

BATCH_SIZE=5

forge script CreateRooms --sig run\(address\) $WORLD_ADDRESS --broadcast --rpc-url $RPC -vvvv --batch-size $BATCH_SIZE