import yaml from 'js-yaml';
import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
export interface Config {
  order: string[];
}

export async function getConfig(dir: string): Promise<Config> {
  return yaml.load(await readFile(`${dir}/config.yaml`, 'utf8')) as Config;
}
