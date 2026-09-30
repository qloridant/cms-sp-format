<script>
  import { uid } from "./xml.js";
  let { owner } = $props();

  const add = () => {
    if (!owner.liens) owner.liens = [];
    owner.liens.push({ id: uid(), url: "", label: "" });
  };
  const remove = (i) => owner.liens.splice(i, 1);
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= owner.liens.length) return;
    const t = owner.liens[i];
    owner.liens[i] = owner.liens[j];
    owner.liens[j] = t;
  }
  const bad = (u) => u.trim() && !/^(https?:\/\/|mailto:|tel:)/i.test(u.trim());
  const liens = $derived(owner.liens ?? []);
</script>

<div class="lhead">
  <span class="tag">Liens{liens.length ? ` (${liens.length})` : ""}</span>
  <button class="mini" onclick={add}>+ Ajouter un lien</button>
</div>
{#each liens as l, i (l.id)}
  <div class="lrow">
    <input class="inp" class:err={bad(l.url)} placeholder="https://…" bind:value={l.url} aria-label="URL du lien" />
    <input class="inp" placeholder="Libellé (optionnel)" bind:value={l.label} aria-label="Libellé du lien" />
    <div class="btns">
      <button class="mini sq" disabled={i === 0} onclick={() => move(i, -1)}>↑</button>
      <button class="mini sq" disabled={i === liens.length - 1} onclick={() => move(i, 1)}>↓</button>
      <button class="mini sq danger" onclick={() => remove(i)}>✕</button>
    </div>
  </div>
  {#if bad(l.url)}<div class="hint">L'URL doit commencer par http://, https://, mailto: ou tel:</div>{/if}
{/each}
{#if liens.length === 1}
  <div class="hint">Un seul lien : dans l'aperçu, l'élément entier est cliquable. À partir de deux liens, il ouvre une page de liens.</div>
{/if}

<style>
  .lhead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .tag { font-size: 12px; font-weight: 700; color: var(--gris); }
  .lrow { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; flex-wrap: wrap; }
  .lrow .inp { flex: 1 1 160px; min-width: 0; }
  .mini.sq { padding: 3px 8px; }
  .err { border-color: #ce0500; }
  .hint { font-size: 12px; color: var(--gris); margin-bottom: 6px; }
</style>
