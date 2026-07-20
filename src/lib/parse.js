// Import : reconstruit l'état de l'éditeur à partir d'un XML produit par l'outil.
// Miroir du sérialiseur (xml.js). Le rendu inline gras/italique étant sérialisé
// en <MiseEnEvidence>, il est réimporté en **gras** (l'italique n'est pas distingué).

import { uid } from "./xml.js";

const ENC_REV = { ASavoir: "asavoir", Attention: "attention", ANoter: "anoter", Exemple: "exemple", Rappel: "rappel" };

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

function parseListe(el) {
  const style = el.getAttribute("type") === "numero" ? "numero" : "puce";
  const items = childrenL(el, "Item").map((it) => inline(childL(it, "Paragraphe"))).join("\n");
  return { id: uid(), kind: "liste", style, texte: items };
}
function parseEncadre(el, kind) {
  return { id: uid(), kind, titre: txt(childL(el, "Titre")), texte: parasText(el) };
}
function parseDemarche(el) {
  return {
    id: uid(), kind: "demarche", texte: "",
    titre: txt(childL(el, "Titre")),
    selfType: el.getAttribute("type") || "Téléservice",
    refId: el.getAttribute("ID") || "",
    url: el.getAttribute("URL") || "",
  };
}

function parseBlocs(container) {
  const blocs = [];
  const kids = els(container);
  let i = 0;
  while (i < kids.length) {
    const el = kids[i];
    const n = el.localName;
    if (n === "Titre" || n === "Condition") { i++; continue; }
    if (n === "TitreFlottant") {
      blocs.push({ id: uid(), kind: "soustitre", texte: inline(childL(el, "Paragraphe")) });
      i++; continue;
    }
    if (n === "Paragraphe") {
      const run = [];
      while (i < kids.length && kids[i].localName === "Paragraphe") { run.push(inline(kids[i])); i++; }
      blocs.push({ id: uid(), kind: "paragraphe", texte: run.join("\n\n") });
      continue;
    }
    if (n === "Liste") { blocs.push(parseListe(el)); i++; continue; }
    if (ENC_REV[n]) { blocs.push(parseEncadre(el, ENC_REV[n])); i++; continue; }
    if (n === "ServiceEnLigne") { blocs.push(parseDemarche(el)); i++; continue; }
    if (n === "FragmentConditionne") {
      const cond = childL(el, "Condition");
      let condVar = "", condVal = "vrai";
      if (cond) {
        const v = childL(cond, "estVrai"), f = childL(cond, "estFaux");
        if (v) { condVar = v.getAttribute("var") || ""; condVal = "vrai"; }
        else if (f) { condVar = f.getAttribute("var") || ""; condVal = "faux"; }
      }
      const inner = parseBlocs(el); // ignore la Condition
      if (inner.length === 1) blocs.push({ ...inner[0], condVar, condVal });
      else blocs.push({ id: uid(), kind: "sousbloc", condVar, condVal, blocs: inner });
      i++; continue;
    }
    i++;
  }
  return blocs;
}

function parseChapitres(texteEl) {
  if (!texteEl) return [];
  const chaps = childrenL(texteEl, "Chapitre");
  if (chaps.length) {
    return chaps.map((c) => ({ cid: uid(), titre: titreRiche(childL(c, "Titre")), blocs: parseBlocs(c) }));
  }
  // Texte sans chapitre : on regroupe les blocs dans un chapitre sans titre.
  const blocs = parseBlocs(texteEl);
  return blocs.length ? [{ cid: uid(), titre: "", blocs }] : [];
}

function parseQuestionnaire(qEl) {
  const base = {
    description: txt(childL(childL(qEl, "Description"), "Paragraphe")) || inline(childL(childL(qEl, "Description"), "Paragraphe")),
    questions: [],
  };
  childrenL(qEl, "Question").forEach((qu) => {
    const question = { qid: uid(), titre: titreRiche(childL(qu, "Titre")), choix: [] };
    childrenL(qu, "Choix").forEach((c) => {
      const affect = [];
      const si = childL(c, "SiSelectionne");
      if (si) els(si).forEach((a) => {
        if (a.localName === "affecteVrai") affect.push({ var: a.getAttribute("var") || "", val: "vrai" });
        else if (a.localName === "affecteFaux") affect.push({ var: a.getAttribute("var") || "", val: "faux" });
      });
      question.choix.push({ chid: uid(), titre: titreRiche(childL(c, "Titre")), affect });
    });
    base.questions.push(question);
  });
  return base;
}

