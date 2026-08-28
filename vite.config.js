import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Sur GitHub Pages, le site est servi sous /<nom-du-dépôt>/. Le workflow fixe
// BASE_PATH = "/<repo>/" pour que les chemins d'assets soient absolus et corrects.
// En local, BASE_PATH n'est pas défini → base "/" (npm run dev/build normaux).
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [svelte()],
});