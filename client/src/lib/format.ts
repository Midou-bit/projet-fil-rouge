export const euro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

export const date = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

/** Parse le champ Specs (JSON) d'un produit en paires clé/valeur affichables. */
export function parseSpecs(specs?: string): [string, string][] {
  if (!specs) return [];
  try {
    const obj = JSON.parse(specs) as Record<string, unknown>;
    return Object.entries(obj).map(([k, v]) => [k, String(v)]);
  } catch {
    return [];
  }
}
