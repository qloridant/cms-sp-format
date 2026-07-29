<script>
  import { uid } from "./xml.js";
  let { items } = $props();

  const add = () => items.push({ id: uid(), texte: "", condVar: "", condVal: "vrai" });
  const remove = (i) => items.splice(i, 1);
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const t = items[i];
    items[i] = items[j];
    items[j] = t;
  }
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
    <textarea class="inp mb" placeholder="Texte de l'élément.  **gras**  [lien interne](#F12345)" bind:value={it.texte}></textarea>
    <div class="cond">
      <span>Afficher si</span>
      <input list="ef-vars" class="inp var" placeholder="variable (facultatif)" bind:value={it.condVar} />
      <select class="inp val" bind:value={it.condVal}>
        <option value="vrai">= vrai</option>
        <option value="faux">= faux</option>
      </select>
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
  .cond {
    display: flex; gap: 8px; align-items: center; margin-top: 8px; padding-top: 8px;
    border-top: 1px dashed var(--bordure); font-size: 12px; color: var(--gris); flex-wrap: wrap;
  }
  .cond .var { max-width: 150px; }
  .cond .val { max-width: 90px; }
</style>
