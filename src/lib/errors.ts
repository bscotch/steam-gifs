export class SteamGifsError extends Error {
  constructor(message: string, asserter?: Function) {
    super(message);
    this.name = "Vidya";
  }
}

export function assert(claim: any, message: string): asserts claim {
  if (!claim) {
    throw new SteamGifsError(message, assert);
  }
}
