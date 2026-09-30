<script>
  import Inline from "./Inline.svelte";
  import { termState, itemLinks, safeUrl } from "./xml.js";
  import { FEATURES } from "./features.js";
  import { openLinks } from "./linkpage.svelte.js";

  let { items, vars = null } = $props();

  // Groupes ET-és, termes OU-és au sein d'un groupe. "badge" = condition pas encore
  // tranchée (au moins un terme "unknown", càd une variable pas encore répondue) : on
  // affiche quand même, avec une pastille, pour que la rédaction reste consultable sans
  // avoir tout répondu. estIndefini est toujours tranchable (jamais "unknown").
  function groupes(it) {
    if (!FEATURES.questionnaire) return [];
    return (it.conds || []).map((g) => (g.terms || []).filter((c) => c.var.trim())).filter((t) => t.length);
  }
  function resolved(it) {
    const gs = groupes(it);
    if (!gs.length) return "always";
    let sawUnknown = false;
    for (const terms of gs) {
      const states = terms.map((c) => termState(c, vars));
      if (states.includes("true")) continue; // groupe (OU) vérifié
      if (states.includes("unknown")) sawUnknown = true; // un terme du groupe pas encore tranché
      else return "hide"; // groupe entièrement tranché et aucun terme vérifié
    }
    return sawUnknown ? "badge" : "show";
  }
  const visibles = $derived(items.filter((it) => it.texte.trim() && resolved(it) !== "hide"));
  const termLabel = (c) => c.val === "indefini" ? `${c.var} non renseignée` : `${c.var} = ${c.val || "vrai"}`;
  const condsLabel = (it) => groupes(it)
    .map((terms) => terms.length > 1 ? "(" + terms.map(termLabel).join(" OU ") + ")" : termLabel(terms[0]))
    .join(" ET ");
</script>

<ul class="todo">
  {#each visibles as it (it.id)}
    {@const links = itemLinks(it)}
    <li class="trow" class:cond={resolved(it) === "badge"} class:clic={links.length > 0}>
      {#if links.length === 1}
        {@const l = links[0]}
        <a class="rowlink" href={safeUrl(l.url)} target="_blank" rel="noopener noreferrer">
          <span class="box" aria-hidden="true"></span>
          <span class="txt"><Inline text={it.texte} /></span>
          {#if resolved(it) === "badge"}<span class="badge">si {condsLabel(it)}</span>{/if}
          <span class="arr" aria-hidden="true">↗</span>
        </a>
      {:else if links.length > 1}
        <button class="rowlink" onclick={() => openLinks(it)}>
          <span class="box" aria-hidden="true"></span>
          <span class="txt"><Inline text={it.texte} /></span>
          {#if resolved(it) === "badge"}<span class="badge">si {condsLabel(it)}</span>{/if}
          <span class="nb">{links.length} liens</span>
          <span class="arr" aria-hidden="true">→</span>
        </button>
      {:else}
        <span class="box" aria-hidden="true"></span>
        <span class="txt"><Inline text={it.texte} /></span>
        {#if resolved(it) === "badge"}<span class="badge">si {condsLabel(it)}</span>{/if}
      {/if}
    </li>
  {/each}
</ul>

<style>
  .todo { list-style: none; margin: 0 0 14px; padding: 0; border-top: 1px solid var(--bordure); }
  .trow {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 14px 4px; border-bottom: 1px solid var(--bordure);
  }
  .trow.clic { padding: 0; }
  .rowlink {
    display: flex; align-items: flex-start; gap: 12px; width: 100%; box-sizing: border-box;
    padding: 14px 4px; background: none; border: 0; font: inherit; text-align: left;
    color: inherit; text-decoration: none; cursor: pointer;
  }
  .rowlink:hover { background: #f6f6f6; }
  .rowlink:hover .txt { text-decoration: underline; }
  .arr { flex: 0 0 auto; align-self: center; color: var(--bleu); font-size: 16px; }
  .nb { flex: 0 0 auto; align-self: center; font-size: 12px; color: var(--bleu); }
  .box {
    flex: 0 0 auto; width: 20px; height: 20px; margin-top: 2px;
    border: 2px solid var(--bleu); border-radius: 3px; background: var(--blanc);
  }
  .txt { flex: 1; font-size: 15px; line-height: 1.5; }
  .cond .box { border-color: var(--gris); border-style: dashed; }
  .badge { flex: 0 0 auto; align-self: center; font-size: 11px; color: var(--bleu); border: 1px dashed var(--bleu); border-radius: 4px; padding: 2px 6px; }
</style>
