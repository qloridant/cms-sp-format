// État partagé de l'aperçu : item dont on affiche la « page de liens » (null = liste normale).
export const linkPage = $state({ item: null });
export const openLinks = (item) => { linkPage.item = item; };
export const closeLinks = () => { linkPage.item = null; };
