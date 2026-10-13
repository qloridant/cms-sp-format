<script>
  import { uid, stripLinks } from "./xml.js";
  import { FEATURES } from "./features.js";
  import Fold from "./Fold.svelte";
  import CondsEditor from "./CondsEditor.svelte";
  import LiensEditor from "./LiensEditor.svelte";
  let { items } = $props();

  const add = () => items.push({ id: uid(), texte: "", conds: [], liens: [] });
  const insert = (i) => items.splice(i, 0, { id: uid(), texte: "", conds: [], liens: [] });
  const remove = (i) => items.splice(i, 1);

  // Les liens ne s'éditent pas dans le texte : tout « [libellé](url) » saisi ou collé est déplacé dans « Liens ».
  let notes = $state({});
  function onText(it, value) {
    const r = stripLinks(value);
    if (r.liens.length || r.internes) {
      (it.liens ??= []).push(...r.liens.map((l) => ({ id: uid(), ...l })));
      const parts = [];
      if (r.liens.length) parts.push(`${r.liens.length} lien${r.liens.length > 1 ? "s" : ""} déplacé${r.liens.length > 1 ? "s" : ""} dans « Liens »`);
      if (r.internes) parts.push(`${r.internes} lien${r.internes > 1 ? "s" : ""} interne${r.internes > 1 ? "s" : ""} retiré${r.internes > 1 ? "s" : ""} (non pris en charge dans « Liens »)`);
      notes[it.id] = parts.join(" · ");
    } else {
      delete notes[it.id];
    }
    it.texte = r.texte;
  }
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
    <Fold title={`☐ Élément ${i + 1}`} summary={it.texte}>
    {#snippet actions()}
      <div class="btns">
        <button class="mini sq" disabled={i === 0} onclick={() => move(i, -1)}>↑</button>
        <button class="mini sq" disabled={i === items.length - 1} onclick={() => move(i, 1)}>↓</button>
        <button class="mini sq" title="Ajouter un élément au-dessus" onclick={() => insert(i)}>+↑</button>
        <button class="mini sq" title="Ajouter un élément en-dessous" onclick={() => insert(i + 1)}>+↓</button>
        <button class="mini sq danger" onclick={() => remove(i)}>✕</button>
      </div>
    {/snippet}
    <textarea class="inp mb" placeholder="Texte de l'élément.  **gras**  *italique*  — les liens se saisissent dans « Liens » ci-dessous" value={it.texte} oninput={(e) => onText(it, e.currentTarget.value)}></textarea>
    {#if notes[it.id]}<div class="note">{notes[it.id]}</div>{/if}
    <div class="liens">
      <LiensEditor owner={it} />
    </div>
    {#if FEATURES.questionnaire}
      <div class="conds">
        <CondsEditor owner={it} />
      </div>
    {/if}
    </Fold>
  </div>
{/each}

<button class="mini on block" onclick={add}>+ Ajouter un élément</button>

<style>
  .item {
    border: 1px solid var(--bordure); border-left: 3px solid var(--bleu);
    border-radius: 4px; padding: 10px 12px; margin-bottom: 10px; background: #fafafa;
  }
  .mini.sq { padding: 3px 8px; }
  .mb { margin-bottom: 8px; }
  .note { font-size: 12px; color: #b34000; margin: -4px 0 8px; }
  .liens { margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--bordure); }
  .conds {
    margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--bordure);
  }
</style>
