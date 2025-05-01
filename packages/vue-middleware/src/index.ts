import type { App, Plugin } from "vue";
import type { Router } from "vue-router";
import { type Options, handler } from "./handler";

export type { Options, MiddlewareContext } from "./handler";

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

const plugin: Plugin<Options> = {
  install(app: App, options: Options) {
    // Check if Vue-Router is defined in App
    const router: Router = app.config.globalProperties.$router;
    if (!app.config.globalProperties.$router) {
      throw new Error(
        "The vue-router is required in order to work with vue-middleware."
      );
    }

    handler(app, router, options);
  },
};

export default plugin;
