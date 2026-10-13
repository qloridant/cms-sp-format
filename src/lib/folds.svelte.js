// Commande globale « tout replier / tout déplier » : chaque <Fold> réagit à l'incrément de `tick`.
export const foldCmd = $state({ tick: 0, open: true });
export const foldAll = (open) => { foldCmd.open = open; foldCmd.tick++; };
