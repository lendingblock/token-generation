# LND Token Generation

### Dependencies

ganache v1.1.0-beta.0 https://github.com/trufflesuite/ganache  
truffle v4.0.6 https://github.com/trufflesuite/truffle

### Testing

1. `truffle compile`
1. run ganache, using older versions or other versions of testrpc and truffle might cause the tests to fail due to the way they handle a failed `require()`
1. `truffle test ./test/checkParameters.js --network dev`
1. restart ganache as some tests are manipulating time
1. `truffle test ./test/accessControl.js --network dev`
1. restart ganache as some tests are manipulating time
1. `truffle test ./test/eventFlow.js --network dev`

### Requirements

1.	symbol is LND
1.	name is Lendingblock
1.	LND is erc20 compliant token
1.	1 billion LND is created when deployed and no more can be created
1.	LND has 18 decimals
1.	1 billion LND is first created to dev wallet
1.	LND can be burned which reduces total supply
1.	dev owns the LND token contract and can change the time when transfers are allowed (transferableTime)
1.	before the tokens are transferable, only the token generation contract and dev can transfer LND
1.	transferableTime starts at 1/1/2019 and can only be adjusted down but can be adjusted any amount of times
1.	any ether/token stuck in LND token contract can no longer be retrieved
1.	dev owns the token generation contract and has access to
    - setMain
    - setWhitelistedAddressMain
    - endEvent
1.	setMain changes
    - start time
    - end time
    - minimum contribution
    - maximum contribution
    - exchange rate of the token generation
1.	setMain can be called at anytime, any amount of times as long as the start time to be set is in the future
1.	in each round, all users have the same cap and rate
1.	setWhitelistedAddressMain sets an address status to true or false
1.	setWhitelistedAddressMain can be called at anytime, any amount of times
1.	for pre sale round, there is an identical set of functions but suffix with Pre instead of Main i.e. setPre, setWhitelistedAddressPre
1.	endEvent burns all the remaining LND in the token generation contract and deactivates all functions of the token generation contract
1.	endEvent can only be called after end time
1.	before token generation starts, dev will send the amount of LND for that round to the token generation contract
1.	users can send funds directly to our token generation contract without any data input
1.	for each valid incoming funds, the funds is directly routed to company wallet and LND are sent in return
1.	a valid incoming funds must be
    - sent after start time
    - sent before end time
    - more than the minimum contribution
    - address is whitelisted
    - total contribution from that user is less than maximum contribution
    - token generation contract has enough LND
1.	any ether/token stuck in token generation contract can no longer be retrieved
1.	company wallet address for token generation cannot be changed
