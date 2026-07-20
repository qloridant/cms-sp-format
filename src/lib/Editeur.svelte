<script>
  import {
    DOC, PUB_TYPES, ACTU_TYPES, DEM_TYPES, OPERATEURS, SELF_ZONES, AUTO_SURTITRE,
    buildXml, computeVars, paragraphes, uid,
  } from "./xml.js";
  import Inline from "./Inline.svelte";
  import BlocList from "./BlocList.svelte";
  import BlocPreview from "./BlocPreview.svelte";
  import QuestionnaireEditor from "./QuestionnaireEditor.svelte";
  import { parseXml } from "./parse.js";
  import { validate } from "./validate.js";

  let d = $state({
    docType: "publication",
    id: "F12345", pubType: "Fiche d'information", actuType: "bref", demType: "Téléservice",
    statut: "", dateModif: "", spUrl: "", datePremiere: "", dateMaj: "",
    titre: "Demander une carte nationale d'identité",
    description: "Comment faire la demande, les pièces à fournir et les délais.",
    contributor: "",
    surTitre: "Papiers - Citoyenneté",
    illusKind: "aucune", illusSrc: "", illusLegende: "", illusAlt: "", illusFournisseur: "youTube",
    intro: "La carte d'identité est **gratuite** lors d'une première demande.",
    chapitres: [{ cid: uid(), titre: "Pièces à fournir", blocs: [
      { id: uid(), kind: "liste", style: "puce", texte: "Photo d'identité récente\nJustificatif de domicile" },
      { id: uid(), kind: "asavoir", titre: "", texte: "La pré-demande en ligne fait gagner du temps au guichet." },
    ] }],
    conclusionTitre: "", conclusion: "",
    echBorne: "", echOperateur: "avantle", echDate: "", echDebut: "", echFin: "", echTexte: "",
    numeroCerfa: "", cout: "", nbEtapes: "",
    self: { etapes: [], documents: [], delai: [], recours: [] },
    questionnaire: {
      description: "Répondez à ces questions pour adapter la fiche à votre situation.",
      questions: [
        { qid: uid(), titre: "Êtes-vous majeur ?", choix: [
          { chid: uid(), titre: "Oui", affect: [{ var: "estMajeur", val: "vrai" }] },
          { chid: uid(), titre: "Non", affect: [{ var: "estMajeur", val: "faux" }] },
        ] },
      ],
    },
  });

  let vue = $state("apercu");
  let answers = $state({});
  let surTitreAuto = $state(false);

  const cfg = $derived(DOC[d.docType]);
  const xml = $derived(buildXml(d));

  // Surtitre auto : recopie le libellé du type dans d.surTitre quand activé.
  $effect(() => {
    if (surTitreAuto) d.surTitre = AUTO_SURTITRE[d.docType] || "";
  });
  const vars = $derived(computeVars(d.questionnaire, answers));
  const varNames = $derived.by(() => {
    const s = new Set();
    d.questionnaire.questions.forEach((qu) => qu.choix.forEach((c) => (c.affect || []).forEach((a) => a.var.trim() && s.add(a.var))));
    return [...s];
  });
  const statutLabel = $derived(
    d.statut === "enCoursDeMiseAJour" ? "En cours de mise à jour"
    : d.statut === "miseAJourAVenir" ? "Mise à jour à venir" : ""
  );
  const issues = $derived(validate(xml));
  const errors = $derived(issues.filter((i) => i.level === "error").length);
  const warns = $derived(issues.filter((i) => i.level === "warn").length);
  let showIssues = $state(false);

  function onImport(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        d = parseXml(String(reader.result));
        answers = {};
      } catch (err) {
        alert("Import impossible : " + (err?.message || err));
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  }

  const addChap = () => d.chapitres.push({ cid: uid(), titre: "", blocs: [] });
  const rmChap = (ci) => d.chapitres.splice(ci, 1);

  function telecharger() {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (d.id || cfg.root) + ".xml";
    a.click();
    URL.revokeObjectURL(url);
  }

  const illusOptions = $derived(
    cfg.illus === "imageVideo" ? [["aucune", "Aucune"], ["image", "Image"], ["video", "Vidéo"]]
    : [["aucune", "Aucune"], ["image", "Image"]]
  );
