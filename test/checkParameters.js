let LendingBlockTokenEvent = artifacts.require('LendingBlockTokenEvent.sol');
let LendingBlockToken = artifacts.require('LendingBlockToken.sol');

let tokenEvent;
let token;

//account[0] is owner
//account[1] is wallet to collect funds

contract('LendingBlockTokenEvent checkParameters', (accounts) => {
  it('should deploy the contract and send the initial tokens', () => {
    return LendingBlockTokenEvent.deployed().then((instance) => {
      tokenEvent = instance;
      let transferEvent = web3.eth.getTransactionReceipt(web3.eth.getBlock('latest').transactions[0]);
      assert.strictEqual(transferEvent.logs[0].topics[0], '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', 'transfer event');
      assert.strictEqual(transferEvent.logs[0].topics[1], '0x0000000000000000000000000000000000000000000000000000000000000000', 'transfer from null');
      assert.strictEqual(transferEvent.logs[0].topics[2], '0x000000000000000000000000' + accounts[0].slice(2, 42), 'transfer to owner');
      assert.strictEqual(web3.toBigNumber(transferEvent.logs[0].data).toString(), web3.toBigNumber('1e9').times('1e18').toString(), 'transfer amount');
      return tokenEvent.token.call();
    }).then((result) => {
      token = LendingBlockToken.at(result);
    });
  });
  it('token name should be Lendingblock', () => {
    return token.name.call().then((result) => {
      assert.strictEqual(result, 'Lendingblock', 'name');
    });
  });
  it('token symbol should be LND', () => {
    return token.symbol.call().then((result) => {
      assert.strictEqual(result, 'LND', 'symbol');
    });
  });
  it('token decimals should be 18', () => {
    return token.decimals.call().then((result) => {
      assert.strictEqual(result.toNumber(), 18, 'decimals');
    });
  });
  it('token transferableTime should be 1/1/19 (1546300800)', () => {
    return token.transferableTime.call().then((result) => {
      assert.strictEqual(result.toNumber(), 1546300800, 'transferableTime');
    });
  });
  it('token owner should be set', () => {
    return token.owner.call().then((result) => {
      assert.strictEqual(result, accounts[0], 'owner');
    });
  });
  it('token tokenEventAddress should be set', () => {
    return token.tokenEventAddress.call().then((result) => {
      assert.strictEqual(result, tokenEvent.address, 'tokenEventAddress');
    });
  });
  it('token totalSupply should be 1 billion', () => {
    return token.totalSupply.call().then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber('1e9').times('1e18').toString(), 'totalSupply');
    });
  });
  it('token of owner should be 1 billion', () => {
    return token.balanceOf.call(accounts[0]).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber('1e9').times('1e18').toString(), 'balanceOf owner');
    });
  });
  it('token of tokenEvent should be 0', () => {
    return token.balanceOf.call(tokenEvent.address).then((result) => {
      assert.strictEqual(result.toString(), '0', 'balanceOf tokenEvent');
    });
  });
  it('tokenEvent owner should be set', () => {
    return tokenEvent.owner.call().then((result) => {
      assert.strictEqual(result, accounts[0], 'owner');
    });
  });
  it('tokenEvent wallet should be set', () => {
    return tokenEvent.wallet.call().then((result) => {
      assert.strictEqual(result, accounts[1], 'wallet');
    });
  });
  it('tokenEvent eventEnded should be false', () => {
    return tokenEvent.eventEnded.call().then((result) => {
      assert.strictEqual(result, false, 'eventEnded');
    });
  });
  it('tokenEvent startTimePre should be not set', () => {
    return tokenEvent.startTimePre.call().then((result) => {
      assert.strictEqual(result.toString(), '0', 'startTimePre');
    });
  });
  it('tokenEvent startTimeMain should be not set', () => {
    return tokenEvent.startTimeMain.call().then((result) => {
      assert.strictEqual(result.toString(), '0', 'startTimeMain');
    });
  });
  it('tokenEvent endTimePre should be not set', () => {
    return tokenEvent.endTimePre.call().then((result) => {
      assert.strictEqual(result.toString(), '0', 'endTimePre');
    });
  });
  it('tokenEvent endTimeMain should be not set', () => {
    return tokenEvent.endTimeMain.call().then((result) => {
      assert.strictEqual(result.toString(), '0', 'endTimeMain');
    });
  });
  it('tokenEvent ratePre should be not set', () => {
    return tokenEvent.ratePre.call().then((result) => {
      assert.strictEqual(result.toString(), '0', 'ratePre');
    });
  });
  it('tokenEvent rateMain should be not set', () => {
    return tokenEvent.rateMain.call().then((result) => {
      assert.strictEqual(result.toString(), '0', 'rateMain');
    });
  });
  it('tokenEvent minCapMain should be not set', () => {
    return tokenEvent.minCapMain.call().then((result) => {
      assert.strictEqual(result.toString(), '0', 'minCapMain');
    });
  });
  it('tokenEvent maxCapPre should be not set', () => {
    return tokenEvent.maxCapPre.call().then((result) => {
      assert.strictEqual(result.toString(), '0', 'maxCapPre');
    });
  });
  it('tokenEvent maxCapMain should be not set', () => {
    return tokenEvent.maxCapMain.call().then((result) => {
      assert.strictEqual(result.toString(), '0', 'maxCapMain');
    });
  });
  it('tokenEvent weiTotal should be not set', () => {
    return tokenEvent.weiTotal.call().then((result) => {
      assert.strictEqual(result.toString(), '0', 'weiTotal');
    });
  });
});
