let LendingBlockTokenEvent = artifacts.require('LendingBlockTokenEvent.sol');
let LendingBlockToken = artifacts.require('LendingBlockToken.sol');

let tokenEvent;
let token;

//account[0] is owner
//account[1] is wallet to collect funds

contract('LendingBlockTokenEvent', (accounts) => {
  it('should set the default parameters', () => {
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
      return token.name.call();
    }).then((result) => {
      assert.strictEqual(result, 'Lendingblock', 'name');
      return token.symbol.call();
    }).then((result) => {
      assert.strictEqual(result, 'LND', 'symbol');
      return token.decimals.call();
    }).then((result) => {
      assert.strictEqual(result.toNumber(), 18, 'decimals');
      return token.transferableTime.call();
    }).then((result) => {
      assert.strictEqual(result.toNumber(), 1546300800, 'transferableTime');
      return token.owner.call();
    }).then((result) => {
      assert.strictEqual(result, accounts[0], 'owner');
      return token.tokenEventAddress.call();
    }).then((result) => {
      assert.strictEqual(result, tokenEvent.address, 'tokenEventAddress');
      return token.totalSupply.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber('1e9').times('1e18').toString(), 'totalSupply');
      return token.balanceOf.call(accounts[0]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber('1e9').times('1e18').toString(), 'balanceOf owner');
      return token.balanceOf.call(tokenEvent.address);
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'balanceOf tokenEvent');
      return token.balanceOf.call(tokenEvent.address);
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'balanceOf of tokenEvent');
      return tokenEvent.owner.call();
    }).then((result) => {
      assert.strictEqual(result, accounts[0], 'owner');
      return tokenEvent.wallet.call();
    }).then((result) => {
      assert.strictEqual(result, accounts[1], 'wallet');
      return tokenEvent.eventEnded.call();
    }).then((result) => {
      assert.strictEqual(result, false, 'eventEnded');
      return tokenEvent.startTimePre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'startTimePre');
      return tokenEvent.startTimeMain.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'startTimeMain');
      return tokenEvent.endTimePre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'endTimePre');
      return tokenEvent.endTimeMain.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'endTimeMain');
      return tokenEvent.ratePre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'ratePre');
      return tokenEvent.rateMain.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'rateMain');
      return tokenEvent.minCapPre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'minCapPre');
      return tokenEvent.minCapMain.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'minCapMain');
      return tokenEvent.maxCapPre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'maxCapPre');
      return tokenEvent.maxCapMain.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'maxCapMain');
      return tokenEvent.weiTotal.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'weiTotal');
    });
  });
});
