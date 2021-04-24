Chai matchers
=============

A set of sweet chai matchers, makes your test easy to write and read. Before you can start using the matchers, you have to tell chai to use the solidity plugin:

.. code-block:: ts

  import chai from "chai";
  import { solidity } from "ethereum-waffle";

  chai.use(solidity);

Below is the list of available matchers:

Bignumbers
----------
Testing equality of big numbers:

.. code-block:: ts

  expect(await token.balanceOf(wallet.address)).to.equal(993);

Available matchers for BigNumbers are: `equal`, `eq`, `above`, `gt`, `gte`, `below`, `lt`, `lte`, `least`, `most`, `within`, `closeTo`.

.. code-block:: ts

  expect(BigNumber.from(100)).to.be.within(BigNumber.from(99), BigNumber.from(101));
  expect(BigNumber.from(100)).to.be.closeTo(BigNumber.from(101), 10);

Emitting events
---------------

Testing what events were emitted with what arguments:

.. code-block:: ts

  await expect(token.transfer(walletTo.address, 7))
    .to.emit(token, 'Transfer')
    .withArgs(wallet.address, walletTo.address, 7);

.. note::

  The matcher will match :code:`indexed` event parameters of type :code:`string` or :code:`bytes`
  even if the expected argument is not hashed using :code:`keccack256` first.

Testing with indexed bytes or string parameters. These two examples are equivalent

.. code-block:: ts

  await expect(contract.addAddress("street", "city"))
    .to.emit(contract, 'AddAddress')
    .withArgs("street", "city");

  const hashedStreet = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("street"));
  const hashedCity = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("city"));
  await expect(contract.addAddress(street, city))
    .to.emit(contract, 'AddAddress')
    .withArgs(hashedStreet, hashedCity);

Testing the argument names in the event.

.. code-block:: ts

  await expect(token.transfer(walletTo.address, 7))
    .to.emit(token, 'Transfer')
    .withNamedArgs({
      from: wallet.address,
      to: walletTo.address,
      amount: 7
    });


A subset of arguments in an event can be tested by only including the desired arguments:

.. code-block:: ts

  await expect(token.transfer(walletTo.address, "8000000000000000000"))
    .to.emit(token, 'Transfer')
    .withNamedArgs({
      amount: "8000000000000000000"
    });

Called on contract
------------------

Testing if function was called on the provided contract:

.. code-block:: ts

  await token.balanceOf(wallet.address)

  expect('balanceOf').to.be.calledOnContract(token);

Called on contract with arguments
---------------------------------

Testing if function with certain arguments was called on provided contract:

.. code-block:: ts

  await token.balanceOf(wallet.address)

  expect('balanceOf').to.be.calledOnContractWith(token, [wallet.address]);

Revert
------
Testing if transaction was reverted:

.. code-block:: ts

  await expect(token.transfer(walletTo.address, 1007)).to.be.reverted;


Revert with message
-------------------

Testing if transaction was reverted with certain message:

.. code-block:: ts

  await expect(token.transfer(walletTo.address, 1007))
    .to.be.revertedWith('Insufficient funds');

Change ether balance
--------------------
Testing whether the transaction changes the balance of the account:

.. code-block:: ts

  await expect(() => wallet.sendTransaction({to: walletTo.address, value: 200}))
    .to.changeEtherBalance(walletTo, 200);

  await expect(await wallet.sendTransaction({to: walletTo.address, value: 200}))
    .to.changeEtherBalance(walletTo, 200);

:code:`expect` for :code:`changeEtherBalance` gets one of the following parameters:

  - **transaction call** : () => Promise<`TransactionResponse <https://docs.ethers.io/v5/api/providers/types/#providers-TransactionResponse>`_>
  - **transaction response** : `TransactionResponse <https://docs.ethers.io/v5/api/providers/types/#providers-TransactionResponse>`_

.. note:: :code:`changeEtherBalance` won't work if there is more than one transaction mined in the block.

The transaction call should be passed to the :code:`expect` as a callback (we need to check the balance before the call) or as a transaction response.

The matcher can accept numbers, strings and BigNumbers as a balance change, while the account should be specified either as a Wallet or a Contract.

:code:`changeEtherBalance` ignores transaction fees by default:

.. code-block:: ts

  // Default behavior
  await expect(await wallet.sendTransaction({to: walletTo.address, value: 200}))
    .to.changeEtherBalance(wallet, -200);

  // To include the transaction fee use:
  await expect(await wallet.sendTransaction({to: walletTo.address, gasPrice: 1, value: 200}))
    .to.changeEtherBalance(wallet, -21200, {includeFee: true});

