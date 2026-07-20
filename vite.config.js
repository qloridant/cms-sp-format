import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// base: "./" → chemins d'assets relatifs, ce qui fonctionne sur GitHub Pages
// (https://<user>.github.io/<repo>/) sans avoir à coder le nom du dépôt.
export default defineConfig({
  base: "./",
  plugins: [svelte()],
});
