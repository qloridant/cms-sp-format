<script>
  import Inline from "./Inline.svelte";

  let { items, vars = null } = $props();

  // Groupes ET-és, termes OU-és au sein d'un groupe. "badge" = condition pas encore
  // tranchée (au moins une variable pas encore répondue) : on affiche quand même, avec
  // une pastille, pour que la rédaction reste consultable sans avoir tout répondu.
  function groupes(it) {
    return (it.conds || []).map((g) => (g.terms || []).filter((c) => c.var.trim())).filter((t) => t.length);
  }
  function resolved(it) {
    const gs = groupes(it);
    if (!gs.length) return "always";
    let sawUnknown = false;
    for (const terms of gs) {
      const connu = vars ? terms.filter((c) => c.var in vars) : [];
      if (connu.some((c) => vars[c.var] === (c.val !== "faux"))) continue; // groupe (OU) vérifié
      if (connu.length < terms.length) sawUnknown = true; // un terme du groupe pas encore répondu
      else return "hide"; // groupe entièrement connu et aucun terme vérifié
    }
    return sawUnknown ? "badge" : "show";
  }
  const visibles = $derived(items.filter((it) => it.texte.trim() && resolved(it) !== "hide"));
  const condsLabel = (it) => groupes(it)
    .map((terms) => terms.length > 1
      ? "(" + terms.map((c) => `${c.var} = ${c.val || "vrai"}`).join(" OU ") + ")"
      : `${terms[0].var} = ${terms[0].val || "vrai"}`)
    .join(" ET ");
</script>

<ul class="todo">
  {#each visibles as it (it.id)}
    <li class="trow" class:cond={resolved(it) === "badge"}>
      <span class="box" aria-hidden="true"></span>
      <span class="txt"><Inline text={it.texte} /></span>
      {#if resolved(it) === "badge"}<span class="badge">si {condsLabel(it)}</span>{/if}
    </li>
  {/each}
</ul>

<style>
  .todo { list-style: none; margin: 0 0 14px; padding: 0; border-top: 1px solid var(--bordure); }
  .trow {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 14px 4px; border-bottom: 1px solid var(--bordure);
  }
  .box {
    flex: 0 0 auto; width: 20px; height: 20px; margin-top: 2px;
    border: 2px solid var(--bleu); border-radius: 3px; background: var(--blanc);
  }
  .txt { flex: 1; font-size: 15px; line-height: 1.5; }
  .cond .box { border-color: var(--gris); border-style: dashed; }
  .badge { flex: 0 0 auto; align-self: center; font-size: 11px; color: var(--bleu); border: 1px dashed var(--bleu); border-radius: 4px; padding: 2px 6px; }
</style>
