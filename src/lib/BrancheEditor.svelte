<script>
  import { uid } from "./xml.js";
  import BrancheEditor from "./BrancheEditor.svelte";
  let { node, depth = 0, first = false, last = false, onremove = null, onmove = null } = $props();

  const addChild = () =>
    node.branches.push({ bid: uid(), titre: "", titreChoix: "", kind: "noeud", branches: [], lienId: "", lienTitre: "" });
  const rmChild = (i) => node.branches.splice(i, 1);
  function moveChild(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= node.branches.length) return;
    const t = node.branches[i];
    node.branches[i] = node.branches[j];
    node.branches[j] = t;
  }
</script>

<div class="branche">
  <div class="bhead">
    <span class="tag">{depth === 0 ? "Racine" : "Branche"}</span>
    {#if onremove}
      <div class="btns">
        <button class="mini sq" disabled={first} onclick={() => onmove(-1)}>↑</button>
        <button class="mini sq" disabled={last} onclick={() => onmove(1)}>↓</button>
        <button class="mini sq danger" onclick={onremove}>✕</button>
      </div>
    {/if}
  </div>

  {#if depth > 0}
    <input class="inp mb" placeholder="Libellé du choix (bouton proposé par la question précédente)" bind:value={node.titreChoix} />
  {/if}
  <input class="inp mb" placeholder="Question posée à cette étape (facultatif si feuille)" bind:value={node.titre} />

  <div class="btns mb kind">
    <button class="mini" class:on={node.kind !== "lien"} onclick={() => (node.kind = "noeud")}>Continue (nouvelle question)</button>
    <button class="mini" class:on={node.kind === "lien"} onclick={() => (node.kind = "lien")}>Se termine par un lien vers une fiche</button>
  </div>

  {#if node.kind === "lien"}
    <div class="row mb">
      <input class="inp idfield" placeholder="ID de la fiche (ex. F12345)" bind:value={node.lienId} />
      <input class="inp" placeholder="Libellé du lien (ex. Voir la fiche)" bind:value={node.lienTitre} />
    </div>
  {:else}
    <div class="children">
      {#each node.branches as child, i (child.bid)}
        <BrancheEditor
          node={child} depth={depth + 1}
          first={i === 0} last={i === node.branches.length - 1}
          onremove={() => rmChild(i)} onmove={(dir) => moveChild(i, dir)}
        />
      {/each}
      <button class="mini" onclick={addChild}>+ Ajouter un choix</button>
    </div>
  {/if}
</div>

<style>
  .branche {
    border: 1px solid var(--bleu-clair); border-left: 3px solid var(--bleu);
    border-radius: 4px; padding: 12px; margin-bottom: 10px; background: #f7f7ff;
  }
  .bhead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .tag { font-size: 12px; font-weight: 700; color: var(--bleu); }
  .mini.sq { padding: 3px 8px; }
  .mb { margin-bottom: 8px; }
  .kind { font-size: 12px; }
  .idfield { max-width: 160px; }
  .children { padding-left: 12px; border-left: 2px dashed var(--bleu-clair); }
</style>
