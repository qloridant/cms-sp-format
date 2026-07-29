// Validation côté client : bonne formation (well-formed) + contrôles structurels.
// Filet immédiat, sans serveur. Pour la validation XSD complète, voir le README.

export function validate(xmlString) {
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

  const issues = [];
  const root = doc.documentElement;
  const name = root.localName;
  if (name !== "Publication") issues.push({ level: "error", msg: `Racine inattendue : <${name}>.` });
  if (!root.getAttribute("ID")) issues.push({ level: "error", msg: "Attribut ID obligatoire." });

  const hasTitle = Array.from(root.children).some((c) => c.localName === "title");
  if (!hasTitle) issues.push({ level: "warn", msg: "Titre (dc:title) manquant." });

  const hasQ = Array.from(root.children).some((c) => c.localName === "Questionnaire");
  const hasRG = Array.from(root.children).some((c) => c.localName === "RechercheGuidee");
  if (hasQ && hasRG) issues.push({ level: "error", msg: "Le questionnaire plat et la recherche guidée ne peuvent pas coexister." });

  // cohérence des variables conditionnelles (questionnaire plat + conditions des éléments de todolist)
  const assigned = new Set(
    [...doc.getElementsByTagName("affecteVrai"), ...doc.getElementsByTagName("affecteFaux")]
      .map((e) => e.getAttribute("var")).filter(Boolean)
  );
  const referenced = [...doc.getElementsByTagName("estVrai"), ...doc.getElementsByTagName("estFaux")]
    .map((e) => e.getAttribute("var")).filter(Boolean);
  [...new Set(referenced)].forEach((v) => {
    if (!assigned.has(v)) issues.push({ level: "warn", msg: `Variable « ${v} » testée par un élément mais jamais définie par le questionnaire.` });
  });

  return issues;
}
