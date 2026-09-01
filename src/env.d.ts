/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { PlatformEnv } from "@/lib/platform";

declare namespace App {
  interface Locals {
    platform: PlatformEnv;
    cspNonce: string;
  }
}