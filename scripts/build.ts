import yaml from 'js-yaml';
import _ from 'ts-dedent';
import { exportToBuffer } from '@ts-graphviz/node';
import { promisify } from 'util';
import path from 'path';
import { Script } from 'vm';
import globSync from 'glob';
import fs from 'fs';
import { optimize } from 'svgo';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const glob = promisify(globSync);
const script = new Script(`require(filename);`);

interface Info {
  title: string;
  description: string;
  order: number;
}

interface Result extends Info {
  code: string;
  lang: string;
  dot: string;
  filepath: string;
  pngPath: string;
}

async function runExample(filename: string): Promise<Result> {
  const dot = script.runInNewContext({ require, filename });
  const p = path.parse(filename);
  await writeFile(`${p.dir}/result.dot`, dot + '\n');
  const buffer = await exportToBuffer(dot, {
    format: 'svg',
  });
  await writeFile(`${p.dir}/result.svg`, optimize(buffer.toString('utf-8')).data);
  const code = (await readFile(filename, 'utf8')).replace('export = ', '').trimEnd();
  const {
    title = '',
    description = '',
    order = Infinity,
  } = yaml.load(await readFile(`${p.dir}/info.yaml`, 'utf8')) as Info;
  const lang = p.ext.slice(1);
  await writeFile(
    `${p.dir}/README.md`,
    _`# ${title}

      ${description}
      
      ## Code
      
      \`\`\`${lang}
      ${code}
      \`\`\`
      
      ## Result
      
      \`\`\`dot
      ${dot}
      \`\`\`
      
      ![result](./result.svg)

    `,
  );

  return {
    title,
    description,
    order,
    code,
    lang,
    dot,
    filepath: path.relative(process.cwd(), `${p.dir}/README.md`),
    pngPath: path.relative(process.cwd(), `${p.dir}/result.svg`),
  };
}

async function runScriptsAndGetResults(dir: string) {
  const matches = await glob(`${dir}/**/script.*`);
  return (await Promise.all(matches.map(runExample))).sort((a, b) => a.order - b.order);
}

async function main(dir: string): Promise<void> {
  const results = await runScriptsAndGetResults(path.resolve(process.cwd(), dir));

  await writeFile(
    'README.md',
    _`# Gallery

      ${results
        .map(
          ({ title, description, code, lang, pngPath, filepath }) => _`
            ## ${title}

            ${description}

            \`\`\`${lang}
            ${code}
            \`\`\`

            ![title](./${pngPath})

            [more...](${filepath})
            `,
        )
        .join('\n\n')}
      
      ## Contributing

      \`\`\`bash
      # Create new script
      $ yarn new <your-script-name>
      # Build Gallary
      $ yarn build
      \`\`\`

    `,
  );
}

main(process.argv[2]);
