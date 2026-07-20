// Logique pure, indépendante de Svelte : constantes du schéma + sérialisation XML.

export const ENCADRES = {
  asavoir:   { xml: "ASavoir",   label: "À savoir",  accent: "#0063cb", bg: "#f4f6ff" },
  attention: { xml: "Attention", label: "Attention", accent: "#b34000", bg: "#fff4ed" },
  anoter:    { xml: "ANoter",    label: "À noter",   accent: "#0063cb", bg: "#f5f5fe" },
  exemple:   { xml: "Exemple",   label: "Exemple",   accent: "#3a3a3a", bg: "#f3f3f3" },
  rappel:    { xml: "Rappel",    label: "Rappel",    accent: "#695240", bg: "#fbf6ed" },
};

export const DOC = {
  publication: { root: "Publication", label: "Publication", fixedType: null, illus: "imageVideo", conclusion: true, conditions: false },
  cfs:         { root: "Publication", label: "Comment faire si", fixedType: "Fiche Comment faire si", illus: "imageVideo", conclusion: true, conditions: false },
  cfsc:        { root: "Publication", label: "Comment faire si conditionné", fixedType: "Fiche Comment faire si conditionné", illus: "imageVideo", conclusion: true, conditions: true },
  actualite:   { root: "Actualite", label: "Actualité", illus: "imageSeule", conclusion: false, conditions: false, echeance: true },
  demarche:    { root: "ServiceComplementaire", label: "Démarche", illus: "aucune", conclusion: false, conditions: false, self: true },
};

export const PUB_TYPES = ["Fiche d'information", "Fiche avec liens externes", "Fiche Question-réponse"];
export const ACTU_TYPES = ["bref", "leSaviezVous", "jurisprudence", "reponseMinistere", "decouvrir", "indice", "eAdministration", "chiffre", "alerte", "dossierActualite", "video"];
export const DEM_TYPES = ["Téléservice", "Téléservice personnalisable", "Simulateur", "Formulaire", "Modèle de document", "Notice", "Service en ligne redirigé", "Site Web"];
export const SELF_TYPES = ["Téléservice", "Simulateur", "Formulaire", "Modèle de document", "Service en ligne redirigé"];
export const OPERATEURS = { avantle: "avant le", jusquau: "jusqu'au", apartirdu: "à partir du", le: "le" };
export const ADD_BLOCS = [
  ["paragraphe", "Paragraphe"], ["soustitre", "Sous-titre"], ["liste", "Liste"], ["asavoir", "À savoir"], ["attention", "Attention"],
  ["anoter", "À noter"], ["exemple", "Exemple"], ["rappel", "Rappel"], ["demarche", "Lien démarche"],
];
export const SELF_ZONES = [["etapes", "Étapes"], ["documents", "Documents à fournir"], ["delai", "Délai"], ["recours", "Recours"]];

// Type par défaut d'un lien interne (attribut requis ; xs:string libre).
export const LIEN_INTERNE_TYPE = "Fiche";
// Surtitre généré automatiquement depuis le type de document.
export const AUTO_SURTITRE = {
  publication: "Fiche pratique", cfs: "Comment faire si", cfsc: "Comment faire si",
  actualite: "Actualité", demarche: "Démarche",
};

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

