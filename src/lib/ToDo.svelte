<script>
  import { uid } from "./xml.js";
  import CondsEditor from "./CondsEditor.svelte";
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
      <CondsEditor owner={it} />
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
</style>
