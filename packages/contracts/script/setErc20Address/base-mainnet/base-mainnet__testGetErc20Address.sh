 # BASE MAINNET
 WORLD_ADDRESS=0x28d10E6aAb1a749Be792b4D8aa0519c70E83386a
 RPC_URL=https://base-mainnet.g.alchemy.com/v2/o0Q1hppQS1CH1vqg63edZ
 
 # GET 
 forge script ../getErc20Address.s.sol:GetErc20Address --sig "run(address)" $WORLD_ADDRESS --rpc-url $RPC_URL