// ---------------------------------------------------------------- blocs
function blocInnerXml(b, ind) {
  if (b.kind === "paragraphe") return paragraphes(b.texte).map((p) => para(p, ind)).join("\n");
  if (b.kind === "soustitre") return `${ind}<TitreFlottant><Paragraphe>${inlineXml(b.texte)}</Paragraphe></TitreFlottant>`;
  if (b.kind === "liste") {
    const type = b.style === "numero" ? "numero" : "puce";
    const items = b.texte.split("\n").map((l) => l.trim()).filter(Boolean)
      .map((l) => `${ind}  <Item>\n${para(l, ind + "    ")}\n${ind}  </Item>`).join("\n");
    return `${ind}<Liste type="${type}">\n${items}\n${ind}</Liste>`;
  }
  if (b.kind === "demarche") {
    const titre = b.titre ? `\n${ind}  <Titre>${esc(b.titre)}</Titre>\n${ind}` : "";
    const url = b.url ? ` URL="${esc(b.url)}"` : "";
    return `${ind}<ServiceEnLigne type="${esc(b.selfType || "Téléservice")}" ID="${esc(b.refId || "R00000")}"${url}>${titre}</ServiceEnLigne>`;
  }
  const def = ENCADRES[b.kind];
  if (def) {
    const titre = b.titre ? `${ind}  <Titre>${esc(b.titre)}</Titre>\n` : "";
    const corps = paragraphes(b.texte).map((p) => para(p, ind + "  ")).join("\n");
    return `${ind}<${def.xml}>\n${titre}${corps}\n${ind}</${def.xml}>`;
  }
  return "";
}
// Enveloppe FragmentConditionne (condition + contenu), formatage unique partagé.
function fragmentXml(condVar, condVal, innerXml, ind) {
  const test = condVal === "faux" ? "estFaux" : "estVrai";
  const cond = condVar ? `${ind}  <Condition><${test} var="${esc(condVar)}"/></Condition>\n` : "";
  return `${ind}<FragmentConditionne>\n${cond}${innerXml}\n${ind}</FragmentConditionne>`;
}
function blocXml(b, ind, conditionsOn) {
  if (b.kind === "sousbloc") {
    return fragmentXml(b.condVar, b.condVal, blocsXml(b.blocs, ind + "  ", false), ind);
  }
  if (conditionsOn && b.condVar) {
    return fragmentXml(b.condVar, b.condVal, blocInnerXml(b, ind + "  "), ind);
  }
  return blocInnerXml(b, ind);
}
function blocsXml(blocs, ind, conditionsOn) {
  return blocs.map((b) => blocXml(b, ind, conditionsOn)).filter(Boolean).join("\n");
}
function chapitresXml(chaps, ind, conditionsOn) {
  const valides = chaps.filter((c) => c.titre.trim() || c.blocs.length);
  if (!valides.length) return "";
  return valides.map((c) => {
    const titre = c.titre.trim() ? `${ind}  <Titre><Paragraphe>${inlineXml(c.titre)}</Paragraphe></Titre>\n` : "";
    return `${ind}<Chapitre>\n${titre}${blocsXml(c.blocs, ind + "  ", conditionsOn)}\n${ind}</Chapitre>`;
  }).join("\n");
}

// ---------------------------------------------------------------- questionnaire
function titreRiche(txt, ind) { return `${ind}<Titre><Paragraphe>${inlineXml(txt)}</Paragraphe></Titre>`; }
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
      return `${I}${I}${I}<Choix>\n${titreRiche(c.titre, I + I + I + I)}${si ? "" : "\n" + I + I + I}${si}</Choix>`;
    }).join("\n");
    return `${I}${I}<Question>\n${titreRiche(qu.titre, I + I + I)}\n${choix}\n${I}${I}</Question>`;
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
function illustrationXml(d) {
  if (d.illusKind === "image" && d.illusSrc) {
    const leg = d.illusLegende ? `${I}${I}<Legende>${esc(d.illusLegende)}</Legende>\n` : "";
    const alt = d.illusAlt ? `${I}${I}<TexteDeRemplacement>${esc(d.illusAlt)}</TexteDeRemplacement>\n` : "";
    return `${I}<ImageIllustration LienPublication="${esc(d.illusSrc)}" type="image">\n${leg}${alt}${I}</ImageIllustration>`;
  }
  if (d.illusKind === "video" && d.illusSrc) {
    const four = d.illusFournisseur ? ` fournisseur="${esc(d.illusFournisseur)}"` : "";
    const leg = d.illusLegende ? `\n${I}${I}<Legende>${esc(d.illusLegende)}</Legende>\n${I}` : "";
    return `${I}<VideoIllustration URL="${esc(d.illusSrc)}" type="video"${four}>${leg}</VideoIllustration>`;
  }
  return "";
}
function introXml(d) {
  if (!d.intro.trim()) return "";
  const ps = paragraphes(d.intro).map((p) => para(p, I + I + I)).join("\n");
  return `${I}<Introduction>\n${I}${I}<Texte>\n${ps}\n${I}${I}</Texte>\n${I}</Introduction>`;
}
function texteXml(d, conditionsOn) {
  const chaps = chapitresXml(d.chapitres, I + I, conditionsOn);
  return chaps ? `${I}<Texte>\n${chaps}\n${I}</Texte>` : "";
}

