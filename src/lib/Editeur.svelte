<script>
  import {
    FICHE_TYPE, AUTO_SURTITRE,
    buildXml, buildRechercheGuidee, computeVars, paragraphes, uid,
  } from "./xml.js";
  import Inline from "./Inline.svelte";
  import ToDo from "./ToDo.svelte";
  import ToDoPreview from "./ToDoPreview.svelte";
  import QuestionnaireEditor from "./QuestionnaireEditor.svelte";
  import BranchePreview from "./BranchePreview.svelte";
  import { parseXml } from "./parse.js";
  import { validate } from "./validate.js";

  let d = $state({
    id: "F12345",
    statut: "", dateModif: "",
    titre: "Demander une carte nationale d'identité",
    description: "Comment faire la demande, les pièces à fournir et les délais.",
    contributor: "",
    surTitre: "Papiers - Citoyenneté",
    intro: "La carte d'identité est **gratuite** lors d'une première demande.",
    questionnaire: {
      mode: "plat",
      description: "Répondez à ces questions pour adapter la fiche à votre situation.",
      questions: [
        { qid: uid(), titre: "Êtes-vous majeur ?", choix: [
          { chid: uid(), titre: "Oui", affect: [{ var: "estMajeur", val: "vrai" }] },
          { chid: uid(), titre: "Non", affect: [{ var: "estMajeur", val: "faux" }] },
        ] },
      ],
      arbre: { rgId: "", titre: "", racines: [] },
    },
    todolists: [
      { cid: uid(), titre: "Pièces à fournir", items: [
        { id: uid(), texte: "Photo d'identité récente", conds: [] },
        { id: uid(), texte: "Justificatif de domicile", conds: [] },
      ] },
    ],
    conclusionTitre: "", conclusion: "",
  });

  let vue = $state("apercu");
  let answers = $state({});
  let surTitreAuto = $state(false);

  const xml = $derived(buildXml(d));
  const xmlRg = $derived(
    d.questionnaire.mode === "arbre" && d.questionnaire.arbre.rgId.trim() ? buildRechercheGuidee(d) : ""
  );

  $effect(() => {
    if (surTitreAuto) d.surTitre = AUTO_SURTITRE;
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

  const addTodolist = () => d.todolists.push({ cid: uid(), titre: "", items: [] });
  const rmTodolist = (ci) => d.todolists.splice(ci, 1);

  function downloadBlob(content, filename) {
    const blob = new Blob([content], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  function telecharger() {
    downloadBlob(xml, (d.id || "Publication") + ".xml");
    if (xmlRg) downloadBlob(xmlRg, (d.questionnaire.arbre.rgId || "RechercheGuidee") + ".xml");
  }
</script>

<datalist id="ef-vars">{#each varNames as v}<option value={v}></option>{/each}</datalist>

<header class="topbar">
  <div class="logo">SP</div>
  <div class="brand">Éditeur de contenu</div>
  <div class="hint">Fiche « Comment faire si conditionné » · rédigez à gauche, aperçu et export à droite</div>
</header>

<div class="grid">
  <!-- ÉDITEUR -->
  <main class="editor">
    <section class="card">
      <div class="card-head"><h2>Type et métadonnées</h2></div>

      <label class="field"><span class="lbl">Type</span>
        <input class="inp ro" value={FICHE_TYPE} readonly /></label>

      <div class="row">
        <label class="field"><span class="lbl">Identifiant</span><input class="inp" bind:value={d.id} /></label>
        <label class="field"><span class="lbl">Statut</span>
          <select class="inp" bind:value={d.statut}>
            <option value="">Publiée</option>
            <option value="enCoursDeMiseAJour">En cours de mise à jour</option>
            <option value="miseAJourAVenir">Mise à jour à venir</option>
          </select></label>
      </div>

      <label class="field"><span class="lbl">Titre</span><span class="hint">Grand titre de la page.</span><input class="inp" bind:value={d.titre} /></label>
      <label class="field"><span class="lbl">Description</span><span class="hint">Résumé court (référencement, partage).</span>
        <textarea class="inp" bind:value={d.description}></textarea></label>
      <label class="field"><span class="lbl">Contributeur</span><span class="hint">Organisme ou personne ayant contribué (dc:contributor).</span>
        <input class="inp" bind:value={d.contributor} /></label>
      <label class="field">
        <span class="lbl">Surtitre</span>
        <span class="hint">
          <label class="auto"><input type="checkbox" bind:checked={surTitreAuto} /> Générer depuis le type ({AUTO_SURTITRE})</label>
        </span>
        <input class="inp" bind:value={d.surTitre} disabled={surTitreAuto} />
      </label>
    </section>

    <section class="card">
      <div class="card-head"><h2>Introduction</h2></div>
      <textarea class="inp tall" placeholder="Texte d'introduction.  **gras**  *italique*  [lien](https://…)" bind:value={d.intro}></textarea>
    </section>

    <QuestionnaireEditor questionnaire={d.questionnaire} />

    {#each d.todolists as c, ci (c.cid)}
      <section class="card">
        <div class="card-head">
          <h2>Todolist</h2>
          <button class="mini danger" onclick={() => rmTodolist(ci)}>Supprimer</button>
        </div>
        <label class="field"><span class="lbl">Titre (facultatif)</span><input class="inp" bind:value={c.titre} /></label>
        <ToDo items={c.items} />
      </section>
    {/each}
    <button class="mini on block mb16" onclick={addTodolist}>+ Ajouter une todolist</button>

    <section class="card">
      <div class="card-head"><h2>Conclusion</h2></div>
      <label class="field"><span class="lbl">Titre (facultatif)</span><input class="inp" bind:value={d.conclusionTitre} /></label>
      <textarea class="inp" bind:value={d.conclusion}></textarea>
    </section>
  </main>

  <!-- APERÇU / XML -->
  <aside class="preview" class:dark={vue !== "apercu"}>
    <div class="ptop">
      <div class="btns">
        <button class="mini" class:on={vue === "apercu"} onclick={() => (vue = "apercu")}>Aperçu</button>
        <button class="mini" class:on={vue === "xml"} onclick={() => (vue = "xml")}>XML fiche</button>
        {#if xmlRg}
          <button class="mini" class:on={vue === "xml-rg"} onclick={() => (vue = "xml-rg")}>XML recherche guidée</button>
        {/if}
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
        <button class="mini dl" onclick={telecharger}>{xmlRg ? "Télécharger les 2 fichiers" : "Télécharger"}</button>
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

          {#if statutLabel}
            <div class="badges"><span class="badge orange">{statutLabel}</span></div>
          {/if}

          {#if d.intro.trim()}
            <div class="chapo">{#each paragraphes(d.intro) as p}<p><Inline text={p} /></p>{/each}</div>
          {/if}

          {#if d.questionnaire.mode === "arbre"}
            <BranchePreview racines={d.questionnaire.arbre.racines} />
          {:else if d.questionnaire.questions.some((qu) => qu.titre.trim())}
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

          {#each d.todolists as c (c.cid)}
            <section class="chapter">
              {#if c.titre.trim()}<h2><Inline text={c.titre} /></h2>{/if}
              <ToDoPreview items={c.items} vars={d.questionnaire.mode === "plat" ? vars : null} />
            </section>
          {/each}

          {#if d.conclusion.trim()}
            <section class="concl">
              {#if d.conclusionTitre.trim()}<h2><Inline text={d.conclusionTitre} /></h2>{/if}
              {#each paragraphes(d.conclusion) as p}<p><Inline text={p} /></p>{/each}
            </section>
          {/if}
        </article>
      {:else if vue === "xml"}
        <pre class="xml">{xml}</pre>
      {:else}
        <pre class="xml">{xmlRg}</pre>
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

  .grid { display: grid; grid-template-columns: 1fr 1fr; align-items: start; }
  .editor { padding: 22px; max-width: 680px; }
  .ro { background: #e5e5e5; }
  .auto { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; font-weight: 400; }
  .auto input { margin: 0; }
  .mb16 { margin-bottom: 16px; }
  textarea.tall { min-height: 72px; }

  /* aperçu */
  .preview { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; border-left: 1px solid var(--bordure); background: var(--blanc); }
  .preview.dark { background: #1b1b35; }
  .ptop { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--bordure); background: var(--blanc); flex-wrap: wrap; }
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
  .chapo { font-size: 17px; line-height: 1.55; color: #3a3a3a; border-left: 3px solid var(--bleu-clair); padding-left: 14px; margin: 16px 0; }
  .chapo p { margin: 0 0 10px; }
  .chapter { margin-top: 24px; }
  .chapter > h2 { font-size: 21px; font-weight: 700; margin: 0 0 12px; padding-bottom: 6px; border-bottom: 2px solid var(--bleu); }
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
