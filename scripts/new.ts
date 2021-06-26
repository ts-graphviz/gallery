import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import _ from 'ts-dedent';
import { promisify } from 'util';
import { getConfig } from './lib/util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

async function main(name: string): Promise<void> {
  await mkdir(path.join(process.cwd(), 'gallery', name));
  const config = await getConfig(path.join(process.cwd(), 'gallery'));
  config.order.push(name);

  await Promise.all([
    await writeFile(path.join(process.cwd(), 'gallery', 'config.yaml'), yaml.dump(config)),
    await writeFile(
      path.join(process.cwd(), 'gallery', name, 'info.yaml'),
      _`
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
