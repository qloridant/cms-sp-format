<script>
  import { ADD_BLOCS, ENCADRES, uid } from "./xml.js";
  import BlocEditor from "./BlocEditor.svelte";
  import BlocList from "./BlocList.svelte";

  let { blocs, conditionsOn = false, allowSousbloc = true } = $props();

  function add(kind) {
    const b = { id: uid(), kind, texte: "" };
    if (kind === "liste") b.style = "puce";
    if (kind === "demarche") { b.titre = ""; b.selfType = "Téléservice"; b.refId = ""; b.url = ""; }
    if (kind === "sousbloc") { delete b.texte; b.condVar = ""; b.condVal = "vrai"; b.blocs = []; }
    if (ENCADRES[kind]) b.titre = "";
    blocs.push(b);
  }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= blocs.length) return;
    const t = blocs[i];
    blocs[i] = blocs[j];
    blocs[j] = t;
  }
  const remove = (i) => blocs.splice(i, 1);
</script>

{#each blocs as bloc, i (bloc.id)}
  {#if bloc.kind === "sousbloc"}
    <div class="sousbloc">
      <div class="sb-head">
        <span class="sb-kind">Sous-bloc conditionnel</span>
        <div class="btns">
          <button class="mini sq" disabled={i === 0} onclick={() => move(i, -1)}>↑</button>
          <button class="mini sq" disabled={i === blocs.length - 1} onclick={() => move(i, 1)}>↓</button>
          <button class="mini sq danger" onclick={() => remove(i)}>✕</button>
        </div>
      </div>
      <div class="sb-cond">
        <span>Afficher tout ce bloc si</span>
        <input list="ef-vars" class="inp var" placeholder="variable" bind:value={bloc.condVar} />
        <select class="inp val" bind:value={bloc.condVal}>
          <option value="vrai">= vrai</option>
          <option value="faux">= faux</option>
        </select>
      </div>
      <p class="sb-hint">Astuce : ajoutez un « Sous-titre » en premier élément pour titrer ce bloc.</p>
      <div class="sb-body">
        <BlocList blocs={bloc.blocs} conditionsOn={false} allowSousbloc={false} />
      </div>
    </div>
  {:else}
    <BlocEditor {bloc} {conditionsOn} first={i === 0} last={i === blocs.length - 1}
      onremove={() => remove(i)} onmove={(dir) => move(i, dir)} />
  {/if}
{/each}

<div class="add">
  <span>Ajouter :</span>
  {#each ADD_BLOCS as [k, label]}
    <button class="mini" onclick={() => add(k)}>+ {label}</button>
  {/each}
  {#if allowSousbloc}
    <button class="mini sb-add" onclick={() => add("sousbloc")}>+ Sous-bloc conditionnel</button>
  {/if}
</div>

<style>
  .add { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .add span { font-size: 12px; color: var(--gris); align-self: center; }
  .sb-add { border-color: var(--bleu); color: var(--bleu); font-weight: 700; }
  .sousbloc {
    border: 1px solid var(--bleu-clair); border-left: 3px solid var(--bleu);
    border-radius: 4px; padding: 12px; margin-bottom: 10px; background: #f7f7ff;
  }
  .sb-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .sb-kind { font-size: 12px; font-weight: 700; color: var(--bleu); }
  .sb-cond { display: flex; gap: 8px; align-items: center; font-size: 12px; color: var(--gris); margin-bottom: 6px; flex-wrap: wrap; }
  .sb-cond .var { max-width: 150px; }
  .sb-cond .val { max-width: 90px; }
  .sb-hint { margin: 0 0 10px; font-size: 11px; color: var(--gris); font-style: italic; }
  .sb-body { padding-left: 10px; border-left: 2px dashed var(--bleu-clair); }
</style>
