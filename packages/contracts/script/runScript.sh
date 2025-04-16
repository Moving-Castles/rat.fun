

RPC=https://rpc.pyropechain.com
WORLD_ADDRESS=0x167D23E98E0Ca66c281A7D1d8779B34454E83991

BATCH_SIZE=5

forge script CreateRooms --sig run\(address\) $WORLD_ADDRESS --broadcast --rpc-url $RPC -vvvv --batch-size $BATCH_SIZE