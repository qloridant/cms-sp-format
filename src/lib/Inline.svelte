<script>
  import { tokenize } from "./xml.js";
  let { text = "" } = $props();
</script>

{#each tokenize(text) as tok}{#if tok.t === "bold"}<strong>{tok.v}</strong>{:else if tok.t === "ital"}<em>{tok.v}</em>{:else if tok.t === "link"}<a class="ext" href={tok.url} onclick={(e) => e.preventDefault()}>{tok.v}</a>{:else if tok.t === "linkint"}<a class="int" href={"#" + tok.id} title={"Publication " + tok.id} onclick={(e) => e.preventDefault()}>{tok.v}</a>{:else}{tok.v}{/if}{/each}

<style>
  a { color: var(--bleu-texte); text-decoration: underline; }
  a.ext::after { content: " \2197"; font-size: 0.85em; text-decoration: none; }
  a.int { text-decoration-style: dotted; }
  a.int::after { content: " \2192"; font-size: 0.85em; text-decoration: none; }
</style>
