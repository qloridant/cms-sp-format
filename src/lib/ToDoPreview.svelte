<script>
  import Inline from "./Inline.svelte";

  let { items, vars = null } = $props();

  function resolved(it) {
    const conds = (it.conds || []).filter((c) => c.var.trim());
    if (!conds.length) return "always";
    let sawUnknown = false;
    for (const c of conds) {
      if (vars && c.var in vars) {
        if (vars[c.var] !== (c.val !== "faux")) return "hide";
      } else {
        sawUnknown = true;
      }
    }
    return sawUnknown ? "badge" : "show";
  }
  const visibles = $derived(items.filter((it) => it.texte.trim() && resolved(it) !== "hide"));
  const condsLabel = (it) => (it.conds || []).filter((c) => c.var.trim()).map((c) => `${c.var} = ${c.val || "vrai"}`).join(" ET ");
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
