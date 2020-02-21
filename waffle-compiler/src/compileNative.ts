import {resolve} from 'path';
import {execSync} from 'child_process';
import {NewConfig} from './config';
import {buildInputObject} from './buildUitls';
import {ImportFile} from '@resolver-engine/imports';

export function compileNative(config: NewConfig) {
  return async function compile(sources: ImportFile[]) {
    const command = createBuildCommand(config);
    const input = JSON.stringify(buildInputObject(sources, config.compilerOptions), null, 2);
    return JSON.parse(execSync(command, {input}).toString());
  };
}

export function createBuildCommand(config: NewConfig) {
  const command = 'solc';
  const params = '--standard-json';
  const customAllowedPaths = config.compilerAllowedPaths
    .map((path: string) => resolve(path));
  const allowedPaths = [
    resolve(config.inputDirectory),
    resolve(config.nodeModulesDirectory),
    ...customAllowedPaths
  ];
  return `${command} ${params} --allow-paths ${allowedPaths.join(',')}`;
}
