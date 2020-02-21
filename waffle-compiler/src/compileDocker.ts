import {join} from 'path';
import {NewConfig} from './config';
import {execSync} from 'child_process';
import {buildInputObject} from './buildUitls';
import {ImportFile} from '@resolver-engine/imports';

const CONTAINER_PATH = '/home/project';
const NPM_PATH = '/home/npm';

export function compileDocker(config: NewConfig) {
  return async function compile(sources: ImportFile[]) {
    const command = createBuildCommand(config);
    const input = JSON.stringify(buildInputObject(sources, config.compilerOptions), null, 2);
    return JSON.parse(execSync(command, {input}).toString());
  };
}

export function createBuildCommand(config: NewConfig) {
  const configTag = config.compilerVersion;
  const tag = configTag ? `:${configTag}` : ':stable';
  const allowedPaths = `"${CONTAINER_PATH},${NPM_PATH}"`;
  return `docker run ${getVolumes(config)} -i -a stdin -a stdout ` +
    `ethereum/solc${tag} solc --standard-json --allow-paths ${allowedPaths}`;
}

export function getVolumes(config: NewConfig) {
  const hostPath = process.cwd();
  const hostNpmPath = join(hostPath, config.nodeModulesDirectory);
  return `-v ${hostPath}:${CONTAINER_PATH} -v ${hostNpmPath}:${NPM_PATH}`;
}
