<script>
  import { uid } from "./xml.js";
  import ToDo from "./ToDo.svelte";
  import CondsEditor from "./CondsEditor.svelte";
  import { FEATURES } from "./features.js";
  import Fold from "./Fold.svelte";
  let { situations } = $props();

  const addSituation = () => situations.list.push({ id: uid(), titre: "", conds: [], todolists: [] });
  const rmSituation = (i) => situations.list.splice(i, 1);
  function moveSituation(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= situations.list.length) return;
    const t = situations.list[i];
    situations.list[i] = situations.list[j];
    situations.list[j] = t;
  }
  const addTodolist = (s) => s.todolists.push({ cid: uid(), titre: "", conds: [], items: [] });
  const rmTodolist = (s, ci) => s.todolists.splice(ci, 1);
</script>

<section class="card">
  <Fold title="Situations" variant="card" summary={`${situations.list.length} situation${situations.list.length > 1 ? "s" : ""}`}>
  <p class="intro">
    Regroupe des todolists par situation de l'usager (ex. « Avant la grossesse » / « Après la
    grossesse »), affichées en onglets. Une situation peut aussi être limitée à une condition
    (mêmes variables que le questionnaire). Le titre d'une situation est un texte brut : pas de
    gras ni de lien.
  </p>

  {#if situations.list.length}
    <div class="btns mb mode">
      <button class="mini" class:on={situations.affichage !== "sequentiel"} onclick={() => (situations.affichage = "onglet")}>Onglets</button>
      <button class="mini" class:on={situations.affichage === "sequentiel"} onclick={() => (situations.affichage = "sequentiel")}>Séquentiel</button>
    </div>
  {/if}

  {#each situations.list as s, si (s.id)}
    <div class="situation">
      <Fold title={`Situation ${si + 1}`} summary={s.titre}>
      {#snippet actions()}
        <div class="btns">
          <button class="mini sq" disabled={si === 0} onclick={() => moveSituation(si, -1)}>↑</button>
          <button class="mini sq" disabled={si === situations.list.length - 1} onclick={() => moveSituation(si, 1)}>↓</button>
          <button class="mini sq danger" onclick={() => rmSituation(si)}>✕</button>
        </div>
      {/snippet}
      <input class="inp mb" placeholder="Titre de la situation (ex. Avant la grossesse)" bind:value={s.titre} />

      {#if FEATURES.questionnaire}
        <div class="conds">
          <CondsEditor owner={s} />
        </div>
      {/if}

      {#each s.todolists as c, ci (c.cid)}
        <div class="todolist">
          <Fold title="Todolist" summary={`${c.titre || "sans titre"} · ${c.items.length} élément${c.items.length > 1 ? "s" : ""}`}>
          {#snippet actions()}
            <button class="mini sq danger" onclick={() => rmTodolist(s, ci)}>✕</button>
          {/snippet}
          <input class="inp mb" placeholder="Titre (facultatif)" bind:value={c.titre} />
          {#if FEATURES.questionnaire}
            <div class="conds">
              <CondsEditor owner={c} />
            </div>
          {/if}
          <ToDo items={c.items} />
          </Fold>
        </div>
      {/each}
      <button class="mini block" onclick={() => addTodolist(s)}>+ Ajouter une todolist</button>
      </Fold>
    </div>
  {/each}

  <button class="mini on block" onclick={addSituation}>+ Ajouter une situation</button>
  </Fold>
</section>

<style>
  .intro { margin: 0 0 12px; font-size: 12px; color: var(--gris); }
  .mode { margin-bottom: 14px; }
  .situation {
    border: 1px solid var(--bordure); border-left: 3px solid var(--bleu);
    border-radius: 4px; padding: 12px; margin-bottom: 12px; background: #fafafa;
  }
  .mb { margin-bottom: 8px; }
  .mini.sq { padding: 3px 8px; }
  .conds { margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed var(--bordure); }
  .todolist { border: 1px solid var(--bordure); border-radius: 4px; padding: 10px; margin-bottom: 8px; background: var(--blanc); }
</style>
