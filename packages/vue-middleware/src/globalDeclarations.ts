export {};

declare global {
  interface Window {
    Laravel:
      | undefined
      | {
          permissions: string[];
          roles: string[];
        };
  }
}

export declare type Awaitable<T> = T | Promise<T>;

/**
 * Maybe a promise maybe not
 * @internal
 */
export declare type _Awaitable<T> = T | PromiseLike<T>;
