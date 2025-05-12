import { Permission } from "@/drivers/driver";
import { InjectionKey } from "vue";

/**
 * Permission Injection Key
 *
 * @internal
 */
export const permissionKey = Symbol("permissions") as InjectionKey<Permission>;