</script>

<datalist id="ef-vars">{#each varNames as v}<option value={v}></option>{/each}</datalist>

<header class="topbar">
  <div class="logo">SP</div>
  <div class="brand">Éditeur de contenu</div>
  <div class="hint">Rédigez à gauche · aperçu et export à droite</div>
  <div class="types">
    {#each Object.entries(DOC) as [k, c]}
      <button class="mini" class:on={d.docType === k} onclick={() => (d.docType = k)}>{c.label}</button>
    {/each}
  </div>
</header>

<div class="grid">
  <!-- ÉDITEUR -->
  <main class="editor">
    <section class="card">
      <div class="card-head"><h2>Type et métadonnées</h2></div>

      {#if d.docType === "publication"}
        <label class="field"><span class="lbl">Type de fiche</span>
          <select class="inp" bind:value={d.pubType}>{#each PUB_TYPES as t}<option>{t}</option>{/each}</select></label>
      {:else if cfg.fixedType}
        <label class="field"><span class="lbl">Type</span>
          <input class="inp ro" value={cfg.fixedType} readonly /></label>
      {:else if d.docType === "actualite"}
        <label class="field"><span class="lbl">Type d'actualité</span>
          <select class="inp" bind:value={d.actuType}>{#each ACTU_TYPES as t}<option>{t}</option>{/each}</select></label>
      {:else if d.docType === "demarche"}
        <label class="field"><span class="lbl">Type de service</span>
          <select class="inp" bind:value={d.demType}>{#each DEM_TYPES as t}<option>{t}</option>{/each}</select></label>
      {/if}

      <div class="row">
        <label class="field"><span class="lbl">Identifiant</span><input class="inp" bind:value={d.id} /></label>
        {#if cfg.root === "Publication" || cfg.root === "ServiceComplementaire"}
          <label class="field"><span class="lbl">Statut</span>
            <select class="inp" bind:value={d.statut}>
              <option value="">Publiée</option>
              <option value="enCoursDeMiseAJour">En cours de mise à jour</option>
              {#if cfg.root === "Publication"}<option value="miseAJourAVenir">Mise à jour à venir</option>{/if}
            </select></label>
        {/if}
      </div>

      <label class="field"><span class="lbl">Titre</span><span class="hint">Grand titre de la page.</span><input class="inp" bind:value={d.titre} /></label>
      <label class="field"><span class="lbl">Description</span><span class="hint">Résumé court (référencement, partage).</span>
        <textarea class="inp" bind:value={d.description}></textarea></label>
      <label class="field"><span class="lbl">Contributeur</span><span class="hint">Organisme ou personne ayant contribué (dc:contributor).</span>
        <input class="inp" bind:value={d.contributor} /></label>
      <label class="field">
        <span class="lbl">Surtitre</span>
        <span class="hint">
          <label class="auto"><input type="checkbox" bind:checked={surTitreAuto} /> Générer depuis le type ({AUTO_SURTITRE[d.docType]})</label>
        </span>
        <input class="inp" bind:value={d.surTitre} disabled={surTitreAuto} />
      </label>

      {#if d.docType === "actualite"}
        <div class="row">
          <label class="field"><span class="lbl">1re mise en ligne</span><input type="date" class="inp" bind:value={d.datePremiere} /></label>
          <label class="field"><span class="lbl">Mise à jour</span><input type="date" class="inp" bind:value={d.dateMaj} /></label>
        </div>
      {/if}
    </section>

    {#if cfg.illus !== "aucune"}
      <section class="card">
        <div class="card-head"><h2>Illustration</h2></div>
        <div class="btns mb">
          {#each illusOptions as [v, l]}
            <button class="mini" class:on={d.illusKind === v} onclick={() => (d.illusKind = v)}>{l}</button>
          {/each}
        </div>
        {#if d.illusKind !== "aucune"}
          <label class="field"><span class="lbl">{d.illusKind === "image" ? "Référence / URL de l'image" : "URL de la vidéo"}</span>
            <input class="inp" bind:value={d.illusSrc} /></label>
          {#if d.illusKind === "video"}
            <label class="field"><span class="lbl">Fournisseur</span><span class="hint">youTube, dailyMotion, vimeo, ina</span>
              <input class="inp" bind:value={d.illusFournisseur} /></label>
          {/if}
          <label class="field"><span class="lbl">Légende</span><input class="inp" bind:value={d.illusLegende} /></label>
          {#if d.illusKind === "image"}
            <label class="field"><span class="lbl">Texte de remplacement</span><span class="hint">Accessibilité.</span>
              <input class="inp" bind:value={d.illusAlt} /></label>
          {/if}
        {/if}
      </section>
    {/if}

    {#if cfg.echeance}
      <section class="card">
        <div class="card-head"><h2>Échéance</h2></div>
        <div class="btns mb">
          {#each [["", "Aucune"], ["fixe", "Date fixe"], ["periode", "Période"]] as [v, l]}
            <button class="mini" class:on={d.echBorne === v} onclick={() => (d.echBorne = v)}>{l}</button>
          {/each}
        </div>
        {#if d.echBorne === "fixe"}
          <div class="row">
            <label class="field"><span class="lbl">Opérateur</span>
              <select class="inp" bind:value={d.echOperateur}>{#each Object.entries(OPERATEURS) as [v, l]}<option value={v}>{l}</option>{/each}</select></label>
            <label class="field"><span class="lbl">Date</span><input type="date" class="inp" bind:value={d.echDate} /></label>
          </div>
        {:else if d.echBorne === "periode"}
          <div class="row">
            <label class="field"><span class="lbl">Du</span><input type="date" class="inp" bind:value={d.echDebut} /></label>
            <label class="field"><span class="lbl">Au</span><input type="date" class="inp" bind:value={d.echFin} /></label>
          </div>
        {/if}
        {#if d.echBorne}
          <label class="field"><span class="lbl">Texte affiché (facultatif)</span><input class="inp" bind:value={d.echTexte} /></label>
        {/if}
      </section>
    {/if}

    {#if cfg.self}
      <section class="card">
        <div class="card-head"><h2>Caractéristiques de la démarche</h2></div>
        <div class="row">
          <label class="field"><span class="lbl">Numéro Cerfa</span><input class="inp" bind:value={d.numeroCerfa} /></label>
          <label class="field"><span class="lbl">Nombre d'étapes</span><input class="inp" bind:value={d.nbEtapes} /></label>
        </div>
        <label class="field"><span class="lbl">Coût</span><input class="inp" placeholder="ex. Gratuit" bind:value={d.cout} /></label>
      </section>
    {/if}

    <section class="card">
      <div class="card-head"><h2>Introduction</h2></div>
      <textarea class="inp tall" placeholder="Texte d'introduction.  **gras**  *italique*  [lien](https://…)" bind:value={d.intro}></textarea>
    </section>

    {#if cfg.conditions}
      <QuestionnaireEditor questionnaire={d.questionnaire} />
    {/if}

    {#each d.chapitres as c, ci (c.cid)}
      <section class="card">
        <div class="card-head">
          <h2>Chapitre {ci + 1}</h2>
          <button class="mini danger" onclick={() => rmChap(ci)}>Supprimer</button>
        </div>
        <label class="field"><span class="lbl">Titre du chapitre</span><input class="inp" bind:value={c.titre} /></label>
        <BlocList blocs={c.blocs} conditionsOn={cfg.conditions} />
      </section>
    {/each}
    <button class="mini on block mb16" onclick={addChap}>+ Ajouter un chapitre</button>

    {#if cfg.self}
      {#each SELF_ZONES as [z, label]}
        <section class="card">
          <div class="card-head"><h2>Comment faire · {label}</h2></div>
          <BlocList blocs={d.self[z]} conditionsOn={false} />
        </section>
      {/each}
    {/if}

    {#if cfg.conclusion}
      <section class="card">
        <div class="card-head"><h2>Conclusion</h2></div>
        <label class="field"><span class="lbl">Titre (facultatif)</span><input class="inp" bind:value={d.conclusionTitre} /></label>
        <textarea class="inp" bind:value={d.conclusion}></textarea>
      </section>
    {/if}
  </main>

  <!-- APERÇU / XML -->
  <aside class="preview" class:dark={vue === "xml"}>
    <div class="ptop">
      <div class="btns">
        <button class="mini" class:on={vue === "apercu"} onclick={() => (vue = "apercu")}>Aperçu</button>
        <button class="mini" class:on={vue === "xml"} onclick={() => (vue = "xml")}>XML</button>
      </div>
      <button
        class="mini status"
        class:ok={errors === 0 && warns === 0}
        class:err={errors > 0}
        class:warn={errors === 0 && warns > 0}
        onclick={() => (showIssues = !showIssues)}
        title="Détail de la validation"
      >
        {#if errors > 0}✕ {errors} erreur{errors > 1 ? "s" : ""}
        {:else if warns > 0}⚠ {warns} alerte{warns > 1 ? "s" : ""}
        {:else}✓ Bien formé{/if}
      </button>
      <div class="ptop-actions">
        <label class="mini imp">Importer<input type="file" accept=".xml,application/xml" onchange={onImport} hidden /></label>
        <button class="mini dl" onclick={telecharger}>Télécharger</button>
      </div>
    </div>

    {#if showIssues}
      <div class="issues">
        {#if issues.length === 0}
          <div class="issue ok">Aucun problème détecté (document bien formé).</div>
        {:else}
          {#each issues as it}
            <div class="issue {it.level}">{it.level === "error" ? "✕" : "⚠"} {it.msg}</div>
          {/each}
        {/if}
        <div class="issue-note">Contrôle local (bonne formation + structure). La validation XSD complète se fait via le script fourni — voir README.</div>
      </div>
    {/if}

    <div class="pbody">
      {#if vue === "apercu"}
        <article class="article">
          {#if d.surTitre}<div class="surtitre">{d.surTitre}</div>{/if}
          <h1>{d.titre || "Titre"}</h1>

          {#if statutLabel || d.docType === "actualite"}
            <div class="badges">
              {#if statutLabel}<span class="badge orange">{statutLabel}</span>{/if}
              {#if d.docType === "actualite"}<span class="badge bleu">{d.actuType}</span>{/if}
            </div>
          {/if}

          {#if cfg.echeance && d.echBorne}
            <div class="ech">📅 {d.echTexte || (d.echBorne === "fixe" ? `${OPERATEURS[d.echOperateur]} ${d.echDate || "…"}` : `du ${d.echDebut || "…"} au ${d.echFin || "…"}`)}</div>
          {/if}

          {#if d.illusKind === "image" && d.illusSrc}
            <figure><img src={d.illusSrc} alt={d.illusAlt} />{#if d.illusLegende}<figcaption>{d.illusLegende}</figcaption>{/if}</figure>
          {:else if d.illusKind === "video" && d.illusSrc}
            <div class="video">▶ Vidéo · {d.illusFournisseur}<br /><span class="brk">{d.illusSrc}</span></div>
          {/if}

          {#if cfg.self && (d.numeroCerfa || d.cout || d.nbEtapes)}
            <div class="chips">
              {#if d.cout}<div class="chip"><div class="ck">Coût</div><div class="cv">{d.cout}</div></div>{/if}
              {#if d.nbEtapes}<div class="chip"><div class="ck">Étapes</div><div class="cv">{d.nbEtapes}</div></div>{/if}
              {#if d.numeroCerfa}<div class="chip"><div class="ck">Cerfa</div><div class="cv">{d.numeroCerfa}</div></div>{/if}
            </div>
          {/if}

          {#if d.intro.trim()}
            <div class="chapo">{#each paragraphes(d.intro) as p}<p><Inline text={p} /></p>{/each}</div>
          {/if}

          {#if cfg.conditions && d.questionnaire.questions.some((qu) => qu.titre.trim())}
            <div class="qbox">
              {#if d.questionnaire.description.trim()}<p class="qdesc">{d.questionnaire.description}</p>{/if}
              {#each d.questionnaire.questions.filter((qu) => qu.titre.trim()) as qu (qu.qid)}
                <div class="qrow">
                  <div class="qtitle"><Inline text={qu.titre} /></div>
                  <div class="btns">
                    {#each qu.choix.filter((c) => c.titre.trim()) as c (c.chid)}
                      <button class="mini" class:on={answers[qu.qid] === c.chid} onclick={() => (answers[qu.qid] = c.chid)}>{c.titre}</button>
                    {/each}
                  </div>
                </div>
              {/each}
              {#if Object.keys(vars).length}
                <div class="qvars">Variables : {Object.entries(vars).map(([k, v]) => `${k}=${v ? "vrai" : "faux"}`).join(" · ")}</div>
              {/if}
            </div>
          {/if}

          {#each d.chapitres as c (c.cid)}
            <section class="chapter">
              {#if c.titre.trim()}<h2><Inline text={c.titre} /></h2>{/if}
              {#each c.blocs as b (b.id)}<BlocPreview bloc={b} vars={cfg.conditions ? vars : null} />{/each}
            </section>
          {/each}

          {#if cfg.self && SELF_ZONES.some(([z]) => d.self[z].length)}
            <section class="chapter">
              <h2>Comment faire ?</h2>
              {#each SELF_ZONES.filter(([z]) => d.self[z].length) as [z, label]}
                <div class="selfzone">
                  <h3>{label}</h3>
                  {#each d.self[z] as b (b.id)}<BlocPreview bloc={b} />{/each}
                </div>
              {/each}
            </section>
          {/if}

          {#if cfg.conclusion && d.conclusion.trim()}
            <section class="concl">
              {#if d.conclusionTitre.trim()}<h2><Inline text={d.conclusionTitre} /></h2>{/if}
              {#each paragraphes(d.conclusion) as p}<p><Inline text={p} /></p>{/each}
            </section>
          {/if}
        </article>
      {:else}
        <pre class="xml">{xml}</pre>
      {/if}
    </div>
  </aside>
</div>

<style>
  .topbar {
    background: var(--blanc); border-bottom: 1px solid var(--bordure);
    padding: 12px 22px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  }
  .logo { width: 32px; height: 32px; background: var(--bleu); color: var(--blanc); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: 800; }
  .brand { font-size: 16px; font-weight: 800; }
  .topbar .hint { font-size: 12px; color: var(--gris); }
  .types { display: flex; gap: 4px; margin-left: auto; flex-wrap: wrap; }

  .grid { display: grid; grid-template-columns: 1fr 1fr; align-items: start; }
  .editor { padding: 22px; max-width: 680px; }
  .ro { background: #e5e5e5; }
  .auto { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; font-weight: 400; }
  .auto input { margin: 0; }
  .mb { margin-bottom: 8px; }
  .mb16 { margin-bottom: 16px; }
  textarea.tall { min-height: 72px; }

  /* aperçu */
  .preview { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; border-left: 1px solid var(--bordure); background: var(--blanc); }
  .preview.dark { background: #1b1b35; }
  .ptop { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--bordure); background: var(--blanc); flex-wrap: wrap; }
  .root { font-size: 12px; color: var(--gris); }
  .ptop-actions { display: flex; gap: 6px; align-items: center; }
  .mini.dl { background: var(--bleu); color: var(--blanc); border-color: var(--bleu); }
  .mini.imp { cursor: pointer; display: inline-flex; align-items: center; }
  .mini.status { font-weight: 700; }
  .mini.status.ok { color: #18753c; border-color: #18753c; background: #f0fdf4; }
  .mini.status.warn { color: #b34000; border-color: #b34000; background: #fff4ed; }
  .mini.status.err { color: var(--rouge); border-color: var(--rouge); background: #fff0f0; }
  .issues { background: #fbfbff; border-bottom: 1px solid var(--bordure); padding: 10px 16px; max-height: 30vh; overflow-y: auto; }
  .issue { font-size: 12px; line-height: 1.5; padding: 3px 0; }
  .issue.error { color: var(--rouge); }
  .issue.warn { color: #b34000; }
  .issue.ok { color: #18753c; }
  .issue-note { font-size: 11px; color: var(--gris); border-top: 1px dashed var(--bordure); margin-top: 6px; padding-top: 6px; }
  .pbody { overflow-y: auto; flex: 1; }

  .article { max-width: 620px; margin: 0 auto; padding: 26px 26px 60px; }
  .surtitre { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--bleu); margin-bottom: 8px; }
  .article h1 { margin: 0 0 8px; font-size: 29px; line-height: 1.15; font-weight: 800; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .badge { font-size: 12px; font-weight: 600; border-radius: 4px; padding: 3px 9px; }
  .badge.orange { color: #b34000; background: #fff4ed; }
  .badge.bleu { color: var(--bleu); background: var(--bleu-clair); }
  .ech { background: #fff4ed; border-left: 4px solid #b34000; border-radius: 0 4px 4px 0; padding: 10px 14px; margin: 0 0 16px; font-weight: 600; font-size: 14px; color: #b34000; }
  figure { margin: 16px 0; }
  figure img { width: 100%; border-radius: 6px; display: block; background: var(--fond); }
  figcaption { font-size: 12px; color: var(--gris); margin-top: 6px; }
  .video { margin: 16px 0; padding: 20px; border: 1px solid var(--bordure); border-radius: 6px; background: var(--fond); font-size: 13px; color: var(--gris); text-align: center; }
  .brk { word-break: break-all; }
  .chips { display: flex; gap: 10px; flex-wrap: wrap; margin: 0 0 18px; }
  .chip { border: 1px solid var(--bordure); border-radius: 6px; padding: 8px 12px; min-width: 80px; }
  .ck { font-size: 11px; color: var(--gris); text-transform: uppercase; letter-spacing: 0.03em; }
  .cv { font-size: 15px; font-weight: 700; }
  .chapo { font-size: 17px; line-height: 1.55; color: #3a3a3a; border-left: 3px solid var(--bleu-clair); padding-left: 14px; margin: 16px 0; }
  .chapo p { margin: 0 0 10px; }
  .chapter { margin-top: 24px; }
  .chapter > h2 { font-size: 21px; font-weight: 700; margin: 0 0 12px; padding-bottom: 6px; border-bottom: 2px solid var(--bleu); }
  .selfzone { margin-bottom: 18px; }
  .selfzone h3 { font-size: 16px; font-weight: 700; margin: 0 0 8px; color: var(--bleu); }
  .concl { margin-top: 26px; background: var(--fond); border-radius: 6px; padding: 18px 20px; }
  .concl h2 { font-size: 18px; font-weight: 700; margin: 0 0 10px; }
  .concl p { margin: 0 0 10px; line-height: 1.6; }

  .qbox { border: 1px solid var(--bleu-clair); border-radius: 6px; padding: 16px 18px; margin: 18px 0; background: #fbfbff; }
  .qdesc { margin: 0 0 14px; font-size: 14px; color: var(--gris); }
  .qrow { margin-bottom: 14px; }
  .qtitle { font-weight: 700; font-size: 15px; margin-bottom: 8px; }
  .qvars { font-size: 11px; color: var(--gris); border-top: 1px dashed var(--bordure); padding-top: 8px; margin-top: 4px; }

  .xml { margin: 0; padding: 18px; font-family: var(--mono); font-size: 12px; line-height: 1.6; color: #e8e8ff; white-space: pre-wrap; word-break: break-word; }

  @media (max-width: 900px) {
    .grid { grid-template-columns: 1fr; }
    .preview { position: static; height: auto; }
  }
</style>
