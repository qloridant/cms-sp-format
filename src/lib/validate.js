// Validation côté client : bonne formation (well-formed) + contrôles structurels.
// Filet immédiat, sans serveur. Pour la validation XSD complète, voir le README.

const ROOTS = { Publication: 1, Actualite: 1, ServiceComplementaire: 1 };

export function validate(xmlString) {
  const issues = [];
  let doc;
  try {
    doc = new DOMParser().parseFromString(xmlString, "application/xml");
  } catch {
    return [{ level: "error", msg: "XML illisible." }];
  }
  const perr = doc.querySelector("parsererror");
  if (perr) {
    return [{ level: "error", msg: "XML mal formé : " + (perr.textContent || "").split("\n")[0] }];
  }

  const root = doc.documentElement;
  const name = root.localName;
  if (!ROOTS[name]) issues.push({ level: "error", msg: `Racine inattendue : <${name}>.` });

  // attributs requis par le schéma
  if (name === "ServiceComplementaire") {
    if (!root.getAttribute("ID")) issues.push({ level: "error", msg: "ServiceComplementaire : attribut ID obligatoire." });
    if (!root.getAttribute("type")) issues.push({ level: "error", msg: "ServiceComplementaire : attribut type obligatoire." });
  }
  if ((name === "Publication" || name === "Actualite") && !root.getAttribute("type")) {
    issues.push({ level: "warn", msg: `${name} : attribut type manquant.` });
  }

  // titre recommandé
  const hasTitle = Array.from(root.children).some((c) => c.localName === "title");
  if (!hasTitle) issues.push({ level: "warn", msg: "Titre (dc:title) manquant." });

  // cohérence des variables conditionnelles
  const assigned = new Set(
    [...doc.getElementsByTagName("affecteVrai"), ...doc.getElementsByTagName("affecteFaux")]
      .map((e) => e.getAttribute("var")).filter(Boolean)
  );
  const referenced = [...doc.getElementsByTagName("estVrai"), ...doc.getElementsByTagName("estFaux")]
    .map((e) => e.getAttribute("var")).filter(Boolean);
  [...new Set(referenced)].forEach((v) => {
    if (!assigned.has(v)) issues.push({ level: "warn", msg: `Variable « ${v} » testée par un fragment mais jamais définie par le questionnaire.` });
  });

  return issues;
}
