 
 # LOCALHOST
 WORLD_ADDRESS=0x6439113f0e1f64018c3167DA2aC21e2689818086
 ERC20_ADDRESS=0x2222222222222222222222222222222222222222
 RPC_URL=http://127.0.0.1:8545
 
 # GET BEFORE SETTING
 forge script ../getErc20Address.s.sol:GetErc20Address --sig "run(address)" $WORLD_ADDRESS --rpc-url $RPC_URL
 # SET ERC20 ADDRESS
 forge script ../setErc20Address.s.sol:SetErc20Address --sig "run(address,address)" $WORLD_ADDRESS $ERC20_ADDRESS --rpc-url $RPC_URL --broadcast
 # GET ERC20 ADDRESS AFTER SETTING
 forge script ../getErc20Address.s.sol:GetErc20Address --sig "run(address)" $WORLD_ADDRESS --rpc-url $RPC_URL