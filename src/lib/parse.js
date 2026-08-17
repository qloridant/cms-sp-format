// Import : reconstruit l'état de l'éditeur à partir d'un XML produit par l'outil.
// Miroir du sérialiseur (xml.js). Le rendu inline gras/italique étant sérialisé
// en <MiseEnEvidence>, il est réimporté en **gras** (l'italique n'est pas distingué).

import { uid } from "./xml.js";

const els = (el) => (el ? Array.from(el.children) : []);
const childL = (el, local) => els(el).find((c) => c.localName === local) || null;
const childrenL = (el, local) => els(el).filter((c) => c.localName === local);
const txt = (el) => (el ? el.textContent.trim() : "");

function inline(p) {
  if (!p) return "";
  let out = "";
  p.childNodes.forEach((n) => {
    if (n.nodeType === 3) out += n.nodeValue;
    else if (n.nodeType === 1) {
      if (n.localName === "MiseEnEvidence") out += "**" + n.textContent + "**";
      else if (n.localName === "LienExterne") out += "[" + n.textContent + "](" + (n.getAttribute("URL") || "") + ")";
      else if (n.localName === "LienInterne") out += "[" + n.textContent + "](#" + (n.getAttribute("LienPublication") || "") + ")";
      else out += n.textContent;
    }
  });
  return out.trim();
}
const parasText = (el) => childrenL(el, "Paragraphe").map(inline).join("\n\n");
function titreRiche(titreEl) {
  if (!titreEl) return "";
  const p = childL(titreEl, "Paragraphe");
  return p ? inline(p) : titreEl.textContent.trim();
}

// ---------------------------------------------------------------- todolist
const asTerm = (c) => ({ id: uid(), var: c.getAttribute("var") || "", val: c.localName === "estFaux" ? "faux" : "vrai" });
// conds = groupes ET-és ({ id, terms }), un terme seul ou un <ou> devient un groupe.
// <et>/<non> imbriqués ne sont pas repris par l'éditeur (non représentables dans l'UI actuelle).
function parseCondition(el) {
  const cond = childL(el, "Condition");
  if (!cond) return { conds: [] };
  const conds = els(cond).map((c) => {
    if (c.localName === "estVrai" || c.localName === "estFaux") return { id: uid(), terms: [asTerm(c)] };
    if (c.localName === "ou") {
      const terms = els(c).filter((t) => t.localName === "estVrai" || t.localName === "estFaux").map(asTerm);
      return terms.length ? { id: uid(), terms } : null;
    }
    return null;
  }).filter(Boolean);
  return { conds };
}
function parseTodolists(texteEl) {
  if (!texteEl) return [];
  return childrenL(texteEl, "Chapitre").map((c) => {
    const liste = childL(c, "Liste");
    const items = liste
      ? childrenL(liste, "Item").map((it) => ({ id: uid(), texte: parasText(it), ...parseCondition(it) }))
      : [];
    return { cid: uid(), titre: titreRiche(childL(c, "Titre")), items, ...parseCondition(c) };
  });
}

// ---------------------------------------------------------------- situations (ListeSituations)
function parseSituations(root) {
  const ls = childL(root, "ListeSituations");
  if (!ls) return { affichage: "onglet", list: [] };
  const list = childrenL(ls, "Situation").map((s) => ({
    id: uid(),
    titre: txt(childL(s, "Titre")),
    ...parseCondition(s),
    todolists: parseTodolists(childL(s, "Texte")),
  }));
  return { affichage: ls.getAttribute("affichage") || "onglet", list };
}

