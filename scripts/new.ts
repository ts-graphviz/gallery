import path from 'path';
import fs from 'fs';
import globSync from 'glob';
import yaml from 'js-yaml';
import _ from 'ts-dedent';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const glob = promisify(globSync);

async function getOrder(infoFilePath: string): Promise<number> {
  const { order } = yaml.load(await readFile(infoFilePath, 'utf8')) as { order: number };
  return order;
}

async function getMax(dir: string) {
  const matches = await glob(`${dir}/**/info.yaml`);
  return Math.max(...(await Promise.all(matches.map(getOrder))));
}

async function main(name: string): Promise<void> {
  await mkdir(path.join(process.cwd(), 'gallery', name));
  const maxOrder = await getMax('gallery');
  await Promise.all([
    await writeFile(
      path.join(process.cwd(), 'gallery', name, 'info.yaml'),
      _`
      order: ${maxOrder + 1}
      title: ${name}
      description: |-
        Example...
      `,
    ),
    await writeFile(
      path.join(process.cwd(), 'gallery', name, 'script.ts'),
      _`
        import { toDot, digraph } from 'ts-graphviz';

        const G = digraph('G');

        export = toDot(G);

      `,
    ),
  ]);
}

if (!!process.argv[2]) {
  main(process.argv[2]);
} else {
  console.error('name is reqired');
}
