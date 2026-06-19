/**
 * Central module registration. Importing this module wires every business
 * module into the registry. Add a new module by importing its manifest and
 * calling registerModule — nothing else in the shell needs to change.
 */
import { registerModule, allModules, getModule } from "@/platform/modules";
import { hrmManifest } from "./hrm/manifest";
import { crmManifest } from "./crm/manifest";
import { catalogManifests } from "./catalog";

let initialized = false;
export function ensureModulesRegistered(): void {
  if (initialized) return;
  // HR + CRM first (fully built) so role landing prefers them; the rest of the
  // 15 business modules from the architecture doc follow as overview modules.
  registerModule(hrmManifest);
  registerModule(crmManifest);
  catalogManifests.forEach(registerModule);
  initialized = true;
}

ensureModulesRegistered();

export { allModules, getModule };