// ---------------------------------------------------------------- questionnaire plat
function parseQuestionnaire(qEl) {
  const questions = [];
  childrenL(qEl, "Question").forEach((qu) => {
    const question = { qid: uid(), titre: titreRiche(childL(qu, "Titre")), choix: [], ...parseCondition(qu) };
    childrenL(qu, "Choix").forEach((c) => {
      const affect = [];
      const si = childL(c, "SiSelectionne");
      if (si) els(si).forEach((a) => {
        if (a.localName === "affecteVrai") affect.push({ var: a.getAttribute("var") || "", val: "vrai" });
        else if (a.localName === "affecteFaux") affect.push({ var: a.getAttribute("var") || "", val: "faux" });
      });
      question.choix.push({ chid: uid(), titre: titreRiche(childL(c, "Titre")), affect });
    });
    questions.push(question);
  });
  return { description: titreRiche(childL(qEl, "Description")), questions };
}

// ---------------------------------------------------------------- recherche guidée (arbre)
function parseBranche(el) {
  const titre = titreRiche(childL(el, "Titre"));
  const titreChoix = titreRiche(childL(el, "TitreChoix"));
  const lien = childL(el, "LienInterne");
  if (lien) {
    return {
      bid: uid(), titre, titreChoix, kind: "lien", branches: [],
      lienId: lien.getAttribute("LienPublication") || "", lienTitre: lien.textContent.trim(),
    };
  }
  return {
    bid: uid(), titre, titreChoix, kind: "noeud",
    branches: childrenL(el, "Branche").map(parseBranche),
    lienId: "", lienTitre: "",
  };
}
// Parse le document séparé (Publication type="Recherche guidée") : Problematiques/Branche.
export function parseRechercheGuidee(text) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const perr = doc.querySelector("parsererror");
  if (perr) throw new Error((perr.textContent || "XML mal formé").split("\n")[0]);
  const root = doc.documentElement;
  const probs = childL(root, "Problematiques");
  const racines = probs ? childrenL(probs, "Problematique").map(parseBranche) : [];
  return { rgId: root.getAttribute("ID") || "", titre: txt(childL(root, "title")), racines };
}

function defaults() {
  return {
    id: "", statut: "", dateModif: "",
    titre: "", description: "", surTitre: "", contributor: "",
    intro: "",
    questionnaire: {
      mode: "plat",
      description: "", questions: [],
      arbre: { rgId: "", titre: "", racines: [] },
    },
    todolists: [],
    situations: { affichage: "onglet", list: [] },
    conclusionTitre: "", conclusion: "",
  };
}

export function parseXml(text) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const perr = doc.querySelector("parsererror");
  if (perr) throw new Error((perr.textContent || "XML mal formé").split("\n")[0]);
  const root = doc.documentElement;
  const name = root.localName;
  if (name !== "Publication") throw new Error(`Racine inattendue : <${name}>. Cet éditeur ne lit que les fiches « Comment faire si conditionné ».`);
  const d = defaults();

  d.id = root.getAttribute("ID") || "";
  d.statut = root.getAttribute("statut") || "";
  d.dateModif = root.getAttribute("dateDerniereModificationImportante") || "";

  d.titre = txt(childL(root, "title"));
  d.description = txt(childL(root, "description"));
  d.contributor = txt(childL(root, "contributor"));
  d.surTitre = txt(childL(root, "SurTitre"));

  const intro = childL(root, "Introduction");
  if (intro) d.intro = parasText(childL(intro, "Texte"));

  const q = childL(root, "Questionnaire");
  const rg = childL(root, "RechercheGuidee");
  if (q) {
    d.questionnaire.mode = "plat";
    Object.assign(d.questionnaire, parseQuestionnaire(q));
  } else if (rg) {
    d.questionnaire.mode = "arbre";
    d.questionnaire.arbre.rgId = rg.getAttribute("ID") || "";
    d.questionnaire.arbre.titre = txt(childL(rg, "Titre"));
  }

  d.todolists = parseTodolists(childL(root, "Texte"));
  d.situations = parseSituations(root);

  const concl = childL(root, "Conclusion");
  if (concl) {
    d.conclusionTitre = titreRiche(childL(concl, "Titre"));
    d.conclusion = parasText(concl);
  }

  return d;
}
