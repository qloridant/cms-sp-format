<script>
  import { uid } from "./xml.js";
  import { parseRechercheGuidee } from "./parse.js";
  import BrancheEditor from "./BrancheEditor.svelte";
  let { questionnaire } = $props();

  const addQuestion = () =>
    questionnaire.questions.push({ qid: uid(), titre: "", choix: [{ chid: uid(), titre: "", affect: [] }] });
  const rmQuestion = (qi) => questionnaire.questions.splice(qi, 1);
  const addChoix = (qu) => qu.choix.push({ chid: uid(), titre: "", affect: [] });
  const rmChoix = (qu, ci) => qu.choix.splice(ci, 1);
  const addAffect = (c) => c.affect.push({ var: "", val: "vrai" });
  const rmAffect = (c, ai) => c.affect.splice(ai, 1);

  const addRacine = () =>
    questionnaire.arbre.racines.push({ bid: uid(), titre: "", titreChoix: "", kind: "noeud", branches: [], lienId: "", lienTitre: "" });
  const rmRacine = (i) => questionnaire.arbre.racines.splice(i, 1);
  function moveRacine(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= questionnaire.arbre.racines.length) return;
    const t = questionnaire.arbre.racines[i];
    questionnaire.arbre.racines[i] = questionnaire.arbre.racines[j];
    questionnaire.arbre.racines[j] = t;
  }

  function onImportArbre(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        questionnaire.arbre = parseRechercheGuidee(String(reader.result));
        questionnaire.mode = "arbre";
      } catch (err) {
        alert("Import de l'arbre impossible : " + (err?.message || err));
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  }
</script>

<section class="card">
  <div class="card-head"><h2>Questionnaire</h2></div>

  <div class="btns mb mode">
    <button class="mini" class:on={questionnaire.mode !== "arbre"} onclick={() => (questionnaire.mode = "plat")}>Questionnaire plat</button>
    <button class="mini" class:on={questionnaire.mode === "arbre"} onclick={() => (questionnaire.mode = "arbre")}>Recherche guidée (arbre)</button>
  </div>

  {#if questionnaire.mode !== "arbre"}
    <p class="intro">
      Chaque réponse affecte une ou plusieurs variables. Ces variables pilotent l'affichage
      conditionnel des éléments de la todolist (réglage « Afficher si… »). Testez le résultat
      dans l'aperçu.
    </p>

    <label class="field">
      <span class="lbl">Introduction du questionnaire</span>
      <input class="inp" bind:value={questionnaire.description} />
    </label>

    {#each questionnaire.questions as qu, qi (qu.qid)}
      <div class="question">
        <div class="qhead">
          <span class="tag">Question {qi + 1}</span>
          <button class="mini sq danger" onclick={() => rmQuestion(qi)}>✕</button>
        </div>
        <input class="inp mb" placeholder="Intitulé de la question" bind:value={qu.titre} />

        {#each qu.choix as c, ci (c.chid)}
          <div class="choix">
            <div class="row mb">
              <input class="inp" placeholder="Réponse" bind:value={c.titre} />
              <button class="mini danger nogrow" onclick={() => rmChoix(qu, ci)}>✕</button>
            </div>
            {#each c.affect as a, ai}
              <div class="affect">
                <span>définit</span>
                <input class="inp" placeholder="variable" bind:value={a.var} />
                <select class="inp val" bind:value={a.val}>
                  <option value="vrai">= vrai</option>
                  <option value="faux">= faux</option>
                </select>
                <button class="mini sq" onclick={() => rmAffect(c, ai)}>✕</button>
              </div>
            {/each}
            <button class="mini sm" onclick={() => addAffect(c)}>+ variable</button>
          </div>
        {/each}
        <button class="mini" onclick={() => addChoix(qu)}>+ Réponse</button>
      </div>
    {/each}

    <button class="mini on block" onclick={addQuestion}>+ Ajouter une question</button>
  {:else}
    <p class="intro">
      L'arbre est exporté comme un <strong>document XML séparé</strong> (Problematiques/Branche),
      référencé depuis la fiche via <code>&lt;RechercheGuidee ID="…"&gt;</code>. Chaque branche
      pose une question et propose des choix ; une branche se termine soit par de nouveaux choix,
      soit par un lien vers une fiche.
    </p>

    <div class="row mb">
      <label class="field"><span class="lbl">ID du document Recherche guidée</span>
        <input class="inp" placeholder="ex. RG12345" bind:value={questionnaire.arbre.rgId} /></label>
      <label class="field"><span class="lbl">Titre du document (facultatif)</span>
        <input class="inp" bind:value={questionnaire.arbre.titre} /></label>
    </div>

    <label class="mini imp mb">Importer un arbre existant<input type="file" accept=".xml,application/xml" onchange={onImportArbre} hidden /></label>

    {#each questionnaire.arbre.racines as racine, i (racine.bid)}
      <BrancheEditor
        node={racine} depth={0}
        first={i === 0} last={i === questionnaire.arbre.racines.length - 1}
        onremove={() => rmRacine(i)} onmove={(dir) => moveRacine(i, dir)}
      />
    {/each}
    <button class="mini on block" onclick={addRacine}>+ Ajouter une racine</button>
  {/if}
</section>

<style>
  .intro { margin: 0 0 12px; font-size: 12px; color: var(--gris); }
  .mode { margin-bottom: 14px; }
  .question {
    border: 1px solid var(--bordure); border-left: 3px solid var(--bleu);
    border-radius: 4px; padding: 12px; margin-bottom: 12px; background: #fafafa;
  }
  .qhead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .tag { font-size: 12px; font-weight: 700; color: var(--gris); }
  .choix { border: 1px solid var(--bordure); border-radius: 4px; padding: 10px; margin-bottom: 8px; background: var(--blanc); }
  .affect { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
  .affect span { font-size: 12px; color: var(--gris); }
  .affect .val { max-width: 90px; }
  .mb { margin-bottom: 8px; }
  .mini.sq { padding: 3px 8px; }
  .mini.sm { font-size: 11px; }
  .mini.imp { cursor: pointer; display: inline-flex; align-items: center; }
  .nogrow { flex: 0 0 auto; }
</style>
