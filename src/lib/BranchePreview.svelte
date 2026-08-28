<script>
  import Inline from "./Inline.svelte";
  let { racines } = $props();

  let path = $state([]);

  function nodeAt(p) {
    let level = racines, node = null;
    for (const i of p) {
      node = level[i];
      if (!node) return null;
      level = node.branches || [];
    }
    return node;
  }
  const node = $derived(nodeAt(path));
  const children = $derived(node ? node.branches || [] : racines);
  const trail = $derived(path.map((_, i) => nodeAt(path.slice(0, i + 1))));

  const choose = (i) => (path = [...path, i]);
  const reset = () => (path = []);
</script>

<div class="rg">
  {#if trail.length}
    <div class="fil">
      <button class="crumb" onclick={reset}>Début</button>
      {#each trail as t, i}
        » <button class="crumb" onclick={() => (path = path.slice(0, i + 1))}>{t?.titreChoix || t?.titre || "…"}</button>
      {/each}
    </div>
  {/if}

  {#if node}
    {#if node.titre.trim()}<div class="q"><Inline text={node.titre} /></div>{/if}
    {#if node.kind === "lien"}
      {#if node.lienId?.trim()}
        <a class="leaf" href={"#" + node.lienId} onclick={(e) => e.preventDefault()}>{node.lienTitre || "Voir la fiche"} →</a>
      {:else}
        <div class="empty">Feuille sans fiche liée.</div>
      {/if}
    {/if}
  {:else if !children.length}
    <div class="empty">Arbre vide : ajoutez au moins une branche dans l'éditeur.</div>
  {/if}

  {#if !node || node.kind !== "lien"}
    <div class="choices">
      {#each children as c, i}
        {#if c.titreChoix?.trim() || c.titre?.trim()}
          <button class="mini" onclick={() => choose(i)}>{c.titreChoix || c.titre}</button>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .rg { border: 1px solid var(--bleu-clair); border-radius: 6px; padding: 16px 18px; margin: 18px 0; background: #fbfbff; }
  .fil { font-size: 11px; color: var(--gris); margin-bottom: 10px; }
  .crumb { font: inherit; font-size: 11px; color: var(--bleu-texte); background: none; border: none; padding: 0; cursor: pointer; text-decoration: underline; }
  .q { font-weight: 700; font-size: 15px; margin-bottom: 10px; }
  .choices { display: flex; gap: 8px; flex-wrap: wrap; }
  .leaf { display: inline-block; background: var(--bleu); color: var(--blanc); padding: 8px 14px; border-radius: 4px; font-weight: 600; font-size: 13px; text-decoration: none; }
  .empty { font-size: 12px; color: var(--gris); font-style: italic; }
</style>
