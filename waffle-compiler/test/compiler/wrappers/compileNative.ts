import {expect} from 'chai';
import {createBuildCommand} from '../../../src/compileNativeSolc';
import {Config} from '../../../src/config';

const sourceDirectory = './test/projects/custom/custom_contracts';
const nodeModulesDirectory = './test/projects/custom/custom_node_modules';
const compilerAllowedPaths: string[] = [];
const config = {
  sourceDirectory,
  nodeModulesDirectory,
  compilerAllowedPaths
} as Config;

describe('UNIT: compileNative', () => {
  it('buildCommand', async () => {
    const actualCommand = createBuildCommand(config);
    const expectedCommand = 'solc --standard-json --allow-paths ' +
      '.*test/projects/custom/custom_contracts,.*/test/projects/custom/custom_node_modules';
    expect(actualCommand).to.match(new RegExp(expectedCommand));
  });

  it('buildCommand with custom compiler', async () => {
    const actualCommand = createBuildCommand({
      ...config,
      compilerVersion: 'solc-0.8.0'
    });
    const expectedCommand = 'solc-0.8.0 --standard-json --allow-paths ' +
      '.*test/projects/custom/custom_contracts,.*/test/projects/custom/custom_node_modules';
    expect(actualCommand).to.match(new RegExp(expectedCommand));
  });

  it('buildCommand with custom allow_paths', async () => {
    const actualCommand = createBuildCommand({
      ...config,
      compilerAllowedPaths: ['some/random/path', './yet/another/path']
    });
    const expectedCommand = 'solc --standard-json --allow-paths ' +
      '.*test/projects/custom/custom_contracts,.*/test/projects/custom/custom_node_modules' +
      ',.*/some/random/path.*/yet/another/path';
    expect(actualCommand).to.match(new RegExp(expectedCommand));
  });
});
