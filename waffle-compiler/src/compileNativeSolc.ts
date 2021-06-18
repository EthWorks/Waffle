import {resolve} from 'path';
import {Config} from './config';
import {getCompilerInput} from './compilerInput';
import {ImportFile} from '@resolver-engine/imports';
import {executeCommand} from './executeCommand';

export function compileNativeSolc(config: Config) {
  return async function compile(sources: ImportFile[]) {
    const command = createBuildCommand(config);
    const input = getCompilerInput(sources, config.compilerOptions, 'Solidity');
    const output = await executeCommand(command, input);
    return JSON.parse(output);
  };
}

export function createBuildCommand(config: Config) {
  const command = (config.compilerVersion === 'default') ? 'solc' : config.compilerVersion;
  const params = '--standard-json';
  const customAllowedPaths = config.compilerAllowedPaths
    .map((path: string) => resolve(path));
  const allowedPaths = [
    resolve(config.sourceDirectory),
    resolve(config.nodeModulesDirectory),
    ...customAllowedPaths
  ];
  return `${command} ${params} --allow-paths ${allowedPaths.join(',')}`;
}
