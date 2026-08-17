<script>
  // Bloc réutilisable "Afficher si … ET … (OU …)" — porté par tout objet ayant un
  // tableau `conds` de groupes ET-és ({ id, terms: [{ id, var, val }] }[]), les termes
  // d'un même groupe étant OU-és entre eux. Utilisé par Item, Question, Situation, Chapitre…
  import { uid } from "./xml.js";
  let { owner } = $props();
  const addGroup = () => (owner.conds ??= []).push({ id: uid(), terms: [{ id: uid(), var: "", val: "vrai" }] });
  const addOr = (g) => g.terms.push({ id: uid(), var: "", val: "vrai" });
  function removeTerm(g, ti) {
    g.terms.splice(ti, 1);
    if (!g.terms.length) owner.conds.splice(owner.conds.indexOf(g), 1);
  }
</script>

{#each owner.conds || [] as g, gi (g.id)}
  <div class="group">
    <span class="lbl">{gi === 0 ? "Afficher si" : "ET"}</span>
    <div class="terms">
      {#each g.terms as c, ti (c.id)}
        {#if ti > 0}<span class="or">OU</span>{/if}
        <input list="ef-vars" class="inp var" placeholder="variable" bind:value={c.var} />
        <select class="inp val" bind:value={c.val}>
          <option value="vrai">= vrai</option>
          <option value="faux">= faux</option>
        </select>
        <button class="mini sq danger" onclick={() => removeTerm(g, ti)}>✕</button>
      {/each}
      <button class="mini sm" onclick={() => addOr(g)}>+ OU</button>
    </div>
  </div>
{/each}
<button class="mini block" onclick={addGroup}>+ Ajouter une condition (ET)</button>

<style>
  .group { display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--gris); flex-wrap: wrap; margin-bottom: 6px; }
  .lbl { min-width: 60px; padding-top: 4px; }
  .terms { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .or { font-weight: 700; font-size: 11px; color: var(--bleu); }
  .var { max-width: 150px; }
  .val { max-width: 90px; }
  .mini.sq { padding: 3px 8px; }
  .mini.sm { font-size: 11px; }
</style>
