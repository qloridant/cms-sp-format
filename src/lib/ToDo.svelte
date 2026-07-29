<script>
  import { uid } from "./xml.js";
  let { items } = $props();

  const add = () => items.push({ id: uid(), texte: "", conds: [] });
  const remove = (i) => items.splice(i, 1);
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const t = items[i];
    items[i] = items[j];
    items[j] = t;
  }
  const addCond = (it) => (it.conds ??= []).push({ id: uid(), var: "", val: "vrai" });
  const removeCond = (it, ci) => it.conds.splice(ci, 1);
</script>

{#each items as it, i (it.id)}
  <div class="item">
    <div class="ihead">
      <span class="tag">☐ Élément {i + 1}</span>
      <div class="btns">
        <button class="mini sq" disabled={i === 0} onclick={() => move(i, -1)}>↑</button>
        <button class="mini sq" disabled={i === items.length - 1} onclick={() => move(i, 1)}>↓</button>
        <button class="mini sq danger" onclick={() => remove(i)}>✕</button>
      </div>
    </div>
    <textarea class="inp mb" placeholder="Texte de l'élément.  **gras**  [lien interne](#F12345) [lien externe](https://www.cnmss.fr/)" bind:value={it.texte}></textarea>
    <div class="conds">
      {#each it.conds || [] as c, ci (c.id)}
        <div class="cond">
          <span>{ci === 0 ? "Afficher si" : "ET"}</span>
          <input list="ef-vars" class="inp var" placeholder="variable" bind:value={c.var} />
          <select class="inp val" bind:value={c.val}>
            <option value="vrai">= vrai</option>
            <option value="faux">= faux</option>
          </select>
          <button class="mini sq danger" onclick={() => removeCond(it, ci)}>✕</button>
        </div>
      {/each}
      <button class="mini block" onclick={() => addCond(it)}>+ Ajouter une condition (ET)</button>
    </div>
  </div>
{/each}

<button class="mini on block" onclick={add}>+ Ajouter un élément</button>

<style>
  .item {
    border: 1px solid var(--bordure); border-left: 3px solid var(--bleu);
    border-radius: 4px; padding: 10px 12px; margin-bottom: 10px; background: #fafafa;
  }
  .ihead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .tag { font-size: 12px; font-weight: 700; color: var(--gris); }
  .mini.sq { padding: 3px 8px; }
  .mb { margin-bottom: 8px; }
  .conds {
    margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--bordure);
  }
  .cond {
    display: flex; gap: 8px; align-items: center; font-size: 12px; color: var(--gris);
    flex-wrap: wrap; margin-bottom: 6px;
  }
  .cond span { min-width: 60px; }
  .cond .var { max-width: 150px; }
  .cond .val { max-width: 90px; }
</style>
