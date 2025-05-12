import { permissionKey } from "@/composables/injectionKeys";
import { readonly, type App } from "vue";
import { type RouteMeta } from "vue-router";

declare module "vue-router" {
  interface RouteMeta {
    roles?: string[] | string;
    permissions?: string[] | string;
  }
}

export interface Permission {
  can: (value: string) => boolean;
  is: (value: string) => boolean;
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

  abstract can: (value: string) => boolean;
  abstract is: (value: string) => boolean;

  /**
   * Check if route meta tag has no roles
   *
   * @param meta tag to be checked
   * @returns
   * @internal
   */
  _hasntRole({ roles }: RouteMeta): boolean {
    if (!roles || !(roles as []).length) {
      return false;
    }

    const normalizedRoles = this._normalize(roles);
    return !this.is(normalizedRoles);
  }

  /**
   * Check if route meta tag has no permissions
   *
   * @param meta tag to be checked
   * @returns
   * @internal
   */
  _hasntPermissions({ permissions }: RouteMeta): boolean {
    if (!permissions || !(permissions as []).length) {
      return false;
    }

    const normalizedPermissions = this._normalize(permissions);
    return !this.can(normalizedPermissions);
  }

  /**
   * Normalize input to string
   *
   * @param value
   * @returns normalized string
   */
  _normalize(value: string[] | string | undefined): string {
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
