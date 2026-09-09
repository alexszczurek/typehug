import { profile as pl } from "@typehug/pl/profile";
import { profile as en } from "@typehug/en/profile";
import type { LanguageProfile } from "@typehug/core";

export function getProfile(locale: unknown): LanguageProfile {
  if (locale === "pl") return pl;
  if (locale === "en") return en;
  throw new RangeError('Typehug requires an explicit locale: "pl" or "en".');
}
