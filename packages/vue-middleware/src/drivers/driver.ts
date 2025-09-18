import { Awaitable } from "../globalDeclarations";
import { permissionKey } from "../composables/injectionKeys";
import { readonly, type App } from "vue";
import { type RouteMeta } from "vue-router";

declare module "vue-router" {
  interface RouteMeta {
    roles?: string[] | string;
    permissions?: string[] | string;
  }
}

export interface Permission {
  /**
   * Check if current authenticated User has the required Permission(s)
   * @param serializedPermissions that are required for the check
   * @returns true if User has the required permissions
   */
  can: (value: string) => Awaitable<boolean>;
  /**
   * Check if current authenticated User has the required Role(s)
   * @param serializedRoles that are required for the check
   * @returns true if User has the required roles
   */
  is: (value: string) => Awaitable<boolean>;
}

/**
 * Defines an abstrict permission driver for handleing roles and permissions
 * @public
 */
export abstract class Driver implements Permission {
  _app: App;

  constructor(app: App) {
    this._app = app;
  }

  abstract can: (value: string) => Awaitable<boolean>;
  abstract is: (value: string) => Awaitable<boolean>;

  /**
   * Check if route meta tag has no roles OR not the required roles
   *
   * @param meta tag to be checked
   * @returns true if Route has permissions
   * @internal
   */
  _hasntRole({ roles }: RouteMeta): Awaitable<boolean> {
    if (!roles || !(roles as []).length) {
      return false; // No roles found
    }

    // Normalize/Serialize Roles into rule string
    const normalizedRoles = this._normalize(roles);

    // Execute *.is() from Driver to check Roles
    const result: Awaitable<boolean> = this.is(normalizedRoles);
    if (typeof result === "boolean") {
      return !result;
    } else {
      return new Promise((resolve, reject) => {
        result
          .then((value) => {
            resolve(!value);
          })
          .catch(reject);
      });
    }
  }

  /**
   * Check if route meta tag has no permissions OR not the required ones
   *
   * @param meta tag to be checked
   * @returns
   * @internal
   */
  _hasntPermissions({ permissions }: RouteMeta): Awaitable<boolean> {
    if (!permissions || !(permissions as []).length) {
      return false;
    }

    // Normalize/Serialize Permissions into rule string
    const normalizedPermissions = this._normalize(permissions);

    // Execute *.can() from Driver to check Permissions
    const result: Awaitable<boolean> = this.can(normalizedPermissions);
    if (typeof result === "boolean") {
      return !result;
    } else {
      return new Promise((resolve, reject) => {
        result
          .then((value) => {
            resolve(!value);
          })
          .catch(reject);
      });
    }
  }

  /**
   * Normalize input to string
   *
   * @param value
   * @returns normalized string
   */
  _normalize(value: string[] | string): string {
    // If input is string Array, normalize with AND
    if (Array.isArray(value)) {
      return value.join("&");
    }

    if (typeof value === "string") {
      return value;
    }

    return "";
  }

  /**
   * @internal
   */
  _lookup() {
    this._app.provide(
      permissionKey,
      readonly({
        can: this.can,
        is: this.is,
      } satisfies Permission)
    );
    // const globalProperties = this._app.config.globalProperties;

    // globalProperties.can = this.can();
    // globalProperties.is = this.is();
  }
}
