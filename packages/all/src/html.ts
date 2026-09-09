import { glueHtml as glueHtmlCore } from "@typehug/core/html";
import type { LocaleOptions } from "./index.js";
import { getProfile } from "./profiles.js";

export type { Locale, LocaleOptions } from "./index.js";

export function glueHtml(fragment: string, options: LocaleOptions): string {
  return glueHtmlCore(fragment, getProfile(options?.locale), options);
}
