let LendingBlockTokenEvent = artifacts.require('LendingBlockTokenEvent.sol');
let LendingBlockToken = artifacts.require('LendingBlockToken.sol');

let tokenEvent;
let token;
let initialWalletEth;

//account[0] is owner
//account[1] is wallet to collect funds
//account[2] to account[5] are pre round
//account[6] to account[9] are main round

contract('LendingBlockTokenEvent eventFlow with token burn', (accounts) => {
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
      return web3.eth.getBalance(accounts[1]);
    }).then((result) => {
      initialWalletEth = result.dividedBy('1e18').toString();
    });
  });
  it('tokenEvent should not allow fallback before event', () => {
    return tokenEvent.sendTransaction({
      from: accounts[2],
      value: web3.toBigNumber(1).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'fallback denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'fallback denied');
    });
  });
  it('tokenEvent should not allow joinPre before event', () => {
    return tokenEvent.joinPre({
      from: accounts[2],
      value: web3.toBigNumber(1).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'joinPre denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'joinPre denied');
    });
  });
  it('tokenEvent should not allow joinMain before event', () => {
    return tokenEvent.joinMain({
      from: accounts[6],
      value: web3.toBigNumber(1).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'joinMain denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'joinMain denied');
    });
  });
  it('tokenEvent should allow only owner to setWhitelistedAddressPre, setPre to prepare for pre round 1', () => {
    return tokenEvent.setWhitelistedAddressPre([accounts[2], accounts[3]], true, {
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'setWhitelistedAddressPre allowed');
      return tokenEvent.setPre(
        1522940400,
        1523113200,
        web3.toBigNumber(1).times('1e18'),
        web3.toBigNumber(50).times('1e18'),
        30000, {
          from: accounts[0]
        });
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'setPre allowed');
      return tokenEvent.startTimePre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '1522940400', 'startTimePre');
      return tokenEvent.endTimePre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '1523113200', 'endTimePre');
      return tokenEvent.minCapPre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(1).times('1e18').toString(), 'minCapPre');
      return tokenEvent.maxCapPre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(50).times('1e18').toString(), 'maxCapPre');
      return tokenEvent.ratePre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '30000', 'ratePre');
    });
  });
  it('token should allow only owner to transfer to prepare for pre round 1', () => {
    return token.transfer(tokenEvent.address, web3.toBigNumber('2100000').times('1e18'), {
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'transfer allowed');
      return token.balanceOf.call(tokenEvent.address);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber('2100000').times('1e18').toString(), 'transfer success');
    });
  });
  it('tokenEvent should not allow fallback before event', () => {
    return tokenEvent.sendTransaction({
      from: accounts[2],
      value: web3.toBigNumber(1).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'fallback denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'fallback denied');
    });
  });
  it('tokenEvent should not allow joinPre if not now >= startTimePre', () => {
    return tokenEvent.joinPre({
      from: accounts[2],
      value: web3.toBigNumber(1).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'now >= startTimePre');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'now >= startTimePre');
    });
  });
  it('tokenEvent should not allow joinMain before event', () => {
    return tokenEvent.joinMain({
      from: accounts[6],
      value: web3.toBigNumber(1).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'joinMain denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'joinMain denied');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [parseInt(100 + 1522940400 - web3.eth.getBlock('latest').timestamp)],
        id: 1
      });
    });
  });
  it('tokenEvent should not allow joinPre if not msg.value >= minCapPre', () => {
    return tokenEvent.joinPre({
      from: accounts[2],
      value: web3.toBigNumber(0.5).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'msg.value >= minCapPre');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'msg.value >= minCapPre');
    });
  });
  it('tokenEvent should not allow joinPre if not whitelistedAddressPre[msg.sender] == true', () => {
    return tokenEvent.joinPre({
      from: accounts[4],
      value: web3.toBigNumber(1).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'whitelistedAddressPre[msg.sender] == true');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'whitelistedAddressPre[msg.sender] == true');
    });
  });
  it('tokenEvent should not allow joinPre if not contributedValue[msg.sender] <= maxCapPre', () => {
    return tokenEvent.joinPre({
      from: accounts[2],
      value: web3.toBigNumber(50.01).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'contributedValue[msg.sender] <= maxCapPre');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'contributedValue[msg.sender] <= maxCapPre');
    });
  });
  it('tokenEvent should allow joinPre', () => {
    return tokenEvent.joinPre({
      from: accounts[2],
      value: web3.toBigNumber(1).times('1e18')
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'joinPre allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenPre log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenPre event');
      assert.strictEqual(result.logs[0].event, 'TokenPre', 'TokenPre event');
      assert.strictEqual(result.logs[0].args.participant, accounts[2], 'TokenPre event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(1).times('1e18').toString(), 'TokenPre event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(30000).times('1e18').toString(), 'TokenPre event');
    });
  });
  it('tokenEvent should not allow joinPre if not contributedValue[msg.sender] <= maxCapPre', () => {
    return tokenEvent.joinPre({
      from: accounts[2],
      value: web3.toBigNumber(49.5).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'contributedValue[msg.sender] <= maxCapPre');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'contributedValue[msg.sender] <= maxCapPre');
    });
  });
  it('tokenEvent should allow fallback', () => {
    return tokenEvent.sendTransaction({
      from: accounts[2],
      value: web3.toBigNumber(49).times('1e18')
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'fallback allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenPre log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenPre event');
      assert.strictEqual(result.logs[0].event, 'TokenPre', 'TokenPre event');
      assert.strictEqual(result.logs[0].args.participant, accounts[2], 'TokenPre event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(49).times('1e18').toString(), 'TokenPre event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(49).times(30000).times('1e18').toString(), 'TokenPre event');
      return token.balanceOf.call(accounts[2]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(50).times(30000).times('1e18').toString(), 'joinPre success');
    });
  });
  it('tokenEvent participants should receive their tokens', () => {
    return tokenEvent.sendTransaction({
      from: accounts[3],
      value: web3.toBigNumber(20).times('1e18')
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'joinPre with fallback allowed');
      return token.balanceOf.call(accounts[3]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(20).times(30000).times('1e18').toString(), 'joinPre success');
    });
  });
  it('tokenEvent should not allow fallback when out of tokens', () => {
    return tokenEvent.sendTransaction({
      from: accounts[3],
      value: web3.toBigNumber(2).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'joinPre out of tokens');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'joinPre out of tokens');
      return token.balanceOf.call(tokenEvent.address);
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'joinPre out of tokens');
    });
  });
  it('tokenEvent should allow only owner to setWhitelistedAddressPre, setPre to prepare for pre round 2', () => {
    return tokenEvent.setPre(
      1523199600,
      1523286000,
      web3.toBigNumber(1).times('1e18'),
      web3.toBigNumber(50).times('1e18'),
      25000, {
        from: accounts[0]
      }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'setPre round 2 allowed');
      return tokenEvent.setWhitelistedAddressPre([accounts[4], accounts[5]], true, {
        from: accounts[0]
      });
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'setWhitelistedAddressPre allowed');
    });
  });
  it('token should allow only owner to transfer to prepare for pre round 2', () => {
    return token.transfer(tokenEvent.address, web3.toBigNumber('60000').times('1e18'), {
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'transfer allowed');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [parseInt(100 + 1523199600 - web3.eth.getBlock('latest').timestamp)],
        id: 1
      });
    });
  });
  it('tokenEvent should not allow fallback if not contributedValue[msg.sender] <= maxCapPre including previous rounds', () => {
    return tokenEvent.sendTransaction({
      from: accounts[2],
      value: web3.toBigNumber(1).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'contributedValue[msg.sender] <= maxCapPre');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'contributedValue[msg.sender] <= maxCapPre');
    });
  });
  it('tokenEvent should allow fallback for pre round 2', () => {
    return tokenEvent.sendTransaction({
      from: accounts[4],
      value: web3.toBigNumber(2).times('1e18')
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'joinPre with fallback round 2 allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenPre log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenPre event');
      assert.strictEqual(result.logs[0].event, 'TokenPre', 'TokenPre event');
      assert.strictEqual(result.logs[0].args.participant, accounts[4], 'TokenPre event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(2).times('1e18').toString(), 'TokenPre event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(2).times(25000).times('1e18').toString(), 'TokenPre event');
      return token.balanceOf.call(accounts[4]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(2).times(25000).times('1e18').toString(), 'joinPre round 2 success');
    });
  });
  it('tokenEvent should route funds to wallet', () => {
    let currentBalance = web3.eth.getBalance(accounts[1]);
    assert.strictEqual(currentBalance.toString(), web3.toBigNumber(initialWalletEth).plus(72).times('1e18').toString(), 'wallet funds');
    initialWalletEth = currentBalance.dividedBy('1e18').toString();
  });
  it('tokenEvent should record weiTotal', () => {
    return tokenEvent.weiTotal.call().then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(72).times('1e18').toString(), 'wallet funds');
    });
  });
  it('tokenEvent should allow only owner to setWhitelistedAddressMain, setMain to prepare for main round 1', () => {
    return tokenEvent.setWhitelistedAddressMain([accounts[6], accounts[7], accounts[8], accounts[9]], true, {
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'setWhitelistedAddressMain allowed');
      return tokenEvent.setMain(
        1524495600,
        1524582000,
        web3.toBigNumber(0.1).times('1e18'),
        web3.toBigNumber(5).times('1e18'),
        20000, {
          from: accounts[0]
        });
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'setMain allowed');
    });
  });
  it('token should allow only owner to transfer to prepare for main round 1', () => {
    return token.transfer(tokenEvent.address, web3.toBigNumber('1000000').times('1e18'), {
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'transfer allowed');
    });
  });
  it('tokenEvent should not allow joinMain before event', () => {
    return tokenEvent.joinMain({
      from: accounts[6],
      value: web3.toBigNumber(1).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'joinMain denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'joinMain denied');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [parseInt(100 + 1524495600 - web3.eth.getBlock('latest').timestamp)],
        id: 1
      });
    });
  });
  it('tokenEvent should not allow joinMain if not msg.value >= minCapMain', () => {
    return tokenEvent.joinMain({
      from: accounts[6],
      value: web3.toBigNumber(0.05).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'msg.value >= minCapMain');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'msg.value >= minCapMain');
    });
  });
  it('tokenEvent should not allow joinMain if not whitelistedAddressMain[msg.sender] == true', () => {
    return tokenEvent.joinMain({
      from: accounts[4],
      value: web3.toBigNumber(0.3).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'whitelistedAddressMain[msg.sender] == true');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'whitelistedAddressMain[msg.sender] == true');
    });
  });
  it('tokenEvent should not allow joinMain if not contributedValue[msg.sender] <= maxCapMain', () => {
    return tokenEvent.joinMain({
      from: accounts[6],
      value: web3.toBigNumber(5.01).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'contributedValue[msg.sender] <= maxCapMain');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'contributedValue[msg.sender] <= maxCapMain');
    });
  });
  it('tokenEvent should allow joinMain for main round 1', () => {
    return tokenEvent.joinMain({
      from: accounts[6],
      value: web3.toBigNumber(0.3).times('1e18')
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'joinMain allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenMain log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenMain event');
      assert.strictEqual(result.logs[0].event, 'TokenMain', 'TokenMain event');
      assert.strictEqual(result.logs[0].args.participant, accounts[6], 'TokenMain event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(0.3).times('1e18').toString(), 'TokenMain event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(0.3).times(20000).times('1e18').toString(), 'TokenMain event');
    });
  });
  it('tokenEvent should not allow joinMain if not contributedValue[msg.sender] <= maxCapMain', () => {
    return tokenEvent.joinMain({
      from: accounts[6],
      value: web3.toBigNumber(4.71).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'contributedValue[msg.sender] <= maxCapMain');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'contributedValue[msg.sender] <= maxCapMain');
    });
  });
  it('tokenEvent should allow fallback for main round 1', () => {
    return tokenEvent.sendTransaction({
      from: accounts[6],
      value: web3.toBigNumber(0.7).times('1e18')
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'fallback allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenMain log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenMain event');
      assert.strictEqual(result.logs[0].event, 'TokenMain', 'TokenMain event');
      assert.strictEqual(result.logs[0].args.participant, accounts[6], 'TokenMain event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(0.7).times('1e18').toString(), 'TokenMain event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(0.7).times(20000).times('1e18').toString(), 'TokenMain event');
    });
  });
  it('tokenEvent participants should receive their tokens', () => {
    return tokenEvent.joinMain({
      from: accounts[7],
      value: web3.toBigNumber(5).times('1e18')
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'joinMain allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenMain log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenMain event');
      assert.strictEqual(result.logs[0].event, 'TokenMain', 'TokenMain event');
      assert.strictEqual(result.logs[0].args.participant, accounts[7], 'TokenMain event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(5).times('1e18').toString(), 'TokenMain event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(5).times(20000).times('1e18').toString(), 'TokenMain event');
      return token.balanceOf.call(accounts[6]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(1).times(20000).times('1e18').toString(), 'joinMain success');
      return token.balanceOf.call(accounts[7]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(5).times(20000).times('1e18').toString(), 'joinMain success');
      return tokenEvent.sendTransaction({
        from: accounts[8],
        value: web3.toBigNumber(3).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'joinMain with fallback allowed');
      return token.balanceOf.call(accounts[8]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(3).times(20000).times('1e18').toString(), 'joinMain success');
    });
  });
  it('tokenEvent should allow only owner to setMain to prepare for main round 2', () => {
    return tokenEvent.setMain(
      1524582000,
      1524668400,
      web3.toBigNumber(0.1).times('1e18'),
      web3.toBigNumber(20).times('1e18'),
      20000, {
        from: accounts[0]
      }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'setMain round 2 allowed');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [parseInt(100 + 1524582000 - web3.eth.getBlock('latest').timestamp)],
        id: 1
      });
    });
  });
  it('tokenEvent should not allow fallback if not contributedValue[msg.sender] <= maxCapMain', () => {
    return tokenEvent.sendTransaction({
      from: accounts[6],
      value: web3.toBigNumber(20).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'contributedValue[msg.sender] <= maxCapMain');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'contributedValue[msg.sender] <= maxCapMain');
    });
  });
  it('tokenEvent should not allow fallback if not contributedValue[msg.sender] <= maxCapMain including pre rounds', () => {
    return tokenEvent.setWhitelistedAddressMain([accounts[3]], true, {
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'setWhitelistedAddressMain allowed');
      return tokenEvent.sendTransaction({
        from: accounts[3],
        value: web3.toBigNumber(1).times('1e18')
      });
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'contributedValue[msg.sender] <= maxCapMain');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'contributedValue[msg.sender] <= maxCapMain');
    });
  });
  it('tokenEvent should allow fallback for main round 2', () => {
    return tokenEvent.sendTransaction({
      from: accounts[6],
      value: web3.toBigNumber(19).times('1e18')
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'joinMain with fallback round 2 allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenMain log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenMain event');
      assert.strictEqual(result.logs[0].event, 'TokenMain', 'TokenMain event');
      assert.strictEqual(result.logs[0].args.participant, accounts[6], 'TokenMain event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(19).times('1e18').toString(), 'TokenMain event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(19).times(20000).times('1e18').toString(), 'TokenMain event');
      return tokenEvent.sendTransaction({
        from: accounts[7],
        value: web3.toBigNumber(15).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'joinMain with fallback round 2 allowed');
      return tokenEvent.sendTransaction({
        from: accounts[8],
        value: web3.toBigNumber(2).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'joinMain with fallback round 2 allowed');
    });
  });
  it('tokenEvent participants should receive their tokens', () => {
    return token.balanceOf.call(accounts[6]).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(20).times(20000).times('1e18').toString(), 'joinMain round 2 success');
      return token.balanceOf.call(accounts[7]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(20).times(20000).times('1e18').toString(), 'joinMain round 2 success');
      return token.balanceOf.call(accounts[8]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(5).times(20000).times('1e18').toString(), 'joinMain round 2 success');
    });
  });
  it('tokenEvent should have leftover tokens', () => {
    return token.balanceOf.call(tokenEvent.address).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(110000).times('1e18').toString(), 'joinMain round 2 leftover');
    });
  });
  it('tokenEvent should route funds to wallet', () => {
    let currentBalance = web3.eth.getBalance(accounts[1]);
    assert.strictEqual(currentBalance.toString(), web3.toBigNumber(initialWalletEth).plus(45).times('1e18').toString(), 'wallet funds');
    initialWalletEth = currentBalance.dividedBy('1e18').toString();
  });
  it('tokenEvent should not allow endEvent if not now > endTimeMain', () => {
    return tokenEvent.endEvent({
      from: accounts[0]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'now > endTimeMain');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'now > endTimeMain');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [parseInt(100 + 1524668400 - web3.eth.getBlock('latest').timestamp)],
        id: 1
      });
    });
  });
  it('tokenEvent should not allow fallback after endTimeMain', () => {
    return tokenEvent.sendTransaction({
      from: accounts[8],
      value: web3.toBigNumber(1).times('1e18')
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'fallback denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'fallback denied');
    });
  });
  it('tokenEvent should not allow non owner to endEvent', () => {
    return tokenEvent.endEvent({
      from: accounts[1]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'endEvent denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'endEvent denied');
    });
  });
  it('tokenEvent should allow only owner to endEvent', () => {
    return tokenEvent.endEvent({
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'endEvent allowed');
      return tokenEvent.eventEnded.call();
    }).then((result) => {
      assert.strictEqual(result, true, 'eventEnded');
    });
  });
  it('tokenEvent should burn leftover tokens', () => {
    return token.balanceOf.call(tokenEvent.address).then((result) => {
      assert.strictEqual(result.toString(), '0', 'leftover burn');
      return token.totalSupply.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber('1e9').minus(110000).times('1e18').toString(), 'leftover burn success');
    });
  });
  it('tokenEvent should not allow setPre after eventEnded', () => {
    return tokenEvent.setPre(
      1527260400,
      1527346800,
      web3.toBigNumber(10).times('1e18'),
      web3.toBigNumber(100).times('1e18'),
      30000, {
        from: accounts[0]
      }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'setPre denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'setPre denied');
    });
  });
  it('tokenEvent should not allow setMain after eventEnded', () => {
    return tokenEvent.setMain(
      1527433200,
      1527519600,
      web3.toBigNumber(0.1).times('1e18'),
      web3.toBigNumber(10).times('1e18'),
      30000, {
        from: accounts[0]
      }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'setMain denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'setMain denied');
    });
  });
  it('tokenEvent should not allow setWhitelistedAddressPre after eventEnded', () => {
    return tokenEvent.setWhitelistedAddressPre([accounts[2]], true, {
      from: accounts[0]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'setWhitelistedAddressPre denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'setWhitelistedAddressPre denied');
    });
  });
  it('tokenEvent should not allow setWhitelistedAddressMain after eventEnded', () => {
    return tokenEvent.setWhitelistedAddressMain([accounts[6]], true, {
      from: accounts[0]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'setWhitelistedAddressMain denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'setWhitelistedAddressMain denied');
    });
  });
  it('tokenEvent should not allow endEvent after eventEnded', () => {
    return tokenEvent.endEvent({
      from: accounts[0]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'endEvent denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'endEvent denied');
    });
  });
});

