<script>
  import { uid } from "./xml.js";
  let { questionnaire } = $props();

  const addQuestion = () =>
    questionnaire.questions.push({ qid: uid(), titre: "", choix: [{ chid: uid(), titre: "", affect: [] }] });
  const rmQuestion = (qi) => questionnaire.questions.splice(qi, 1);
  const addChoix = (qu) => qu.choix.push({ chid: uid(), titre: "", affect: [] });
  const rmChoix = (qu, ci) => qu.choix.splice(ci, 1);
  const addAffect = (c) => c.affect.push({ var: "", val: "vrai" });
  const rmAffect = (c, ai) => c.affect.splice(ai, 1);
</script>

<section class="card">
  <div class="card-head"><h2>Questionnaire</h2></div>
  <p class="intro">
    Chaque réponse affecte une ou plusieurs variables. Ces variables pilotent les fragments
    conditionnels (réglage « Afficher si… » sur les blocs). Testez le résultat dans l'aperçu.
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
</section>

<style>
  .intro { margin: 0 0 12px; font-size: 12px; color: var(--gris); }
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
  .nogrow { flex: 0 0 auto; }
</style>
