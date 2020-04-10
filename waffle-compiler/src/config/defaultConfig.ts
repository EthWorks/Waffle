import {Config} from './config';

export const defaultConfig: Config = {
  sourceDirectory: './contracts',
  compileOutputDirectory: './build',
  flattenOutputDirectory: './flatten',
  nodeModulesDirectory: './node_modules',
  compilerType: 'solcjs',
  compilerVersion: 'default',
  compilerAllowedPaths: [],
  compilerOptions: {},
  outputHumanReadableAbi: false,
  outputType: 'multiple'
};
