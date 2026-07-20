<script>
  import { ENCADRES, SELF_TYPES } from "./xml.js";

  let { bloc, conditionsOn = false, first = false, last = false, onremove, onmove } = $props();

  const def = $derived(ENCADRES[bloc.kind]);
  const accent = $derived(def ? def.accent : "var(--bleu)");
  const titre = $derived(
    bloc.kind === "paragraphe" ? "Paragraphe"
    : bloc.kind === "soustitre" ? "Sous-titre"
    : bloc.kind === "liste" ? "Liste"
    : bloc.kind === "demarche" ? "Lien vers une démarche"
    : def ? `Encadré · ${def.label}` : "Bloc"
  );
</script>

<div class="bloc" style="border-left-color:{accent}">
  <div class="head">
    <span class="kind">{titre}</span>
    <div class="btns">
      <button class="mini sq" disabled={first} onclick={() => onmove(-1)}>↑</button>
      <button class="mini sq" disabled={last} onclick={() => onmove(1)}>↓</button>
      <button class="mini sq danger" onclick={onremove}>✕</button>
    </div>
  </div>

  {#if def}
    <input class="inp mb" placeholder="Titre de l'encadré (facultatif)" bind:value={bloc.titre} />
  {/if}

  {#if bloc.kind === "demarche"}
    <input class="inp mb" placeholder="Intitulé du lien (ex. Faire la demande en ligne)" bind:value={bloc.titre} />
    <div class="row mb">
      <select class="inp" bind:value={bloc.selfType}>
        {#each SELF_TYPES as t}<option>{t}</option>{/each}
      </select>
      <input class="inp idfield" placeholder="ID (R…)" bind:value={bloc.refId} />
    </div>
    <input class="inp" placeholder="URL (facultatif)" bind:value={bloc.url} />
  {:else if bloc.kind === "soustitre"}
    <input class="inp" placeholder="Sous-titre (TitreFlottant)" bind:value={bloc.texte} />
  {:else if bloc.kind === "liste"}
    <div class="btns mb">
      <button class="mini" class:on={bloc.style !== "numero"} onclick={() => (bloc.style = "puce")}>Puces</button>
      <button class="mini" class:on={bloc.style === "numero"} onclick={() => (bloc.style = "numero")}>Numéros</button>
    </div>
    <textarea class="inp" placeholder="Un élément par ligne" bind:value={bloc.texte}></textarea>
  {:else}
    <textarea class="inp" placeholder="Texte.  **gras**  *italique*  [lien externe](https://…)  [lien interne](#F12345)" bind:value={bloc.texte}></textarea>
  {/if}

  {#if conditionsOn}
    <div class="cond">
      <span>Afficher si</span>
      <input list="ef-vars" class="inp var" placeholder="variable" bind:value={bloc.condVar} />
      <select class="inp val" bind:value={bloc.condVal}>
        <option value="vrai">= vrai</option>
        <option value="faux">= faux</option>
      </select>
    </div>
  {/if}
</div>

<style>
  .bloc {
    border: 1px solid var(--bordure); border-left: 3px solid var(--bleu);
    border-radius: 4px; padding: 10px 12px; margin-bottom: 10px; background: #fafafa;
  }
  .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .kind { font-size: 12px; font-weight: 700; color: var(--gris); }
  .mini.sq { padding: 3px 8px; }
  .mb { margin-bottom: 8px; }
  .idfield { max-width: 110px; }
  .cond {
    display: flex; gap: 8px; align-items: center; margin-top: 8px; padding-top: 8px;
    border-top: 1px dashed var(--bordure); font-size: 12px; color: var(--gris);
  }
  .cond .var { max-width: 150px; }
  .cond .val { max-width: 90px; }
</style>
