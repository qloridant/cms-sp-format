<script>
  import { ENCADRES, paragraphes } from "./xml.js";
  import Inline from "./Inline.svelte";
  import BlocPreview from "./BlocPreview.svelte";

  let { bloc, vars = null } = $props();

  const def = $derived(ENCADRES[bloc.kind]);
  const resolved = $derived.by(() => {
    if (!bloc.condVar) return "always";
    if (vars && bloc.condVar in vars) {
      return vars[bloc.condVar] === (bloc.condVal !== "faux") ? "show" : "hide";
    }
    return "badge";
  });
</script>

{#if resolved !== "hide"}
  {#snippet inner()}
    {#if bloc.kind === "paragraphe"}
      {#each paragraphes(bloc.texte) as p}<p><Inline text={p} /></p>{/each}
    {:else if bloc.kind === "soustitre"}
      <h4 class="soustitre"><Inline text={bloc.texte} /></h4>
    {:else if bloc.kind === "sousbloc"}
      <div class="sousbloc-body">
        {#each bloc.blocs as c (c.id)}<BlocPreview bloc={c} {vars} />{/each}
      </div>
    {:else if bloc.kind === "liste"}
      {#if bloc.style === "numero"}
        <ol>{#each bloc.texte.split("\n").map((l) => l.trim()).filter(Boolean) as it}<li><Inline text={it} /></li>{/each}</ol>
      {:else}
        <ul>{#each bloc.texte.split("\n").map((l) => l.trim()).filter(Boolean) as it}<li><Inline text={it} /></li>{/each}</ul>
      {/if}
    {:else if bloc.kind === "demarche"}
      <a class="demarche" href={bloc.url || "#"} onclick={(e) => e.preventDefault()}>{bloc.titre || "Accéder à la démarche"} →</a>
    {:else if def}
      <div class="encadre" style="--accent:{def.accent}; --bg:{def.bg}">
        <div class="label">{bloc.titre || def.label}</div>
        {#each paragraphes(bloc.texte) as p}<p><Inline text={p} /></p>{/each}
      </div>
    {/if}
  {/snippet}

  {#if resolved === "badge"}
    <div class="cond">
      <div class="cond-label">Affiché si {bloc.condVar} = {bloc.condVal || "vrai"}</div>
      {@render inner()}
    </div>
  {:else}
    {@render inner()}
  {/if}
{/if}

<style>
  p { margin: 0 0 12px; line-height: 1.6; }
  ul, ol { margin: 0 0 12px; padding-left: 22px; line-height: 1.6; }
  li { margin-bottom: 4px; }
  .soustitre { font-size: 16px; font-weight: 700; margin: 14px 0 8px; color: var(--texte); }
  .sousbloc-body { display: contents; }
  .demarche {
    display: inline-block; margin: 0 0 14px; background: var(--bleu); color: var(--blanc);
    padding: 10px 18px; border-radius: 4px; font-weight: 600; font-size: 14px; text-decoration: none;
  }
  .encadre {
    background: var(--bg); border-left: 4px solid var(--accent);
    border-radius: 0 4px 4px 0; padding: 12px 16px; margin: 0 0 14px;
  }
  .encadre .label {
    font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
    color: var(--accent); margin-bottom: 6px;
  }
  .encadre p { font-size: 14px; line-height: 1.55; }
  .cond { border: 1px dashed var(--bleu); border-radius: 4px; padding: 8px 10px 1px; margin: 0 0 14px; }
  .cond-label { font-size: 11px; color: var(--bleu); font-weight: 600; margin-bottom: 6px; }
</style>