.. note:: :code:`changeEtherBalance` calls should not be chained. If you need to check changes of the balance for multiple accounts, you should use the :code:`changeEtherBalances` matcher.

Change ether balance (multiple accounts)
----------------------------------------
Testing whether the transaction changes balance of multiple accounts:

.. code-block:: ts

  await expect(() => wallet.sendTransaction({to: walletTo.address, value: 200}))
    .to.changeEtherBalances([wallet, walletTo], [-200, 200]);

  await expect(await wallet.sendTransaction({to: walletTo.address, value: 200}))
    .to.changeEtherBalances([wallet, walletTo], [-200, 200]);

.. note:: :code:`changeEtherBalances` calls won't work if there is more than one transaction mined in the block.

Change token balance
--------------------
Testing whether the transfer changes the balance of the account:

.. code-block:: ts

  await expect(() => token.transfer(walletTo.address, 200))
    .to.changeTokenBalance(token, walletTo, 200);

  await expect(() => token.transferFrom(wallet.address, walletTo.address, 200))
    .to.changeTokenBalance(token, walletTo, 200);

.. note:: The transfer call should be passed to the :code:`expect` as a callback (we need to check the balance before the call).

The matcher can accept numbers, strings and BigNumbers as a balance change, while the account should be specified either as a Wallet or a Contract.

.. note:: :code:`changeTokenBalance` calls should not be chained. If you need to check changes of the balance for multiple accounts, you should use the :code:`changeTokenBalances` matcher.

Change token balance (multiple accounts)
----------------------------------------

Testing whether the transfer changes balance for multiple accounts:

.. code-block:: ts

  await expect(() => token.transfer(walletTo.address, 200))
    .to.changeTokenBalances(token, [wallet, walletTo], [-200, 200]);

Proper address
------------------
Testing if a string is a proper address:

.. code-block:: ts

  expect('0x28FAA621c3348823D6c6548981a19716bcDc740e').to.be.properAddress;


Proper private key
------------------
Testing if a string is a proper private key:

.. code-block:: ts

  expect('0x706618637b8ca922f6290ce1ecd4c31247e9ab75cf0530a0ac95c0332173d7c5').to.be.properPrivateKey;

Proper hex
----------
Testing if a string is a proper hex value of given length:

.. code-block:: ts

  expect('0x70').to.be.properHex(2);

Hex Equal
----------
Testing if a string is a proper hex with value equal to the given hex value. Case insensitive and strips leading zeros:

.. code-block:: ts

  expect('0x00012AB').to.hexEqual('0x12ab');

Deprecated matchers
===================

Change balance
--------------
.. deprecated:: 3.1.2
   Use :func:`changeEtherBalance` instead.

Testing whether the transaction changes the balance of the account:

.. code-block:: ts

  await expect(() => wallet.sendTransaction({to: walletTo.address, gasPrice: 0, value: 200}))
    .to.changeBalance(walletTo, 200);

  await expect(await wallet.sendTransaction({to: walletTo.address, gasPrice: 0, value: 200}))
    .to.changeBalance(walletTo, 200);

:code:`expect` for :code:`changeBalance` gets one of the following parameters:

  - **transaction call** : () => Promise<`TransactionResponse <https://docs.ethers.io/v5/api/providers/types/#providers-TransactionResponse>`_>
  - **transaction response** : `TransactionResponse <https://docs.ethers.io/v5/api/providers/types/#providers-TransactionResponse>`_

.. note:: :code:`changeBalance` won't work if there is more than one transaction mined in the block.

The transaction call should be passed to the :code:`expect` as a callback (we need to check the balance before the call) or as a transaction response.

The matcher can accept numbers, strings and BigNumbers as a balance change, while the account should be specified either as a Wallet or a Contract.

.. note:: :code:`changeBalance` calls should not be chained. If you need to check changes of the balance for multiple accounts, you should use the :code:`changeBalances` matcher.

Change balance (multiple accounts)
----------------------------------
.. deprecated:: 3.1.2
   Use :func:`changeEtherBalances` instead.

Testing whether the transaction changes balance of multiple accounts:

.. code-block:: ts

  await expect(() => wallet.sendTransaction({to: walletTo.address, gasPrice: 0, value: 200}))
    .to.changeBalances([wallet, walletTo], [-200, 200]);

  await expect(await wallet.sendTransaction({to: walletTo.address, gasPrice: 0, value: 200}))
    .to.changeBalances([wallet, walletTo], [-200, 200]);

.. note:: :code:`changeBalances` calls won't work if there is more than one transaction mined in the block.
