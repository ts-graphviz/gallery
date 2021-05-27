import { toDot, digraph } from 'ts-graphviz';

const G = digraph('G');

export = toDot(G);