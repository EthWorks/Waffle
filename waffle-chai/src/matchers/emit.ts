import {Contract, providers, utils} from 'ethers';
import {waitForPendingTransaction} from './misc/transaction';
import {BytesLike, Hexable} from '@ethersproject/bytes/src.ts/index';

export function supportEmit(Assertion: Chai.AssertionStatic) {
  const filterLogsWithTopics = (logs: providers.Log[], topic: any, contractAddress: string) =>
    logs.filter((log) => log.topics.includes(topic))
      .filter((log) => log.address && log.address.toLowerCase() === contractAddress.toLowerCase());

  Assertion.addMethod('emit', function (this: any, contract: Contract, eventName: string) {
    const tx = this._obj;
    const derivedPromise = waitForPendingTransaction(tx, contract.provider)
      .then((receipt: providers.TransactionReceipt) => {
        let eventFragment: utils.EventFragment | undefined;
        try {
          eventFragment = contract.interface.getEvent(eventName);
        } catch (e) {
        // ignore error
        }

        if (eventFragment === undefined) {
          const isNegated = this.__flags.negate === true;

          this.assert(
            isNegated,
            `Expected event "${eventName}" to be emitted, but it doesn't` +
          ' exist in the contract. Please make sure you\'ve compiled' +
          ' its latest version before running the test.',
            `WARNING: Expected event "${eventName}" NOT to be emitted.` +
          ' The event wasn\'t emitted because it doesn\'t' +
          ' exist in the contract. Please make sure you\'ve compiled' +
          ' its latest version before running the test.',
            eventName,
            ''
          );
          return;
        }

        const topic = contract.interface.getEventTopic(eventFragment);
        this.logs = filterLogsWithTopics(receipt.logs, topic, contract.address);
        this.assert(this.logs.length > 0,
          `Expected event "${eventName}" to be emitted, but it wasn't`,
          `Expected event "${eventName}" NOT to be emitted, but it was`
        );
      });
    this.then = derivedPromise.then.bind(derivedPromise);
    this.catch = derivedPromise.catch.bind(derivedPromise);
    this.promise = derivedPromise;
    this.contract = contract;
    this.eventName = eventName;
    return this;
  });

  const assertArgsArraysEqual = (context: any, expectedArgs: any[], log: any) => {
    const actualArgs = (context.contract.interface as utils.Interface).parseLog(log).args;
    context.assert(
      actualArgs.length === expectedArgs.length,
      `Expected "${context.eventName}" event to have ${expectedArgs.length} argument(s), ` +
      `but it has ${actualArgs.length}`,
      'Do not combine .not. with .withArgs()',
      expectedArgs.length,
      actualArgs.length
    );
    for (let index = 0; index < expectedArgs.length; index++) {
      if (expectedArgs[index].length !== undefined && typeof expectedArgs[index] !== 'string') {
        for (let j = 0; j < expectedArgs[index].length; j++) {
          new Assertion(actualArgs[index][j],
            `argument at index ${index} in the "${context.eventName}" event at position ${j} in the arg array`)
            .equal(expectedArgs[index][j]);
        }
      } else {
        if (actualArgs[index].hash !== undefined && actualArgs[index]._isIndexed === true) {
          const expectedArgBytes = utils.isHexString(expectedArgs[index])
            ? utils.arrayify(expectedArgs[index]) : utils.toUtf8Bytes(expectedArgs[index]);
          new Assertion(actualArgs[index].hash,
            `argument at index ${index} in the "${context.eventName}" event ` +
            `to be hash of or equal to "${expectedArgs[index]}"`)
            .to.be.oneOf([expectedArgs[index], utils.keccak256(expectedArgBytes)]);
        } else {
          new Assertion(actualArgs[index],
            `argument at index ${index} in the "${context.eventName}" event`)
            .equal(expectedArgs[index]);
        }
      }
    }
  };

  const tryAssertArgsArraysEqual = (context: any, expectedArgs: any[], logs: any[]) => {
    if (logs.length === 1) return assertArgsArraysEqual(context, expectedArgs, logs[0]);
    for (const index in logs) {
      try {
        assertArgsArraysEqual(context, expectedArgs, logs[index]);
        return;
      } catch {}
    }
    context.assert(false,
      `Specified args not emitted in any of ${context.logs.length} emitted "${context.eventName}" events`,
      'Do not combine .not. with .withArgs()'
    );
  };

  const assertArgsObjectEqual = (context: any, expectedArgs: Record<string, unknown>, log: any) => {
    const logDescription = (context.contract.interface as utils.Interface).parseLog(log);
    const actualArgs = (context.contract.interface as utils.Interface).parseLog(log).args;
    for (const [key, expectedValue] of Object.entries(expectedArgs)) {
      const paramIndex = logDescription.eventFragment.inputs.findIndex(input => input.name === key);
      new Assertion(paramIndex, `"${key}" argument in the "${context.eventName}" event not found`).gte(0);
      if (Array.isArray(expectedValue)) {
        for (let j = 0; j < expectedValue.length; j++) {
          new Assertion(
            actualArgs[paramIndex][j],
            `"${key}" value at index "${j}" on "${context.eventName}" event`)
            .equal(expectedValue[j]);
        }
      } else {
        if (actualArgs[paramIndex].hash !== undefined && actualArgs[paramIndex]._isIndexed) {
          const expectedArgBytes = utils.isHexString(expectedValue)
            ? utils.arrayify(expectedValue as BytesLike | Hexable | number)
            : utils.toUtf8Bytes(expectedValue as string);
          new Assertion(
            actualArgs[paramIndex].hash,
            `value of indexed "${key}" argument in the "${context.eventName}" event ` +
            `to be hash of or equal to "${expectedValue}"`
          ).to.be.oneOf([expectedValue, utils.keccak256(expectedArgBytes)]);
        } else {
          new Assertion(actualArgs[paramIndex],
            `value of "${key}" argument in the "${context.eventName}" event`)
            .equal(expectedValue);
        }
      }
    }
  };

  const tryAssertArgsObjectEqual = (context: any, expectedArgs: Record<string, unknown>, logs: any[]) => {
    if (logs.length === 1) return assertArgsObjectEqual(context, expectedArgs, logs[0]);
    for (const index in logs) {
      try {
        assertArgsObjectEqual(context, expectedArgs, logs[index]);
        return;
      } catch {}
    }
    context.assert(false,
      `Specified args not emitted in any of ${context.logs.length} emitted "${context.eventName}" events`,
      'Do not combine .not. with .withArgs()'
    );
  };

  Assertion.addMethod('withArgs', function (this: any, ...expectedArgs: any[]) {
    const derivedPromise = this.promise.then(() => {
      tryAssertArgsArraysEqual(this, expectedArgs, this.logs);
    });
    this.then = derivedPromise.then.bind(derivedPromise);
    this.catch = derivedPromise.catch.bind(derivedPromise);
    return this;
  });

  Assertion.addMethod('withNamedArgs', function (this: any, expectedArgs: Record<string, unknown>) {
    const derivedPromise = this.promise.then(() => {
      tryAssertArgsObjectEqual(this, expectedArgs, this.logs);
    });
    this.then = derivedPromise.then.bind(derivedPromise);
    this.catch = derivedPromise.catch.bind(derivedPromise);
    return this;
  });
}