// ---------------------------------------------------------------- sérialiseurs
function buildPublication(d, cfg) {
  const out = ['<?xml version="1.0" encoding="UTF-8"?>'];
  const type = cfg.fixedType || d.pubType;
  out.push(`<Publication xmlns:dc="http://purl.org/dc/elements/1.1/"${rootAttrs([
    ["ID", d.id], ["type", type], ["statut", d.statut], ["dateDerniereModificationImportante", d.dateModif],
  ])}>`);
  dcAndIntro(d, out);
  const ill = illustrationXml(d); if (ill) out.push(ill);
  const intro = introXml(d); if (intro) out.push(intro);
  if (cfg.conditions) { const q = questionnaireXml(d.questionnaire); if (q) out.push(q); }
  const txt = texteXml(d, cfg.conditions); if (txt) out.push(txt);
  if (cfg.conclusion && d.conclusion.trim()) {
    const titre = d.conclusionTitre.trim() ? `${I}${I}<Titre><Paragraphe>${inlineXml(d.conclusionTitre)}</Paragraphe></Titre>\n` : "";
    const ps = paragraphes(d.conclusion).map((p) => para(p, I + I)).join("\n");
    out.push(`${I}<Conclusion>\n${titre}${ps}\n${I}</Conclusion>`);
  }
  out.push("</Publication>");
  return out.join("\n");
}
function buildActualite(d) {
  const out = ['<?xml version="1.0" encoding="UTF-8"?>'];
  out.push(`<Actualite xmlns:dc="http://purl.org/dc/elements/1.1/"${rootAttrs([
    ["ID", d.id], ["type", d.actuType], ["datePremiereMiseEnLigne", d.datePremiere], ["dateMaj", d.dateMaj], ["spUrl", d.spUrl],
  ])}>`);
  dcAndIntro(d, out);
  const ill = illustrationXml(d); if (ill) out.push(ill);
  if (d.echBorne) {
    const attrs = d.echBorne === "fixe"
      ? `borneTemporelle="fixe" operateur="${esc(d.echOperateur || "avantle")}" date="${esc(d.echDate)}"`
      : `borneTemporelle="periode" dateDebut="${esc(d.echDebut)}" dateFin="${esc(d.echFin)}"`;
    out.push(`${I}<Echeance ${attrs}>${esc(d.echTexte || "")}</Echeance>`);
  }
  const intro = introXml(d); if (intro) out.push(intro);
  const txt = texteXml(d, false); if (txt) out.push(txt);
  out.push("</Actualite>");
  return out.join("\n");
}
function contentSelfXml(self) {
  const zones = [["Etapes", self.etapes], ["Documents", self.documents], ["Delai", self.delai], ["Recours", self.recours]];
  const parts = zones.filter(([, bs]) => bs.length).map(([tag, bs]) =>
    `${I}${I}<${tag}>\n${blocsXml(bs, I + I + I, false)}\n${I}${I}</${tag}>`
  );
  if (!parts.length) return "";
  return `${I}<CommentFaireSelf>\n${parts.join("\n")}\n${I}</CommentFaireSelf>`;
}
function buildServiceComplementaire(d) {
  const out = ['<?xml version="1.0" encoding="UTF-8"?>'];
  out.push(`<ServiceComplementaire xmlns:dc="http://purl.org/dc/elements/1.1/"${rootAttrs([
    ["ID", d.id || "R00000"], ["type", d.demType], ["statut", d.statut], ["dateDerniereModificationImportante", d.dateModif],
  ])}>`);
  dcAndIntro(d, out);
  if (d.numeroCerfa) out.push(`${I}<NumeroCerfa>${esc(d.numeroCerfa)}</NumeroCerfa>`);
  if (d.cout.trim()) out.push(`${I}<Cout>\n${para(d.cout, I + I)}\n${I}</Cout>`);
  if (d.nbEtapes.trim()) out.push(`${I}<NbEtapes>\n${para(d.nbEtapes, I + I)}\n${I}</NbEtapes>`);
  const intro = introXml(d); if (intro) out.push(intro);
  const txt = texteXml(d, false); if (txt) out.push(txt);
  const self = contentSelfXml(d.self); if (self) out.push(self);
  out.push("</ServiceComplementaire>");
  return out.join("\n");
}
export function buildXml(d) {
  const cfg = DOC[d.docType];
  if (cfg.root === "Publication") return buildPublication(d, cfg);
  if (cfg.root === "Actualite") return buildActualite(d);
  return buildServiceComplementaire(d);
}