function defaults() {
  return {
    docType: "publication", id: "", pubType: "Fiche d'information", actuType: "bref", demType: "Téléservice",
    statut: "", dateModif: "", spUrl: "", datePremiere: "", dateMaj: "",
    titre: "", description: "", surTitre: "", contributor: "",
    illusKind: "aucune", illusSrc: "", illusLegende: "", illusAlt: "", illusFournisseur: "youTube",
    intro: "", chapitres: [], conclusionTitre: "", conclusion: "",
    echBorne: "", echOperateur: "avantle", echDate: "", echDebut: "", echFin: "", echTexte: "",
    numeroCerfa: "", cout: "", nbEtapes: "",
    self: { etapes: [], documents: [], delai: [], recours: [] },
    questionnaire: { description: "", questions: [] },
  };
}

export function parseXml(text) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const perr = doc.querySelector("parsererror");
  if (perr) throw new Error((perr.textContent || "XML mal formé").split("\n")[0]);
  const root = doc.documentElement;
  const name = root.localName;
  const d = defaults();

  // type de document
  const type = root.getAttribute("type") || "";
  if (name === "Actualite") { d.docType = "actualite"; d.actuType = type || "bref"; }
  else if (name === "ServiceComplementaire") { d.docType = "demarche"; d.demType = type || "Téléservice"; }
  else if (name === "Publication") {
    if (childL(root, "Questionnaire") || /conditionn/i.test(type)) d.docType = "cfsc";
    else if (/Comment faire si/i.test(type)) d.docType = "cfs";
    else { d.docType = "publication"; d.pubType = type || "Fiche d'information"; }
  } else {
    throw new Error(`Racine inattendue : <${name}>`);
  }

  // attributs communs
  d.id = root.getAttribute("ID") || "";
  d.statut = root.getAttribute("statut") || "";
  d.dateModif = root.getAttribute("dateDerniereModificationImportante") || "";
  d.spUrl = root.getAttribute("spUrl") || "";
  d.datePremiere = root.getAttribute("datePremiereMiseEnLigne") || "";
  d.dateMaj = root.getAttribute("dateMaj") || "";

  // métadonnées
  d.titre = txt(childL(root, "title"));
  d.description = txt(childL(root, "description"));
  d.contributor = txt(childL(root, "contributor"));
  d.surTitre = txt(childL(root, "SurTitre"));

  // illustration
  const img = childL(root, "ImageIllustration"), vid = childL(root, "VideoIllustration");
  if (img) {
    d.illusKind = "image";
    d.illusSrc = img.getAttribute("LienPublication") || "";
    d.illusLegende = txt(childL(img, "Legende"));
    d.illusAlt = txt(childL(img, "TexteDeRemplacement"));
  } else if (vid) {
    d.illusKind = "video";
    d.illusSrc = vid.getAttribute("URL") || "";
    d.illusFournisseur = vid.getAttribute("fournisseur") || "youTube";
    d.illusLegende = txt(childL(vid, "Legende"));
  }

  // échéance (actualité)
  const ech = childL(root, "Echeance");
  if (ech) {
    d.echBorne = ech.getAttribute("borneTemporelle") || "";
    d.echOperateur = ech.getAttribute("operateur") || "avantle";
    d.echDate = ech.getAttribute("date") || "";
    d.echDebut = ech.getAttribute("dateDebut") || "";
    d.echFin = ech.getAttribute("dateFin") || "";
    d.echTexte = ech.textContent.trim();
  }

  // démarche
  d.numeroCerfa = txt(childL(root, "NumeroCerfa"));
  d.cout = inline(childL(childL(root, "Cout"), "Paragraphe"));
  d.nbEtapes = inline(childL(childL(root, "NbEtapes"), "Paragraphe"));
  const self = childL(root, "CommentFaireSelf");
  if (self) {
    d.self.etapes = parseBlocs(childL(self, "Etapes"));
    d.self.documents = parseBlocs(childL(self, "Documents"));
    d.self.delai = parseBlocs(childL(self, "Delai"));
    d.self.recours = parseBlocs(childL(self, "Recours"));
  }

  // introduction
  const intro = childL(root, "Introduction");
  if (intro) d.intro = parasText(childL(intro, "Texte"));

  // questionnaire
  const q = childL(root, "Questionnaire");
  if (q) d.questionnaire = parseQuestionnaire(q);

  // corps
  d.chapitres = parseChapitres(childL(root, "Texte"));

  // conclusion
  const concl = childL(root, "Conclusion");
  if (concl) {
    d.conclusionTitre = titreRiche(childL(concl, "Titre"));
    d.conclusion = parasText(concl);
  }

  return d;
}
