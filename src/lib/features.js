// Feature flags. Ordre de priorité :
//   1. paramètre d'URL  ?ff_questionnaire=on|off   (test rapide, sans rebuild)
//   2. variable de build VITE_FF_QUESTIONNAIRE=true|false   (.env, ou variable GitHub Actions)
//   3. valeur par défaut ci-dessous
//
// questionnaire : toute la fonctionnalité « questionnaire » — questionnaire plat / recherche
// guidée, conditions « Afficher si… », suivi des variables, et leur effet sur l'aperçu et l'export XML.
// Désactivé : ces blocs disparaissent de l'éditeur et de l'aperçu, et l'export XML ne contient
// ni <Questionnaire>/<RechercheGuidee> ni <Condition>.
const DEFAULTS = { questionnaire: true };

const truthy = (v) => ["1", "true", "on", "yes", "oui"].includes(String(v).trim().toLowerCase());

function resolve(name, envValue) {
  try {
    const q = new URLSearchParams(globalThis.location?.search || "").get("ff_" + name);
    if (q != null) return truthy(q);
  } catch { /* hors navigateur */ }
  if (envValue != null && String(envValue).trim() !== "") return truthy(envValue);
  return DEFAULTS[name];
}

export const FEATURES = {
  questionnaire: resolve("questionnaire", import.meta.env?.VITE_FF_QUESTIONNAIRE),
};
