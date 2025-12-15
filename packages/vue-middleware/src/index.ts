import type { App, ObjectPlugin } from "vue";
import {
  type VueMiddlewareOptions as VueMiddlewareOptions,
  handler,
} from "./handler";

export type {
  VueMiddlewareOptions as Options,
  MiddlewareContext,
  Middleware,
  Middlewares,
} from "./handler";

export { Driver } from "./drivers/driver";
export * from "./drivers";
export * from "./composables";

declare module "vue" {
  interface ComponentCustomProperties {
    is: (value: string) => boolean;
    can: (value: string) => boolean;
  }
}

declare module "vue-router" {
  interface RouteMeta {
    middleware?: string[];
    excludeMiddleware?: string[];
    fallbackTo?: string;
  }
}

const plugin: ObjectPlugin<VueMiddlewareOptions> = {
  install(app: App, options: VueMiddlewareOptions) {
    // Check if Vue-Router is defined in App
    if (!options.router) {
      throw new Error(
        "The vue-router is required in order to work with vue-middleware."
      );
    }

    handler(app, options);
  },
};

export default plugin;
