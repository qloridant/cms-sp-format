<script>
  // Récapitulatif des variables du questionnaire : où chacune est définie (affectations
  // des réponses) et où elle est utilisée (conditions "Afficher si…" de tout le document),
  // pour aider le rédacteur à s'y retrouver sans devoir tout relire.
  let { questionnaire, todolists, situations } = $props();

  function pushConds(conds, label, uses) {
    (conds || []).forEach((g) => (g.terms || []).forEach((t) => {
      const v = t.var.trim();
      if (v) (uses[v] ??= []).push(label);
    }));
  }

  const nom = (t, fallback) => (t || "").trim() || fallback;

  const vars = $derived.by(() => {
    const defs = {};
    const uses = {};

    questionnaire.questions.forEach((qu) => {
      const qt = nom(qu.titre, "(question sans titre)");
      pushConds(qu.conds, `Question « ${qt} »`, uses);
      qu.choix.forEach((c) => {
        (c.affect || []).forEach((a) => {
          const v = a.var.trim();
          if (!v) return;
          const ct = nom(c.titre, "(réponse sans titre)");
          (defs[v] ??= []).push(`« ${ct} » (${qt}) → ${a.val === "faux" ? "faux" : "vrai"}`);
        });
      });
    });

    (todolists || []).forEach((c) => {
      const ct = nom(c.titre, "(todolist sans titre)");
      pushConds(c.conds, `Todolist « ${ct} »`, uses);
      (c.items || []).forEach((it) => pushConds(it.conds, `Élément de « ${ct} »`, uses));
    });

    (situations?.list || []).forEach((s) => {
      const st = nom(s.titre, "(situation sans titre)");
      pushConds(s.conds, `Situation « ${st} »`, uses);
      (s.todolists || []).forEach((c) => {
        const ct = nom(c.titre, "(todolist sans titre)");
        pushConds(c.conds, `Todolist « ${ct} » (${st})`, uses);
        (c.items || []).forEach((it) => pushConds(it.conds, `Élément de « ${ct} » (${st})`, uses));
      });
    });

    const names = [...new Set([...Object.keys(defs), ...Object.keys(uses)])].sort();
    return names.map((v) => ({
      v,
      defs: defs[v] || [],
      uses: uses[v] || [],
      status: !defs[v] ? "undefined" : !uses[v] ? "unused" : "ok",
    }));
  });

  const alerts = $derived(vars.filter((x) => x.status !== "ok").length);
  let open = $state(false);
</script>

<section class="card">
  <div class="card-head">
    <h2>Variables</h2>
    <button class="mini status" class:ok={alerts === 0} class:warn={alerts > 0} onclick={() => (open = !open)}>
      {vars.length} variable{vars.length > 1 ? "s" : ""}{alerts > 0 ? ` · ${alerts} à vérifier` : ""}
    </button>
  </div>

  {#if open}
    {#if !vars.length}
      <p class="empty">Aucune variable pour l'instant : elles apparaissent dès qu'une réponse « définit » une variable.</p>
    {:else}
      <ul class="vlist">
        {#each vars as x (x.v)}
          <li class="vrow">
            <div class="vhead">
              <code class="vname">{x.v}</code>
              {#if x.status === "undefined"}<span class="tag err">jamais définie</span>{/if}
              {#if x.status === "unused"}<span class="tag warn">jamais utilisée</span>{/if}
            </div>
            <div class="vdetail">
              <div class="vcol">
                <span class="vlbl">Définie par ({x.defs.length})</span>
                {#if x.defs.length}<ul>{#each x.defs as d}<li>{d}</li>{/each}</ul>{:else}<span class="vnone">—</span>{/if}
              </div>
              <div class="vcol">
                <span class="vlbl">Utilisée par ({x.uses.length})</span>
                {#if x.uses.length}<ul>{#each x.uses as u}<li>{u}</li>{/each}</ul>{:else}<span class="vnone">—</span>{/if}
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</section>

<style>
  .mini.status { font-weight: 700; }
  .mini.status.ok { color: #18753c; border-color: #18753c; background: #f0fdf4; }
  .mini.status.warn { color: #b34000; border-color: #b34000; background: #fff4ed; }
  .empty { font-size: 12px; color: var(--gris); margin: 8px 0 0; }
  .vlist { list-style: none; margin: 10px 0 0; padding: 0; }
  .vrow { border: 1px solid var(--bordure); border-radius: 4px; padding: 8px 10px; margin-bottom: 8px; background: #fafafa; }
  .vhead { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .vname { font-size: 13px; font-weight: 700; }
  .tag { font-size: 10px; font-weight: 700; border-radius: 4px; padding: 2px 6px; text-transform: uppercase; letter-spacing: 0.03em; }
  .tag.err { color: var(--rouge); background: #fff0f0; }
  .tag.warn { color: #b34000; background: #fff4ed; }
  .vdetail { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
  .vcol { flex: 1 1 220px; }
  .vlbl { display: block; font-weight: 600; margin-bottom: 2px; }
  .vdetail ul { margin: 0; padding-left: 16px; }
  .vnone { color: var(--gris); }
</style>
