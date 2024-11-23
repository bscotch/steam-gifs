export class VidyaError extends Error {
  constructor(message: string, asserter?: Function) {
    super(message);
    this.name = "Vidya";
  }
}

export function assert(claim: any, message: string): asserts claim {
  if (!claim) {
    throw new VidyaError(message, assert);
  }
}
