 # BASE MAINNET
 WORLD_ADDRESS=0x28d10E6aAb1a749Be792b4D8aa0519c70E83386a
 ERC20_ADDRESS=0xf2dd384662411a21259ab17038574289091f2d41
 RPC_URL=https://base-mainnet.g.alchemy.com/v2/o0Q1hppQS1CH1vqg63edZ
 
 # GET 
#  forge script ../getErc20Address.s.sol:GetErc20Address --sig "run(address)" $WORLD_ADDRESS --rpc-url $RPC_URL
 # SET ERC20 ADDRESS
#  forge script ../setErc20Address.s.sol:SetErc20Address --sig "run(address,address)" $WORLD_ADDRESS $ERC20_ADDRESS --rpc-url $RPC_URL --broadcast
 # GET ERC20 ADDRESS AFTER SETTING
#  forge script ../getErc20Address.s.sol:GetErc20Address --sig "run(address)" $WORLD_ADDRESS --rpc-url $RPC_URL