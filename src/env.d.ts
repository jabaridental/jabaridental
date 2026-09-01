/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    platform: import("./lib/platform").PlatformEnv;
    cspNonce: string;
  }
}
