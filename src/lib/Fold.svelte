<script>
  // Bloc d'édition dépliable : en-tête (titre cliquable + résumé quand replié + actions) et corps.
  // Le corps reste monté (simple `hidden`) : l'état des champs n'est jamais perdu en repliant.
  import { foldCmd } from "./folds.svelte.js";
  let { title, summary = "", variant = "sub", open: openInit = true, actions = null, children } = $props();

  let open = $state(openInit);
  let seen = foldCmd.tick;
  $effect(() => {
    if (foldCmd.tick !== seen) { seen = foldCmd.tick; open = foldCmd.open; }
  });
</script>

<div class="fhead" class:card={variant === "card"} class:closed={!open}>
  <button class="ftoggle" onclick={() => (open = !open)} aria-expanded={open} title={open ? "Replier" : "Déplier"}>
    <span class="chev" aria-hidden="true">{open ? "▾" : "▸"}</span>
    <span class="ftitle">{title}</span>
    {#if !open && summary.trim()}<span class="fsum">— {summary.trim()}</span>{/if}
  </button>
  {#if actions}<div class="factions">{@render actions()}</div>{/if}
</div>
<div class="fbody" hidden={!open}>{@render children?.()}</div>

<style>
  .fhead { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; }
  .fhead.closed { margin-bottom: 0; }
  .fhead.card { margin-bottom: 14px; }
  .fhead.card.closed { margin-bottom: 8px; }
  .ftoggle {
    display: flex; align-items: baseline; gap: 6px; min-width: 0; flex: 1;
    background: none; border: 0; padding: 0; font: inherit; text-align: left; cursor: pointer; color: inherit;
  }
  .chev { flex: 0 0 auto; width: 12px; font-size: 12px; color: var(--bleu); }
  .ftitle { flex: 0 0 auto; font-size: 12px; font-weight: 700; color: var(--gris); }
  .card .ftitle { font-size: 15px; color: var(--bleu); }
  .fsum { min-width: 0; font-size: 12px; color: var(--gris); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ftoggle:hover .ftitle { text-decoration: underline; }
  .factions { flex: 0 0 auto; display: flex; gap: 6px; align-items: center; }
</style>
