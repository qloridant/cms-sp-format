# Éditeur de contenu service-public

Éditeur web (Svelte 5 + Vite) pour rédiger des publications, actualités et
démarches, avec aperçu en direct et export XML conforme au schéma.

## Lancer en local

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # génère dist/ (statique, déployable partout)
```

## Saisie : mise en forme et blocs

Dans les zones de texte : `**gras**`, `*italique*`, `[lien externe](https://…)` et
`[lien interne](#F12345)` (le `#` suivi de l'identifiant de la publication cible).

Types de blocs : paragraphe, **sous-titre** (`TitreFlottant`), liste, encadrés
(À savoir / Attention / À noter / Exemple / Rappel), lien vers une démarche, et
**sous-bloc conditionnel** : un conteneur où l'on définit une condition qui
s'applique à tous les éléments qu'il contient (on peut y mettre un sous-titre en
tête). Une condition peut porter sur **plusieurs variables**, combinées en **ET**
(toutes vraies). Le surtitre peut être généré automatiquement depuis le type de document.

**Recherche guidée (questionnaire).** Le questionnaire est exporté comme un **document
XML séparé** de type `Publication type="Recherche guidée"`, contenant l'arbre
`Problematiques`/`Branche`. La fiche « Comment faire si conditionné » le **référence**
via `<RechercheGuidee ID="…">`. Chaque réponse rend des variables vraies
(`affecteVrai`) ; les blocs de la fiche les testent (`estVrai`, combinées en **ET**).
Il n'existe que `estVrai` : une condition « faux » n'est jamais produite.

Dans le panneau de droite (vue XML), un sélecteur **Fiche / Recherche guidée** permet de
voir chaque document ; le bouton **Télécharger les 2 fichiers** exporte les deux
(`{id}.xml` et `{rgId}.xml`). Une question peut n'apparaître qu'une fois certaines
variables satisfaites (affichage progressif dans l'aperçu, non écrit dans le XML — le
schéma ne prévoit pas de condition sur un `Question`).

> **Gérer la complexité des arbres.** Plutôt que de construire un arbre de décision
> profond (dont le nombre de chemins explose), on garde un questionnaire **plat** : des
> questions indépendantes qui posent des **variables booléennes**, et des blocs de la
> fiche conditionnés par ces variables (ET). La combinatoire est portée par les variables,
> pas par un arbre à maintenir à la main. Le panneau « Variables définies » et les alertes
> de cohérence (variable testée mais non définie, ou définie mais inutilisée) aident à s'y
> retrouver.

**Aperçu mobile.** Le panneau d'aperçu rend la page dans un cadre de téléphone façon
service-public.gouv.fr (bandeau, fil d'Ariane, étiquette de type, ligne « Vérifié le… »).

> Le type d'un lien interne (`type`, requis par le schéma) est fixé par défaut à
> « Fiche » ; ajuste-le si besoin. Gras et italique sont tous deux sérialisés en
> `MiseEnEvidence` et réimportés en `**gras**`.

## Reprendre un travail (import)

Le bouton **Importer** (barre de l'aperçu) relit un fichier XML précédemment
exporté et reconstruit l'état de l'éditeur. Le format lu est exactement celui
produit par l'outil. Limite connue : gras et italique sont tous deux sérialisés
en `MiseEnEvidence`, donc réimportés en `**gras**`.

## Validation

Deux niveaux.

**Dans le navigateur (immédiat).** Un indicateur dans la barre de l'aperçu signale
en continu : XML bien formé, attributs obligatoires présents (ex. `ID`/`type` pour
une démarche), titre présent, et cohérence des variables conditionnelles (une
variable testée par un fragment doit être définie par le questionnaire). Cliquer
dessus déplie le détail.

**Conformité XSD réelle (hors navigateur).** La validation contre le schéma se fait
avec `scripts/validate.py` (libxml2 via lxml) :

```bash
pip install lxml
python scripts/validate.py chemin/vers/Publication.xsd mon-export.xml
```

> Les `schemaLocation` des XSD service-public ne correspondent pas toujours aux noms
> de fichiers livrés (`commun.hierarchie.xsd` vs `commun_hierarchie.xsd`, sous-dossier
> `librairie/`, `../3.5/…`). Range les fichiers ou ajuste les `schemaLocation` pour que
> chaque `include` pointe sur un fichier existant, sinon le schéma ne se charge pas.

## Déploiement (GitHub Pages via GitHub Actions)

1. Pousse le projet sur un dépôt GitHub (branche `main`).
2. Dans **Settings → Pages**, choisis **Source : GitHub Actions**.
3. Le workflow `.github/workflows/deploy.yml` build et publie à chaque push sur `main`.

Le site sera servi sur `https://<utilisateur>.github.io/<dépôt>/`. La config
`base: "./"` (dans `vite.config.js`) rend les chemins d'assets relatifs, donc rien
à coder en dur. Pour un domaine personnalisé, ajoute un fichier `static`/`public`
`CNAME` ou configure-le dans Settings → Pages.

## Structure

```
src/
├── main.js / App.svelte        point d'entrée
├── app.css                     jetons DSFR + classes partagées
└── lib/
    ├── Editeur.svelte          composant principal (état, formulaire, aperçu)
    ├── xml.js                  sérialisation XML par racine
    ├── parse.js                import XML → état
    ├── validate.js             validation navigateur
    ├── BlocList / BlocEditor / BlocPreview / QuestionnaireEditor / Inline
scripts/validate.py             validation XSD (lxml)
.github/workflows/deploy.yml    déploiement Pages
```
