import type { App } from "vue";
import type {
  Router,
  RouteLocationNormalized,
  RouteMeta,
  RouteLocationNormalizedLoaded,
  NavigationGuardReturn,
  NavigationGuardWithThis,
} from "vue-router";
import { Driver } from "./drivers/driver";
export interface MiddlewareContext {
  app: App;
  router: Router;
  from: RouteLocationNormalized;
  to: RouteLocationNormalized;
  guard?: string;
}

/**
 * Registered Middleware List
 */
export interface Middlewares {
  [key: string]: Middleware;
}

/**
 * Registered Middleware
 */
export interface Middleware {
  (ctx: MiddlewareContext): NavigationGuardReturn;
}

/**
 *  Middleware Name
 *
 * Consists of at least one part with an optional second part divided by a ":"
 *
 * E.g. "home:guest" or "home"
 */
type MiddlewareName = [string, string?];

/**
 *  Vue Middleware Plugin Options
 */
export interface Options {
  /**
   * Router used by the Plugin
   */
  router: Router;
  /**
   * Registered Middlewares that can be used by Routes
   */
  middleware: Middlewares;
  pageTitle?:
    | {
        template: (name: string, meta: RouteMeta) => string;
      }
    | boolean;
  permissions?: {
    driver: new (app: App) => Driver;
  };
  hooks?: {
    onBeforeEach?: (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized
    ) => void;
    onAfterEach?: (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized
    ) => void;
  };
}

/**
 * Main Vue Plugin handle
 *
 * @param app Vue App instance
 * @param options Optional plugin Settings
 */
export function handler(app: App, options: Options) {
  //const { pageTitle, middleware, permissions, hooks } = options;
  let permissionsDriver: Driver | undefined;
  if (options.permissions?.driver) {
    permissionsDriver = new options.permissions.driver(app);
    if (!(permissionsDriver instanceof Driver)) {
      throw new Error(
        "The driver is not compatible with our base driver are you sure your're extending the base driver."
      );
    }
    permissionsDriver._lookup();
  }

  /**
   * Middleware Navigation Guard
   */
  let middlewareGuard: NavigationGuardWithThis<undefined> = (
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded
  ): NavigationGuardReturn => {
    // Execute registered Pre-Hooks
    if (options.hooks?.onBeforeEach) {
      options.hooks.onBeforeEach(to, from);
    }

    //const { name, matched, meta } = to;

    // Add a title and id to the current page
    if (options.pageTitle && to.name) {
      if (typeof options.pageTitle === "object") {
        document.title = options.pageTitle.template(String(to.name), to.meta);
      }
      document.title = createTitle(String(to.name));
    }

    // Handle the role and permissions with Driver if one is configured
    if (permissionsDriver) {
      const fallbackTo = to.meta.fallbackTo || "";
      if (permissionsDriver._hasntRole(to.meta)) {
        return {
          path: fallbackTo,
        };
      } else if (permissionsDriver._hasntPermissions(to.meta)) {
        return {
          path: fallbackTo,
        };
      }
    }

    // const redirect = (to: RouteLocationRaw) => {
    //   router.push(to);
    // };

    const router: Router = options.router;
    const ctx: MiddlewareContext = {
      app,
      router,
      from,
      to,
    };

    // Well, looks like we don't have any middleware to run, so we can call
    // next now, otherwise we will ensure that each middleware doesn't return
    // failure by returning explicit `false` or `ABORT_KEY`..
    const middlewaresToRun: string[] = getMiddlewares(
      to.matched.map((match) => match.meta)
    );

    // No middlewares defined on route
    if (!middlewaresToRun.length) {
      return true;
    }

    const result: NavigationGuardReturn[] = middlewaresToRun.map(
      (middlewareName) => {
        return runMiddleware(options.middleware, middlewareName, ctx);
      }
    );

    if (result.some((value: NavigationGuardReturn) => value === false)) {
      return false;
    }

    // If result is a RouteLocation => redirect to first one
    if (result.some((v: NavigationGuardReturn) => typeof v === "object")) {
      return result[0];
    }
  };

  // Add middleware Navigation Guard to Router instance
  options.router.beforeEach(middlewareGuard);

  // Execute registered Post-Hooks
  options.router.afterEach((to, from) => {
    if (options.hooks?.onAfterEach) {
      options.hooks.onAfterEach(to, from);
    }
  });
}

/**
 * Create a title from a given name
 */
function createTitle(name: string) {
  return (name.charAt(0).toUpperCase() + name.slice(1)).replace(/_|-/gi, " - ");
}

//({ctx: MiddlewareContext, guard: string}) => void

/**
 * Let's run the middleware and give the
 * middleware a bunch of parameters to play around with.
 *
 * @param middlewares to be run
 * @param name of the Middleware
 * @param ctx
 * @returns a {@link NavigationGuardReturn | Navigation Guard Result} of the executed Middleware
 */
function runMiddleware(
  middlewares: Middlewares,
  name: string,
  ctx: MiddlewareContext
): NavigationGuardReturn {
  // Get navigation guard from middleware name
  const [middleware, guard]: MiddlewareName = name.split(":") as MiddlewareName;

  if (!Array.prototype.hasOwnProperty.call(middlewares, middleware)) {
    throw new Error(
      `Unknown [${middleware}] middleware, did you register this middleware?`
    );
  }

  let middlewareExecContext: MiddlewareContext = {
    ...ctx,
    guard,
  };

  // Run specified middleware from the middleware register with merged context
  return middlewares[middleware](middlewareExecContext);
}

/**
 * Get Middleware Names from route meta tags
 *
 * @param metas to be extracted from
 * @returns a list of middleware names
 */
function getMiddlewares(metas: RouteMeta[]): string[] {
  let middlewareNames = metas
    .map((meta: RouteMeta): string[] => {
      // Filter out excluded middlewares
      if (meta.excludeMiddleware) {
        const excludes = meta.excludeMiddleware;
        meta.middleware = meta.middleware?.filter(
          (name) => !excludes.includes(name)
        );
      }

      if (meta.middleware) {
        // meta.middleware.push(...meta.middleware);
        return meta.middleware;
      }
      return [];
    })
    .reduce((prev: string[], curr: string[]): string[] => {
      return prev.concat(curr);
    });

  // Filter out duplicate middleware names
  return Array.from(new Set(middlewareNames));
}
