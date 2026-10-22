import type { Constellation, Tool } from '@polaris/contracts';
import { CATEGORY_SEEDS } from './catalog.config.js';

/**
 * Star-chart layout.
 *
 * Positions are computed once, here, and written into `tools.x` and `tools.y`.
 * Nothing recalculates them at runtime: the browser only draws what it is
 * given, which keeps the chart identical on every device and in every replay.
 *
 * The layout is a deterministic force relaxation: category hubs are placed on
 * an ellipse, tools are seeded in a spiral around their hub, and then a few
 * hundred relaxation steps push overlapping stars apart while a spring pulls
 * each star back toward its constellation.
 */

export const VIEWPORT_WIDTH = 1000;
export const VIEWPORT_HEIGHT = 700;

const MARGIN = 58;
const HUB_RADIUS_X = 330;
const HUB_RADIUS_Y = 235;
const CENTER_X = VIEWPORT_WIDTH / 2;
const CENTER_Y = VIEWPORT_HEIGHT / 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Deterministic PRNG so the layout is byte-stable across runs and machines. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Point {
  x: number;
  y: number;
}

export interface LayoutResult {
  tools: Tool[];
  constellations: Constellation[];
}

/**
 * Lay out the catalog. Returns tools with `x` and `y` filled in, plus the
 * constellation hubs.
 */
export function layoutCatalog(tools: Tool[]): LayoutResult {
  const random = mulberry32(0x9e3779b9);

  const hubs = new Map<string, Point>();
  CATEGORY_SEEDS.forEach((category, index) => {
    const angle = (index / CATEGORY_SEEDS.length) * Math.PI * 2 - Math.PI / 2;
    hubs.set(category.id, {
      x: CENTER_X + Math.cos(angle) * HUB_RADIUS_X,
      y: CENTER_Y + Math.sin(angle) * HUB_RADIUS_Y,
    });
  });

  const points = new Map<string, Point>();
  const perCategoryIndex = new Map<string, number>();

  for (const tool of tools) {
    const hub = hubs.get(tool.category);
    if (!hub) continue;
    const index = perCategoryIndex.get(tool.category) ?? 0;
    perCategoryIndex.set(tool.category, index + 1);

    const angle = index * GOLDEN_ANGLE;
    const radius = 46 + random() * 74;
    points.set(tool.id, {
      x: hub.x + Math.cos(angle) * radius,
      y: hub.y + Math.sin(angle) * radius,
    });
  }

  relax(points, hubs, tools, 220);

  const laidOut = tools.map((tool) => {
    const point = points.get(tool.id) ?? { x: CENTER_X, y: CENTER_Y };
    return { ...tool, x: round(point.x), y: round(point.y) };
  });

  const constellations: Constellation[] = CATEGORY_SEEDS.map((category) => {
    const hub = hubs.get(category.id) ?? { x: CENTER_X, y: CENTER_Y };
    return {
      id: category.id,
      name: category.name,
      descriptor: category.descriptor,
      toolsCount: tools.filter((t) => t.category === category.id).length,
      hubCoordinates: { x: round(hub.x), y: round(hub.y) },
    };
  });

  return { tools: laidOut, constellations };
}

function relax(
  points: Map<string, Point>,
  hubs: Map<string, Point>,
  tools: Tool[],
  iterations: number,
): void {
  const ids = tools.map((t) => t.id);
  const minDistance = 13;

  for (let step = 0; step < iterations; step += 1) {
    const forces = new Map<string, Point>();
    for (const id of ids) {
      forces.set(id, { x: 0, y: 0 });
    }

    // Repulsion between every pair of stars.
    for (let i = 0; i < ids.length; i += 1) {
      const a = points.get(ids[i]!);
      if (!a) continue;
      for (let j = i + 1; j < ids.length; j += 1) {
        const b = points.get(ids[j]!);
        if (!b) continue;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let distSq = dx * dx + dy * dy;
        if (distSq < 0.0001) {
          dx = (i % 7) - 3;
          dy = (j % 5) - 2;
          distSq = dx * dx + dy * dy + 0.01;
        }
        const dist = Math.sqrt(distSq);
        if (dist >= minDistance) continue;
        const push = ((minDistance - dist) / dist) * 0.5;
        const fa = forces.get(ids[i]!)!;
        const fb = forces.get(ids[j]!)!;
        fa.x += dx * push;
        fa.y += dy * push;
        fb.x -= dx * push;
        fb.y -= dy * push;
      }
    }

    // Spring back toward the constellation hub, and a gentle pull to the centre.
    for (const tool of tools) {
      const point = points.get(tool.id);
      const force = forces.get(tool.id);
      const hub = hubs.get(tool.category);
      if (!point || !force || !hub) continue;
      force.x += (hub.x - point.x) * 0.035;
      force.y += (hub.y - point.y) * 0.035;
      force.x += (CENTER_X - point.x) * 0.004;
      force.y += (CENTER_Y - point.y) * 0.004;
      point.x += force.x;
      point.y += force.y;
    }
  }

  // Normalise into the viewport with a margin.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const id of ids) {
    const p = points.get(id)!;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const scale = Math.min((VIEWPORT_WIDTH - 2 * MARGIN) / spanX, (VIEWPORT_HEIGHT - 2 * MARGIN) / spanY);

  for (const id of ids) {
    const p = points.get(id)!;
    p.x = MARGIN + (p.x - minX) * scale;
    p.y = MARGIN + (p.y - minY) * scale;
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
