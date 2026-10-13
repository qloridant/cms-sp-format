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
**sous-bloc conditionnel** : un conteneur où l'on définit **une seule** condition
qui s'applique à tous les éléments qu'il contient (on peut y mettre un sous-titre en
tête). Le surtitre peut être généré automatiquement depuis le type de document.

> Le type d'un lien interne (`type`, requis par le schéma) est fixé par défaut à
> « Fiche » ; ajuste-le si besoin. Gras et italique sont tous deux sérialisés en
> `MiseEnEvidence` et réimportés en `**gras**`.

## Conditions et contenu conditionnel

Todolists, items, questions et situations partagent le même bloc « Afficher si… »
(`CondsEditor`) : des groupes **ET**-és entre eux, chaque groupe pouvant contenir
plusieurs termes **OU**-és (bouton **+ OU**). Un terme teste une variable affectée
par le questionnaire (`Questionnaire → Réponse → définit`), avec trois états :

- **= vrai** / **= faux** : la variable a été affectée à cette valeur ;
- **non renseignée** : la variable n'a **jamais** été affectée, quelle que soit la
  réponse choisie — c'est le cas tant que la personne n'a pas répondu à la question
  qui la définit (ou si aucune des réponses possibles ne la définit).

C'est ce dernier état qui sert à proposer un **contenu de repli générique** :
une todolist conditionnée par `variable = non renseignée` reste affichée tant que
la question associée n'a pas de réponse, et disparaît dès qu'elle en a une.

**Raccourci.** Dans l'éditeur de question, le bouton **+ Contenu si sans réponse**
crée automatiquement une todolist pré-conditionnée sur cet état pour les variables
de la question (en OU, s'il y en a plusieurs) — il ne reste qu'à rédiger les étapes
génériques dedans. Le bouton est inactif (avec message) si la question ne définit
encore aucune variable.

## Interface

Un bandeau de bonnes pratiques rappelle en haut de l'éditeur les points clés de rédaction. Tous les blocs
d'édition (métadonnées, introduction, questionnaire et ses questions, todolists et leurs éléments,
situations, branches, conclusion) sont dépliables : clic sur le titre du bloc, ou **Tout replier / Tout
déplier** dans la barre du haut. Replié, un bloc affiche un résumé (titre, début du texte…). Les champs
gardent leur contenu quand un bloc est replié.

## Feature flag « questionnaire »

Toute la fonctionnalité questionnaire (questionnaire plat / recherche guidée, conditions « Afficher si… »,
suivi des variables) est pilotée par un flag, `src/lib/features.js`. Désactivé, ces blocs disparaissent de
l'éditeur et de l'aperçu, et l'export XML ne contient ni `<Questionnaire>` / `<RechercheGuidee>` ni `<Condition>`.

Ordre de priorité (défaut : **activé**) :
1. paramètre d'URL, sans rebuild : `?ff_questionnaire=off` (ou `on`) ;
2. variable de build : `VITE_FF_QUESTIONNAIRE=false` (fichier `.env`, cf. `.env.example`) ;
3. GitHub Pages : variable de dépôt `FF_QUESTIONNAIRE` (Settings → Secrets and variables → Actions → Variables),
   transmise par le workflow ; vide = valeur par défaut.

Un XML importé contenant un questionnaire ou des conditions est relu, mais ne sera pas ré-exporté tant que le flag est désactivé.

## Liens d'un élément

Chaque élément de todolist peut porter une liste de liens (URL + libellé optionnel), exportée en
`<Item> … <Liens><LienExterne URL="…">libellé</LienExterne>…</Liens></Item>` (extension locale de
`commun.texte.xsd`). Les liens ne se saisissent plus dans le texte de l'élément : un `[libellé](url)` saisi, collé ou importé y est
remplacé par son libellé et déplacé dans la liste (les liens internes `#ID` sont réduits à leur libellé).
Dans l'aperçu : **un seul** lien rend la ligne entière cliquable (nouvel onglet) ; **plusieurs** ouvrent une page de
liens, avec bouton « Retour ».

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
    ├── LiensEditor / LinksPage / linkpage.svelte.js   liens d'un élément
    ├── BlocList / BlocEditor / BlocPreview / QuestionnaireEditor / Inline
scripts/validate.py             validation XSD (lxml)
.github/workflows/deploy.yml    déploiement Pages
```
# cms-sp-format
