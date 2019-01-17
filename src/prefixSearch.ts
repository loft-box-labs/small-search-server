interface INode {
  next: { [k: string]: INode | undefined };
  weight: number;
}

interface IResult {
  weight: number;
  word: string;
}

function scoreResult(result: IResult, query: string) {
  return result.weight + (result.word.length - query.length) * 3;
}

export class PrefixTree {
  private start: INode;

  constructor() {
    this.start = {
      next: {},
      weight: 0
    };
  }

  public add(token: string) {
    token = token.toLocaleLowerCase().replace(/[^a-z-]*/g, "");
    if (token.length === 0) {
      return;
    }

    let node = this.start;

    for (let i = 0; i < token.length; i++) {
      let nextNode = node.next[token[i]];
      if (nextNode === undefined) {
        nextNode = {
          next: {},
          weight: 0
        };
        node.next[token[i]] = nextNode;
      }
      node = nextNode;
    }

    node.weight++;
  }

  public autocomplete(query: string): IResult | undefined {
    let node = this.start;
    for (let i = 0; i < query.length; i++) {
      node = node.next[query[i]];
      if (!Boolean(node)) {
        return undefined;
      }
    }

    const recursiveSearch = (start: INode, wordSoFar: string): IResult => {
      let bestNode: IResult = {
        weight: start.weight,
        word: wordSoFar
      };

      Object.keys(start.next).map(key => {
        const found = recursiveSearch(start.next[key], wordSoFar + key);
        if (found && scoreResult(found, query) > scoreResult(bestNode, query)) {
          bestNode = found;
        }
      });

      return bestNode;
    };

    const found = recursiveSearch(node, query);
    return found;
  }
}
