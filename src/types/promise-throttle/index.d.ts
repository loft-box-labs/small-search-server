/// <reference types="node" />

declare module "promise-throttle" {
  class Throttler {
    constructor({ requestsPerSecond: number, promiseImplementation: any });

    add<T>(fn: () => Promise<T>): Promise<T>;
  }

  export default Throttler;
}
