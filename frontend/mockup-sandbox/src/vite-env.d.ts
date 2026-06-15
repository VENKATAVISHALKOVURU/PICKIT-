/// <reference types="vite/client" />

declare module "virtual:mockup-components" {
  type ModuleMap = Record<string, () => Promise<Record<string, unknown>>>;
  export const modules: ModuleMap;
}
