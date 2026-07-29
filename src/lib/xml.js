// Logique pure, indépendante de Svelte : constantes du schéma + sérialisation XML.
// L'éditeur ne produit plus qu'un seul type de contenu : la fiche
// « Comment faire si conditionné » (Introduction + Questionnaire/Recherche guidée +
// todolist(s) + Conclusion).

export const FICHE_TYPE = "Fiche Comment faire si conditionné";
export const AUTO_SURTITRE = "Comment faire si";
// Type par défaut d'un lien interne (attribut requis ; xs:string libre).
export const LIEN_INTERNE_TYPE = "Fiche";

let _id = 0;
export const uid = () => `b${++_id}`;

// ---------------------------------------------------------------- texte riche
export function tokenize(text) {
  const out = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: "text", v: text.slice(last, m.index) });
    if (m[1] != null) out.push({ t: "bold", v: m[1] });
    else if (m[2] != null) out.push({ t: "ital", v: m[2] });
    else if (m[4].startsWith("#")) out.push({ t: "linkint", v: m[3], id: m[4].slice(1) });
    else out.push({ t: "link", v: m[3], url: m[4] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ t: "text", v: text.slice(last) });
  return out;
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function inlineXml(text) {
  return tokenize(text).map((k) =>
    k.t === "bold" || k.t === "ital" ? `<MiseEnEvidence>${esc(k.v)}</MiseEnEvidence>`
    : k.t === "link" ? `<LienExterne URL="${esc(k.url)}">${esc(k.v)}</LienExterne>`
    : k.t === "linkint" ? `<LienInterne LienPublication="${esc(k.id)}" type="${LIEN_INTERNE_TYPE}">${esc(k.v)}</LienInterne>`
    : esc(k.v)
  ).join("");
}
export const paragraphes = (t) => t.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean);
const para = (txt, ind) => `${ind}<Paragraphe>${inlineXml(txt)}</Paragraphe>`;
const I = "  ";
function titreRicheXml(txt, tag, ind) { return `${ind}<${tag}><Paragraphe>${inlineXml(txt)}</Paragraphe></${tag}>`; }

// ---------------------------------------------------------------- todolist (Liste type="caseACocher")
function itemXml(it, ind) {
  const cond = it.condVar?.trim()
    ? `${ind}  <Condition><${it.condVal === "faux" ? "estFaux" : "estVrai"} var="${esc(it.condVar)}"/></Condition>\n`
    : "";
  return `${ind}<Item>\n${cond}${para(it.texte, ind + "  ")}\n${ind}</Item>`;
}
function listeCocherXml(items, ind) {
  const valides = items.filter((it) => it.texte.trim());
  if (!valides.length) return "";
  return `${ind}<Liste type="caseACocher">\n${valides.map((it) => itemXml(it, ind + "  ")).join("\n")}\n${ind}</Liste>`;
}
function todolistsXml(lists, ind) {
  const valides = lists.filter((c) => c.titre.trim() || c.items.some((it) => it.texte.trim()));
  if (!valides.length) return "";
  return valides.map((c) => {
    const titre = c.titre.trim() ? `${ind}  <Titre><Paragraphe>${inlineXml(c.titre)}</Paragraphe></Titre>\n` : "";
    const liste = listeCocherXml(c.items, ind + "  ");
    return `${ind}<Chapitre>\n${titre}${liste}\n${ind}</Chapitre>`;
  }).join("\n");
}
function texteXml(d) {
  const chaps = todolistsXml(d.todolists, I + I);
  return chaps ? `${I}<Texte>\n${chaps}\n${I}</Texte>` : "";
}

// ---------------------------------------------------------------- questionnaire plat
function questionnaireXml(q) {
  const questions = q.questions.filter((qu) => qu.titre.trim() && qu.choix.length);
  if (!questions.length) return "";
  const desc = q.description.trim() ? `${I}${I}<Description><Paragraphe>${inlineXml(q.description)}</Paragraphe></Description>\n` : "";
  const body = questions.map((qu) => {
    const choix = qu.choix.filter((c) => c.titre.trim()).map((c) => {
      const affect = (c.affect || []).filter((a) => a.var.trim());
      const si = affect.length
        ? `\n${I}${I}${I}${I}<SiSelectionne>\n` +
          affect.map((a) => `${I}${I}${I}${I}${I}<${a.val === "faux" ? "affecteFaux" : "affecteVrai"} var="${esc(a.var)}"/>`).join("\n") +
          `\n${I}${I}${I}${I}</SiSelectionne>\n${I}${I}${I}`
        : "";
      return `${I}${I}${I}<Choix>\n${titreRicheXml(c.titre, "Titre", I + I + I + I)}${si ? "" : "\n" + I + I + I}${si}</Choix>`;
    }).join("\n");
    return `${I}${I}<Question>\n${titreRicheXml(qu.titre, "Titre", I + I + I)}\n${choix}\n${I}${I}</Question>`;
  }).join("\n");
  return `${I}<Questionnaire>\n${desc}${body}\n${I}</Questionnaire>`;
}
export function computeVars(q, answers) {
  const v = {};
  q.questions.forEach((qu) => {
    const ch = qu.choix.find((c) => c.chid === answers[qu.qid]);
    if (ch) (ch.affect || []).forEach((a) => { if (a.var.trim()) v[a.var] = a.val !== "faux"; });
  });
  return v;
}

