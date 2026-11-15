/**
 * The language of the interface, sent with requests whose answer is written for the user (the
 * Flame Lab explanation). The interface is English only. To follow the browser instead, this is
 * the single place to change: e.g. `navigator.language.slice(0, 2)`.
 */
export function uiLanguage(): string {
  return "en";
}
