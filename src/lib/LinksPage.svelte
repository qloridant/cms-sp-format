<script>
  import Inline from "./Inline.svelte";
  import { itemLinks, safeUrl } from "./xml.js";
  import { closeLinks } from "./linkpage.svelte.js";
  let { item } = $props();
  const links = $derived(itemLinks(item));
</script>

<div class="lpage">
  <button class="back" onclick={closeLinks}>← Retour</button>
  <h1 class="lt"><Inline text={item.texte} /></h1>
  <p class="lsub">{links.length} lien{links.length > 1 ? "s" : ""} associé{links.length > 1 ? "s" : ""}</p>
  <ul class="ll">
    {#each links as l}
      <li>
        <a href={safeUrl(l.url)} target="_blank" rel="noopener noreferrer">
          <span class="lab">{l.label}</span><span class="sub">{l.url}</span><span class="arr" aria-hidden="true">↗</span>
        </a>
      </li>
    {/each}
  </ul>
</div>

<style>
  .back { background: none; border: 0; color: var(--bleu-texte); text-decoration: underline; cursor: pointer; font: inherit; padding: 0; margin-bottom: 16px; }
  .lt { font-size: 22px; margin: 0 0 4px; }
  .lsub { color: var(--gris); font-size: 13px; margin: 0 0 14px; }
  .ll { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--bordure); }
  .ll li { border-bottom: 1px solid var(--bordure); }
  .ll a { display: grid; grid-template-columns: 1fr auto; gap: 2px 12px; padding: 14px 4px; text-decoration: none; color: inherit; }
  .ll a:hover .lab { text-decoration: underline; }
  .lab { color: var(--bleu-texte); font-weight: 600; }
  .sub { grid-column: 1; font-size: 12px; color: var(--gris); overflow-wrap: anywhere; }
  .arr { grid-row: 1 / span 2; grid-column: 2; align-self: center; color: var(--bleu); }
</style>