// ---------------------------------------------------------------- recherche guidée (arbre)
// Un nœud (Problematique à la racine, Branche ensuite) : question posée (titre),
// libellé du choix qui y mène (titreChoix), et soit des sous-branches, soit une
// feuille qui renvoie vers une fiche (LienInterne).
function brancheXml(n, ind, tag) {
  const parts = [];
  if (n.titre.trim()) parts.push(titreRicheXml(n.titre, "Titre", ind + "  "));
  if (n.titreChoix?.trim()) parts.push(titreRicheXml(n.titreChoix, "TitreChoix", ind + "  "));
  if (n.kind === "lien") {
    if (n.lienId?.trim()) {
      parts.push(`${ind}  <LienInterne LienPublication="${esc(n.lienId)}" type="${LIEN_INTERNE_TYPE}">${esc(n.lienTitre || "Voir la fiche")}</LienInterne>`);
    }
  } else {
    (n.branches || []).forEach((b) => {
      const x = brancheXml(b, ind + "  ", "Branche");
      if (x) parts.push(x);
    });
  }
  if (!parts.length) return "";
  return `${ind}<${tag}>\n${parts.join("\n")}\n${ind}</${tag}>`;
}
function problematiquesXml(racines) {
  const valides = racines.map((r) => brancheXml(r, I + I, "Problematique")).filter(Boolean);
  if (!valides.length) return "";
  return `${I}<Problematiques>\n${valides.join("\n")}\n${I}</Problematiques>`;
}
function rgReferenceXml(arbre) {
  if (!arbre.rgId?.trim()) return "";
  const titre = arbre.titre?.trim() ? `\n${I}${I}<Titre>${esc(arbre.titre)}</Titre>\n${I}` : "";
  return `${I}<RechercheGuidee ID="${esc(arbre.rgId)}">${titre}</RechercheGuidee>`;
}
// Document séparé (Publication type="Recherche guidée") portant l'arbre Problematiques/Branche.
export function buildRechercheGuidee(d) {
  const a = d.questionnaire.arbre;
  const out = ['<?xml version="1.0" encoding="UTF-8"?>'];
  out.push(`<Publication xmlns:dc="http://purl.org/dc/elements/1.1/"${rootAttrs([
    ["ID", a.rgId], ["type", "Recherche guidée"],
  ])}>`);
  const titre = a.titre.trim() || d.titre;
  if (titre) out.push(`${I}<dc:title>${esc(titre)}</dc:title>`);
  const prob = problematiquesXml(a.racines);
  if (prob) out.push(prob);
  out.push("</Publication>");
  return out.join("\n");
}

// ---------------------------------------------------------------- briques racine
function rootAttrs(pairs) {
  const a = pairs.filter(([, v]) => v).map(([k, v]) => `${k}="${esc(v)}"`);
  return a.length ? "\n" + a.map((x) => "  " + x).join("\n") : "";
}
function dcAndIntro(d, out) {
  if (d.titre) out.push(`${I}<dc:title>${esc(d.titre)}</dc:title>`);
  if (d.description) out.push(`${I}<dc:description>${esc(d.description)}</dc:description>`);
  if (d.contributor) out.push(`${I}<dc:contributor>${esc(d.contributor)}</dc:contributor>`);
  if (d.surTitre) out.push(`${I}<SurTitre>${esc(d.surTitre)}</SurTitre>`);
}
function introXml(d) {
  if (!d.intro.trim()) return "";
  const ps = paragraphes(d.intro).map((p) => para(p, I + I + I)).join("\n");
  return `${I}<Introduction>\n${I}${I}<Texte>\n${ps}\n${I}${I}</Texte>\n${I}</Introduction>`;
}

// ---------------------------------------------------------------- sérialiseur principal
export function buildXml(d) {
  const out = ['<?xml version="1.0" encoding="UTF-8"?>'];
  out.push(`<Publication xmlns:dc="http://purl.org/dc/elements/1.1/"${rootAttrs([
    ["ID", d.id], ["type", FICHE_TYPE], ["statut", d.statut], ["dateDerniereModificationImportante", d.dateModif],
  ])}>`);
  dcAndIntro(d, out);
  const intro = introXml(d); if (intro) out.push(intro);
  if (d.questionnaire.mode === "arbre") {
    const rg = rgReferenceXml(d.questionnaire.arbre); if (rg) out.push(rg);
  } else {
    const q = questionnaireXml(d.questionnaire); if (q) out.push(q);
  }
  const txt = texteXml(d); if (txt) out.push(txt);
  if (d.conclusion.trim()) {
    const titre = d.conclusionTitre.trim() ? `${I}${I}<Titre><Paragraphe>${inlineXml(d.conclusionTitre)}</Paragraphe></Titre>\n` : "";
    const ps = paragraphes(d.conclusion).map((p) => para(p, I + I)).join("\n");
    out.push(`${I}<Conclusion>\n${titre}${ps}\n${I}</Conclusion>`);
  }
  out.push("</Publication>");
  return out.join("\n");
}