contract('LendingBlockTokenEvent eventFlow with no token burn', (accounts) => {
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
      return web3.eth.getBalance(accounts[1]);
    }).then((result) => {
      initialWalletEth = result.dividedBy('1e18').toString();
    });
  });
  it('tokenEvent should allow only owner to setWhitelistedAddressPre, setPre to prepare for pre round 1', () => {
    return tokenEvent.setWhitelistedAddressPre([accounts[2], accounts[3]], true, {
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'setWhitelistedAddressPre allowed');
      return tokenEvent.setPre(
        1527260400,
        1527346800,
        web3.toBigNumber(1).times('1e18'),
        web3.toBigNumber(50).times('1e18'),
        30000, {
          from: accounts[0]
        });
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'setPre allowed');
    });
  });
  it('token should allow only owner to transfer to prepare for pre round 1', () => {
    return token.transfer(tokenEvent.address, web3.toBigNumber('1500000').times('1e18'), {
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'transfer allowed');
      return token.balanceOf.call(tokenEvent.address);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber('1500000').times('1e18').toString(), 'transfer success');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [parseInt(100 + 1527260400 - web3.eth.getBlock('latest').timestamp)],
        id: 1
      });
    });
  });
  it('tokenEvent should allow fallback', () => {
    return tokenEvent.sendTransaction({
      from: accounts[2],
      value: web3.toBigNumber(50).times('1e18')
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'fallback allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenPre log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenPre event');
      assert.strictEqual(result.logs[0].event, 'TokenPre', 'TokenPre event');
      assert.strictEqual(result.logs[0].args.participant, accounts[2], 'TokenPre event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(50).times('1e18').toString(), 'TokenPre event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(50).times(30000).times('1e18').toString(), 'TokenPre event');
    });
  });
  it('tokenEvent should allow only owner to setWhitelistedAddressMain, setMain to prepare for main round 1', () => {
    return tokenEvent.setWhitelistedAddressMain([accounts[6], accounts[7], accounts[8], accounts[9]], true, {
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'setWhitelistedAddressMain allowed');
      return tokenEvent.setMain(
        1527433200,
        1527519600,
        web3.toBigNumber(0.1).times('1e18'),
        web3.toBigNumber(5).times('1e18'),
        20000, {
          from: accounts[0]
        });
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'setMain allowed');
    });
  });
  it('token should allow only owner to transfer to prepare for main round 1', () => {
    return token.transfer(tokenEvent.address, web3.toBigNumber('20000').times('1e18'), {
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'transfer allowed');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [parseInt(100 + 1527433200 - web3.eth.getBlock('latest').timestamp)],
        id: 1
      });
    });
  });
  it('tokenEvent should allow fallback', () => {
    return tokenEvent.sendTransaction({
      from: accounts[6],
      value: web3.toBigNumber(1).times('1e18')
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'fallback allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenMain log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenMain event');
      assert.strictEqual(result.logs[0].event, 'TokenMain', 'TokenMain event');
      assert.strictEqual(result.logs[0].args.participant, accounts[6], 'TokenMain event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(1).times('1e18').toString(), 'TokenMain event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(1).times(20000).times('1e18').toString(), 'TokenMain event');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [parseInt(100 + 1527519600 - web3.eth.getBlock('latest').timestamp)],
        id: 1
      });
    });
  });
  it('tokenEvent should not have leftover tokens', () => {
    return token.balanceOf.call(tokenEvent.address).then((result) => {
      assert.strictEqual(result.toString(), '0', 'no leftover burn');
    });
  });
  it('tokenEvent should allow only owner to endEvent', () => {
    return tokenEvent.endEvent({
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(web3.toBigNumber(result.receipt.status).toString(), '1', 'endEvent allowed');
      return tokenEvent.eventEnded.call();
    }).then((result) => {
      assert.strictEqual(result, true, 'eventEnded');
    });
  });
  it('tokenEvent should not burn tokens', () => {
    return token.balanceOf.call(tokenEvent.address).then((result) => {
      assert.strictEqual(result.toString(), '0', 'leftover burn');
      return token.totalSupply.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber('1e9').times('1e18').toString(), 'leftover burn success');
    });
  });
  it('tokenEvent should route funds to wallet', () => {
    let currentBalance = web3.eth.getBalance(accounts[1]);
    assert.strictEqual(currentBalance.toString(), web3.toBigNumber(initialWalletEth).plus(51).times('1e18').toString(), 'wallet funds');
    initialWalletEth = currentBalance.dividedBy('1e18').toString();
  });
  it('tokenEvent should record weiTotal', () => {
    return tokenEvent.weiTotal.call().then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(51).times('1e18').toString(), 'wallet funds');
    });
  });
});

function txFailed(error) {
  if ('receipt' in error && 'status' in error.receipt && error.receipt.status === '0x00') {
    return true;
  } else if ('message' in error && error.message.includes('VM Exception while processing transaction')) {
    return true;
  }
  return false;
}
