import type { Product } from '../api/types';

export interface CompatFix {
  /** Slot à remplacer (categorySlug). */
  slug: string;
  product: Product;
  /** Libellé du bouton, ex. « Remplacer la carte mère par … ». */
  label: string;
}

export interface CompatCheck {
  ok: boolean;
  label: string;
  detail: string;
  /** Explication en langage simple (pour les débutants), présente surtout quand !ok. */
  explain?: string;
  /** Substitut compatible proposé en 1 clic (présent quand !ok et catalogue fourni). */
  fix?: CompatFix;
}

/** Critère de sélection d'un build (défaut Builder + presets). */
export type BuildCriterion = 'budget' | 'balanced' | 'perf';

export type ByCat = Record<string, Product[]>;

function specs(p?: Product): Record<string, string> {
  if (!p?.specs) return {};
  try {
    const o = JSON.parse(p.specs) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)]));
  } catch {
    return {};
  }
}

const num = (v?: string) => {
  const n = parseInt((v ?? '').replace(/[^\d]/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
};

/** Conso estimée d'un build (GPU TDP + ~150 W pour CPU/reste). */
const estimatedDraw = (gpu: Record<string, string>) => num(gpu.Tdp) + 150;
/** Wattage d'alim visé = conso × marge de sécurité. */
const targetWatt = (gpu: Record<string, string>) => estimatedDraw(gpu) * 1.3;

/** Le moins cher d'une liste vérifiant le prédicat (ou undefined). */
function cheapestWhere(list: Product[], pred: (p: Product) => boolean): Product | undefined {
  return list.filter(pred).sort((a, b) => a.price - b.price)[0];
}

function scoreOf(p: Product, kind: BuildCriterion): number {
  if (kind === 'budget') return -p.price;              // le moins cher
  if (kind === 'perf') return p.perfScore;             // le plus performant
  return p.price > 0 ? p.perfScore / p.price : 0;      // meilleur rapport perf/prix
}
function pickBy(list: Product[], kind: BuildCriterion): Product | undefined {
  return [...list].sort((a, b) => scoreOf(b, kind) - scoreOf(a, kind))[0];
}

/**
 * Compose un build COHÉRENT depuis le catalogue (défaut Builder + presets) :
 * CPU ↔ carte mère (même socket), RAM ↔ carte mère (même type), alim ≥ conso GPU.
 * Évite les CPU « orphelins » (socket sans aucune carte mère au catalogue, ex. LGA1200).
 */
export function buildCoherent(byCat: ByCat, kind: BuildCriterion): Record<string, number> {
  const sel: Record<string, number> = {};
  const cpus = byCat['cpu'] ?? [];
  const mobos = byCat['carte-mere'] ?? [];
  const moboSockets = new Set(mobos.map((m) => specs(m).Socket).filter(Boolean));

  // CPU : le meilleur (selon critère) dont le socket possède au moins une carte mère.
  const cpuCandidates = cpus.filter((c) => moboSockets.has(specs(c).Socket));
  const cpu = pickBy(cpuCandidates.length ? cpuCandidates : cpus, kind);
  if (cpu) sel['cpu'] = cpu.id;
  const cpuSocket = cpu ? specs(cpu).Socket : undefined;

  // Carte mère au socket du CPU.
  const mobo = pickBy(mobos.filter((m) => !cpuSocket || specs(m).Socket === cpuSocket), kind) ?? pickBy(mobos, kind);
  if (mobo) sel['carte-mere'] = mobo.id;
  const moboRam = mobo ? specs(mobo).Ram : undefined;

  // RAM du type de la carte mère.
  const rams = byCat['ram'] ?? [];
  const ram = pickBy(rams.filter((r) => !moboRam || specs(r).Type === moboRam), kind) ?? pickBy(rams, kind);
  if (ram) sel['ram'] = ram.id;

  // GPU.
  const gpu = pickBy(byCat['gpu'] ?? [], kind);
  if (gpu) sel['gpu'] = gpu.id;

  // Alim couvrant la conso du GPU (sinon la plus puissante).
  const psus = byCat['alimentation'] ?? [];
  const need = gpu ? targetWatt(specs(gpu)) : 0;
  const psu = pickBy(psus.filter((p) => num(specs(p).Wattage) >= need), kind)
    ?? [...psus].sort((a, b) => num(specs(b).Wattage) - num(specs(a).Wattage))[0];
  if (psu) sel['alimentation'] = psu.id;

  // Stockage + boîtier (indépendants).
  for (const slug of ['stockage', 'boitier']) {
    const pick = pickBy(byCat[slug] ?? [], kind);
    if (pick) sel[slug] = pick.id;
  }
  return sel;
}

/**
 * Rend une sélection existante compatible en GARDANT le CPU et le GPU choisis
 * (les pièces « perf » qui comptent pour l'utilisateur) et en ré-alignant les pièces
 * support : carte mère (socket du CPU), RAM (type carte mère), alim (conso GPU).
 */
export function coherentFrom(current: Record<string, number>, byCat: ByCat): Record<string, number> {
  const find = (slug: string, id?: number) => (byCat[slug] ?? []).find((p) => p.id === id);
  const next = { ...current };

  const cpu = find('cpu', current['cpu']);
  const mobos = byCat['carte-mere'] ?? [];
  if (cpu) {
    const cpuSocket = specs(cpu).Socket;
    const mobo = cheapestWhere(mobos, (m) => specs(m).Socket === cpuSocket);
    if (mobo) {
      next['carte-mere'] = mobo.id;
    } else {
      // Pas de carte mère pour ce socket (CPU orphelin) → on change plutôt le CPU.
      const anyMobo = cheapestWhere(mobos, () => true);
      if (anyMobo) {
        next['carte-mere'] = anyMobo.id;
        const newCpu = cheapestWhere(byCat['cpu'] ?? [], (c) => specs(c).Socket === specs(anyMobo).Socket);
        if (newCpu) next['cpu'] = newCpu.id;
      }
    }
  }

  const mobo = find('carte-mere', next['carte-mere']);
  if (mobo) {
    const moboRam = specs(mobo).Ram;
    const ram = cheapestWhere(byCat['ram'] ?? [], (r) => specs(r).Type === moboRam);
    if (ram) next['ram'] = ram.id;
  }

  const gpu = find('gpu', current['gpu']);
  if (gpu) {
    const need = targetWatt(specs(gpu));
    const psus = byCat['alimentation'] ?? [];
    const psu = cheapestWhere(psus, (p) => num(specs(p).Wattage) >= need)
      ?? [...psus].sort((a, b) => num(specs(b).Wattage) - num(specs(a).Wattage))[0];
    if (psu) next['alimentation'] = psu.id;
  }
  return next;
}

/**
 * Vérifie la cohérence d'un build (modèle assumé) : socket CPU↔carte mère, type RAM↔carte mère,
 * puissance alim vs conso estimée. Quand `byCat` est fourni, chaque incompatibilité inclut une
 * **explication débutant** (`explain`) et un **substitut compatible** (`fix`) applicable en 1 clic.
 * On ne renvoie un check que si les composants concernés sont sélectionnés.
 */
export function checkCompatibility(parts: Product[], byCat?: ByCat): CompatCheck[] {
  const by = (slug: string) => parts.find((p) => p.categorySlug === slug);
  const cpuP = by('cpu');
  const mbP = by('carte-mere');
  const gpuP = by('gpu');
  const cpu = specs(cpuP);
  const mb = specs(mbP);
  const ram = specs(by('ram'));
  const gpu = specs(gpuP);
  const psu = specs(by('alimentation'));

  const checks: CompatCheck[] = [];

  if (cpu.Socket && mb.Socket) {
    const ok = cpu.Socket === mb.Socket;
    const check: CompatCheck = {
      ok,
      label: 'Socket CPU / carte mère',
      detail: ok ? `${cpu.Socket} ✓` : `CPU ${cpu.Socket} ≠ carte mère ${mb.Socket}`,
    };
    if (!ok) {
      check.explain = `Le processeur et la carte mère doivent avoir le même « socket » (le connecteur) pour s'emboîter. Ici le processeur est en ${cpu.Socket} mais la carte mère en ${mb.Socket}.`;
      if (byCat) {
        // On préfère changer la carte mère (pièce support) pour garder le CPU choisi.
        const mobo = cheapestWhere(byCat['carte-mere'] ?? [], (m) => specs(m).Socket === cpu.Socket);
        if (mobo) {
          check.fix = { slug: 'carte-mere', product: mobo, label: `Prendre la carte mère ${mobo.name} (${cpu.Socket})` };
        } else {
          // Aucune carte mère pour ce socket → on change le CPU pour matcher la carte mère.
          const newCpu = cheapestWhere(byCat['cpu'] ?? [], (c) => specs(c).Socket === mb.Socket);
          if (newCpu) check.fix = { slug: 'cpu', product: newCpu, label: `Prendre le processeur ${newCpu.name} (${mb.Socket})` };
        }
      }
    }
    checks.push(check);
  }

  if (ram.Type && mb.Ram) {
    const ok = ram.Type === mb.Ram;
    const check: CompatCheck = {
      ok,
      label: 'Mémoire / carte mère',
      detail: ok ? `${ram.Type} ✓` : `RAM ${ram.Type} ≠ carte mère ${mb.Ram}`,
    };
    if (!ok) {
      check.explain = `La mémoire (RAM) doit être du même type que la carte mère. Ta carte mère accepte de la ${mb.Ram}, mais la RAM choisie est de la ${ram.Type}.`;
      if (byCat) {
        const newRam = cheapestWhere(byCat['ram'] ?? [], (r) => specs(r).Type === mb.Ram);
        if (newRam) check.fix = { slug: 'ram', product: newRam, label: `Prendre la mémoire ${newRam.name} (${mb.Ram})` };
      }
    }
    checks.push(check);
  }

  if (psu.Wattage && gpu.Tdp) {
    const draw = estimatedDraw(gpu);
    const watt = num(psu.Wattage);
    const need = Math.ceil((draw * 1.3));
    const ok = watt >= need;
    const check: CompatCheck = {
      ok,
      label: 'Alimentation',
      detail: ok ? `${watt} W pour ~${draw} W estimés ✓` : `${watt} W trop juste pour ~${draw} W`,
    };
    if (!ok) {
      check.explain = `L'alimentation doit fournir assez de watts pour la carte graphique, avec une marge de sécurité. Il faut environ ${need} W, mais cette alim n'en fournit que ${watt} W.`;
      if (byCat) {
        const newPsu = cheapestWhere(byCat['alimentation'] ?? [], (p) => num(specs(p).Wattage) >= need);
        if (newPsu) check.fix = { slug: 'alimentation', product: newPsu, label: `Prendre l'alim ${newPsu.name} (${num(specs(newPsu).Wattage)} W)` };
      }
    }
    checks.push(check);
  }

  return checks;
}
