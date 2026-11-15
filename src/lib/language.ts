/**
 * The language sent with requests whose answer is written for the user (the Flame Lab
 * explanation): the browser's, as the team decided, so a Spanish browser gets a Spanish
 * explanation while the interface stays English. Falls back to "en" when the browser gives
 * nothing the service accepts (a BCP 47 tag).
 */
export function uiLanguage(): string {
  const tag = typeof navigator === "undefined" ? "" : (navigator.language ?? "").trim();
  return /^[A-Za-z]{2,3}(-[A-Za-z0-9]{1,8})*$/.test(tag) ? tag : "en";
}
