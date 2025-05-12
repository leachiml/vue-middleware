import { inject } from "vue";
import { permissionKey } from "./injectionKeys";
import { Permission } from "../drivers/driver";

export function usePermissions(): Permission {
  //const globalprops = getCurrentInstance()?.appContext.config.globalProperties
  return inject(permissionKey, {
    can: (_: string) => {
      return false;
    },
    is: (_: string) => {
      return false;
    },
  });
}
