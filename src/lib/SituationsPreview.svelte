<script>
  import Inline from "./Inline.svelte";
  import ToDoPreview from "./ToDoPreview.svelte";
  import { condVisible } from "./xml.js";
  let { situations, vars = null } = $props();

  const visibles = $derived(
    situations.list.filter((s) => s.titre.trim() && condVisible(s.conds, vars))
  );
  let actif = $state(0);
  $effect(() => { if (actif >= visibles.length) actif = 0; });
  const nonVides = (s) => s.todolists.filter(
    (c) => (c.titre.trim() || c.items.some((it) => it.texte.trim())) && condVisible(c.conds, vars)
  );
</script>

{#if visibles.length}
  <section class="situations">
    {#if situations.affichage === "sequentiel"}
      {#each visibles as s (s.id)}
        <div class="sit-block">
          <h2>{s.titre}</h2>
          {#each nonVides(s) as c (c.cid)}
            {#if c.titre.trim()}<h3><Inline text={c.titre} /></h3>{/if}
            <ToDoPreview items={c.items} {vars} />
          {/each}
        </div>
      {/each}
    {:else}
      <div class="tabs" role="tablist">
        {#each visibles as s, i (s.id)}
          <button class="tab" class:on={i === actif} onclick={() => (actif = i)} role="tab" aria-selected={i === actif}>{s.titre}</button>
        {/each}
      </div>
      {#if visibles[actif]}
        <div class="tab-body">
          {#each nonVides(visibles[actif]) as c (c.cid)}
            {#if c.titre.trim()}<h3><Inline text={c.titre} /></h3>{/if}
            <ToDoPreview items={c.items} {vars} />
          {/each}
        </div>
      {/if}
    {/if}
  </section>
{/if}

<style>
  .situations { margin-top: 26px; }
  .tabs { display: flex; gap: 4px; border-bottom: 2px solid var(--bordure); margin-bottom: 16px; flex-wrap: wrap; }
  .tab {
    font: inherit; font-size: 14px; font-weight: 600; padding: 8px 16px; cursor: pointer;
    background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px;
    color: var(--gris);
  }
  .tab.on { color: var(--bleu); border-bottom-color: var(--bleu); }
  .sit-block { margin-bottom: 24px; }
  .sit-block h2 { font-size: 19px; font-weight: 700; margin: 0 0 10px; }
  .tab-body h3, .sit-block h3 { font-size: 15px; font-weight: 700; margin: 14px 0 8px; }
</style>
