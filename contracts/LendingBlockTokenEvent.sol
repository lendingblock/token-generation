pragma solidity ^0.4.18;


import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import './LendingBlockToken.sol';

/**
* @title LendingBlockTokenEvent
* @dev sale contract that accepts eth and sends LND tokens in return
* only the owner can change parameters
* deploys LND token when this contract is deployed
* 2 separate list of participants, mainly pre sale and main sale
* multiple rounds are possible for pre sale and main sale
* within a round, all participants have the same contribution min, max and rate
*/
contract LendingBlockTokenEvent is Ownable {
	using SafeMath for uint256;

	LendingBlockToken public token;
	address public wallet;
	bool public eventEnded;
	uint256 public startTimePre;
	uint256 public startTimeMain;
	uint256 public endTimePre;
	uint256 public endTimeMain;
	uint256 public ratePre;
	uint256 public rateMain;
	uint256 public minCapPre;
	uint256 public minCapMain;
	uint256 public maxCapPre;
	uint256 public maxCapMain;
	uint256 public weiTotal;
	mapping(address => bool) public whitelistedAddressPre;
	mapping(address => bool) public whitelistedAddressMain;
	mapping(address => uint256) public contributedValue;

	event TokenPre(address indexed participant, address indexed beneficiary, uint256 value, uint256 tokens);
	event TokenMain(address indexed participant, address indexed beneficiary, uint256 value, uint256 tokens);
	event SetPre(uint256 startTimePre, uint256 endTimePre, uint256 minCapPre, uint256 maxCapPre, uint256 ratePre);
	event SetMain(uint256 startTimeMain, uint256 endTimeMain, uint256 minCapMain, uint256 maxCapMain, uint256 rateMain);
	event WhitelistPre(address indexed whitelistedAddress, bool whitelistedStatus);
	event WhitelistMain(address indexed whitelistedAddress, bool whitelistedStatus);

	/**
	* @dev all functions can only be called before event has ended
	*/
	modifier eventNotEnded() {
		require(eventEnded == false);
		_;
	}

	/**
	* @dev constructor to initiate values
	* @param _wallet address that will receive the contributed eth
	*/
	function LendingBlockTokenEvent(address _wallet) public {
		token = new LendingBlockToken(msg.sender);
		wallet = _wallet;
	}

	/**
	* @dev function to join the pre sale
	* associated with variables, functions, events of suffix Pre
	* @param beneficiary address that will receive the tokens
	*/
	function joinPre(address beneficiary)
		public
		payable
		eventNotEnded
	{
		require(now >= startTimePre);//after start time
		require(now <= endTimePre);//before end time
		require(msg.value >= minCapPre);//contribution is at least minimum
		require(whitelistedAddressPre[msg.sender] == true);//sender is whitelisted

		uint256 weiValue = msg.value;
		contributedValue[msg.sender] = contributedValue[msg.sender].add(weiValue);//store amount contributed
		require(contributedValue[msg.sender] <= maxCapPre);//total contribution not above maximum

		uint256 tokens = weiValue.mul(ratePre);//find amount of tokens
		weiTotal = weiTotal.add(weiValue);//store total collected eth

		token.transfer(beneficiary, tokens);//send token to beneficiary
		TokenPre(msg.sender, beneficiary, weiValue, tokens);//record contribution in logs

		forwardFunds();//send eth for safekeeping
	}

	/**
	* @dev function to join the main sale
	* associated with variables, functions, events of suffix Main
	* @param beneficiary address that will receive the tokens
	*/
	function joinMain(address beneficiary)
		public
		payable
		eventNotEnded
	{
		require(now >= startTimeMain);//after start time
		require(now <= endTimeMain);//before end time
		require(msg.value >= minCapMain);//contribution is at least minimum
		require(whitelistedAddressMain[msg.sender] == true);//sender is whitelisted

		uint256 weiValue = msg.value;
		contributedValue[msg.sender] = contributedValue[msg.sender].add(weiValue);//store amount contributed
		require(contributedValue[msg.sender] <= maxCapMain);//total contribution not above maximum

		uint256 tokens = weiValue.mul(rateMain);//find amount of tokens
		weiTotal = weiTotal.add(weiValue);//store total collected eth

		token.transfer(beneficiary, tokens);//send token to beneficiary
		TokenMain(msg.sender, beneficiary, weiValue, tokens);//record contribution in logs

		forwardFunds();//send eth for safekeeping
	}

	/**
	* @dev send eth for safekeeping
	*/
	function forwardFunds() internal {
		wallet.transfer(msg.value);
	}

	/**
	* @dev set the parameters for the contribution round
	* associated with variables, functions, events of suffix Pre
	* @param _startTimePre start time of contribution round
	* @param _endTimePre end time of contribution round
	* @param _minCapPre minimum contribution for this round
	* @param _maxCapPre maximum contribution for this round
	* @param _ratePre token exchange rate for this round
	*/
	function setPre(
		uint256 _startTimePre,
		uint256 _endTimePre,
		uint256 _minCapPre,
		uint256 _maxCapPre,
		uint256 _ratePre
	)
		external
		onlyOwner
		eventNotEnded
	{
		require(now < _startTimePre);//start time must be in the future
		require(_startTimePre < _endTimePre);//end time must be later than start time
		require(_minCapPre <= _maxCapPre);//minimum must be smaller or equal to maximum
		startTimePre = _startTimePre;
		endTimePre = _endTimePre;
		minCapPre = _minCapPre;
		maxCapPre = _maxCapPre;
		ratePre = _ratePre;
		SetPre(_startTimePre, _endTimePre, _minCapPre, _maxCapPre, _ratePre);
	}

	/**
	* @dev set the parameters for the contribution round
	* associated with variables, functions, events of suffix Main
	* @param _startTimeMain start time of contribution round
	* @param _endTimeMain end time of contribution round
	* @param _minCapMain minimum contribution for this round
	* @param _maxCapMain maximum contribution for this round
	* @param _rateMain token exchange rate for this round
	*/
	function setMain(
		uint256 _startTimeMain,
		uint256 _endTimeMain,
		uint256 _minCapMain,
		uint256 _maxCapMain,
		uint256 _rateMain
	)
		external
		onlyOwner
		eventNotEnded
	{
		require(now < _startTimeMain);//start time must be in the future
		require(_startTimeMain < _endTimeMain);//end time must be later than start time
		require(_minCapMain <= _maxCapMain);//minimum must be smaller or equal to maximum
		startTimeMain = _startTimeMain;
		endTimeMain = _endTimeMain;
		minCapMain = _minCapMain;
		maxCapMain = _maxCapMain;
		rateMain = _rateMain;
		SetMain(_startTimeMain, _endTimeMain, _minCapMain, _maxCapMain, _rateMain);
	}

	/**
	* @dev change the whitelist status of an address for pre sale
	* associated with variables, functions, events of suffix Pre
	* @param whitelistedAddress list of addresses for whitelist status change
	* @param whitelistedStatus set the address whitelist status to true or false
	*/
	function setWhitelistedAddressPre(address[] whitelistedAddress, bool whitelistedStatus)
		external
		onlyOwner
		eventNotEnded
	{
		for (uint256 i = 0; i < whitelistedAddress.length; i++) {
			whitelistedAddressPre[whitelistedAddress[i]] = whitelistedStatus;
			WhitelistPre(whitelistedAddress[i], whitelistedStatus);
		}
	}

	/**
	* @dev change the whitelist status of an address for main sale
	* associated with variables, functions, events of suffix Main
	* @param whitelistedAddress list of addresses for whitelist status change
	* @param whitelistedStatus set the address whitelist status to true or false
	*/
	function setWhitelistedAddressMain(address[] whitelistedAddress, bool whitelistedStatus)
		external
		onlyOwner
		eventNotEnded
	{
		for (uint256 i = 0; i < whitelistedAddress.length; i++) {
			whitelistedAddressMain[whitelistedAddress[i]] = whitelistedStatus;
			WhitelistMain(whitelistedAddress[i], whitelistedStatus);
		}
	}

	/**
	* @dev end the token generation event and deactivates all functions
	* can only be called after end time
	* burn all remaining tokens in this contract that are not exchanged
	*/
	function endEvent()
		external
		onlyOwner
		eventNotEnded
	{
		require(now > endTimeMain);//can only be called after end time
		require(endTimeMain > 0);//can only be called after end time has been set
		uint256 leftTokens = token.balanceOf(this);//find if any tokens are left
		if (leftTokens > 0) {
			token.burn(leftTokens);//burn all remaining tokens
		}
		eventEnded = true;//deactivates all functions
	}

	/**
	* @dev default function to call the right function for exchanging tokens
	* main sale should start only after pre sale
	*/
	function () external payable {
		if (now <= endTimePre) {//call pre function if before pre sale end time
			joinPre(msg.sender);
		} else if (now <= endTimeMain) {//call main function if before main sale end time
			joinMain(msg.sender);
		} else {
			require(false);
		}
	}

}
