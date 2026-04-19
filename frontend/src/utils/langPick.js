/**
 * Pick a string from a multi-language dict with graceful fallback.
 * Usage: pickLang({ fr: "Bonjour", en: "Hello", es: "Hola" }, "es")
 * Fallback order: requested lang -> en -> fr -> first value.
 */
export function pickLang(dict, lang) {
  if (!dict) return "";
  if (dict[lang] != null) return dict[lang];
  if (dict.en != null) return dict.en;
  if (dict.fr != null) return dict.fr;
  const vals = Object.values(dict);
  return vals[0] ?? "";
}
