import { glueHtml as glueHtmlCore } from "@typehug/core/html";
import type { GlueOptions } from "@typehug/core";
import { profile } from "./profile.js";

export type { GlueOptions } from "@typehug/core";

export function glueHtml(fragment: string, options?: GlueOptions): string {
  return glueHtmlCore(fragment, profile, options);
}
