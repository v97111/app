import type { Side, RectLike } from '@/types/graph';

export type AnchorPoint = { x: number; y: number; side: Side };
export type Point = { x: number; y: number };

const SIDES: Side[] = ['top', 'right', 'bottom', 'left'];
const EPSILON = 0.001;

const ensureFinite = (value: number) => (Number.isFinite(value) ? value : 0);

const rectWidth = (rect: RectLike) => ensureFinite(rect.w ?? 0);
const rectHeight = (rect: RectLike) => ensureFinite(rect.h ?? 0);

export function anchorsForRect(rect: RectLike): AnchorPoint[] {
  'worklet';
  const width = rectWidth(rect);
  const height = rectHeight(rect);
  const cx = rect.x + width / 2;
  const cy = rect.y + height / 2;

  return [
    { side: 'top', x: cx, y: rect.y },
    { side: 'right', x: rect.x + width, y: cy },
    { side: 'bottom', x: cx, y: rect.y + height },
    { side: 'left', x: rect.x, y: cy },
  ];
}

export function closestAnchorPair(parent: RectLike, child: RectLike) {
  'worklet';
  const parentAnchors = anchorsForRect(parent);
  const childAnchors = anchorsForRect(child);

  let bestParent = parentAnchors[0];
  let bestChild = childAnchors[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < parentAnchors.length; i += 1) {
    const p = parentAnchors[i];
    for (let j = 0; j < childAnchors.length; j += 1) {
      const c = childAnchors[j];
      const dx = c.x - p.x;
      const dy = c.y - p.y;
      const dist = dx * dx + dy * dy;

      if (dist < bestDistance) {
        bestDistance = dist;
        bestParent = p;
        bestChild = c;
      }
    }
  }

  return { parent: bestParent, child: bestChild };
}

export function pickPorts(parent: RectLike, child: RectLike): { parent: Side; child: Side } {
  'worklet';
  const { parent: p, child: c } = closestAnchorPair(parent, child);
  return { parent: p.side, child: c.side };
}

export function sideVec(side: Side) {
  'worklet';
  switch (side) {
    case 'left':
      return { x: -1, y: 0 };
    case 'right':
      return { x: 1, y: 0 };
    case 'top':
      return { x: 0, y: -1 };
    default:
      return { x: 0, y: 1 };
  }
}

export function anchorFromSide(rect: RectLike, side: Side) {
  'worklet';
  return anchorsForRect(rect).find((anchor) => anchor.side === side) ?? {
    side,
    x: rect.x,
    y: rect.y,
  };
}

export function orthogonalWaypoints(
  out: Point,
  inn: Point,
  parentSide: Side,
  childSide: Side,
) {
  'worklet';
  const points: Point[] = [];
  const parentHorizontal = parentSide === 'left' || parentSide === 'right';
  const childHorizontal = childSide === 'left' || childSide === 'right';

  if (parentHorizontal && childHorizontal) {
    const midX = (out.x + inn.x) / 2;
    points.push({ x: midX, y: out.y }, { x: midX, y: inn.y });
  } else if (!parentHorizontal && !childHorizontal) {
    const midY = (out.y + inn.y) / 2;
    points.push({ x: out.x, y: midY }, { x: inn.x, y: midY });
  } else {
    const via: Point = parentHorizontal
      ? { x: inn.x, y: out.y }
      : { x: out.x, y: inn.y };
    points.push(via);
  }

  return points;
}

const pruneRedundant = (points: Point[]) => {
  'worklet';
  if (points.length <= 2) return points;
  const filtered: Point[] = [points[0]];

  for (let i = 1; i < points.length; i += 1) {
    const prev = filtered[filtered.length - 1];
    const curr = points[i];
    if (
      !prev ||
      Math.abs(prev.x - curr.x) > EPSILON ||
      Math.abs(prev.y - curr.y) > EPSILON
    ) {
      filtered.push(curr);
    }
  }

  return filtered;
};

export function toRoundedSvgPath(points: Point[], radius = 12) {
  'worklet';
  if (!points.length) return '';

  let path = `M ${points[0].x} ${points[0].y}`;
  let prevPoint = points[0];

  for (let i = 1; i < points.length; i += 1) {
    const current = points[i];
    const next = points[i + 1];

    if (!next) {
      path += ` L ${current.x} ${current.y}`;
      break;
    }

    const v1x = current.x - prevPoint.x;
    const v1y = current.y - prevPoint.y;
    const v2x = next.x - current.x;
    const v2y = next.y - current.y;
    const len1 = Math.hypot(v1x, v1y) || 1;
    const len2 = Math.hypot(v2x, v2y) || 1;
    const r = Math.min(radius, len1 / 2, len2 / 2);

    const startX = current.x - (v1x / len1) * r;
    const startY = current.y - (v1y / len1) * r;
    const endX = current.x + (v2x / len2) * r;
    const endY = current.y + (v2y / len2) * r;

    path += ` L ${startX} ${startY} Q ${current.x} ${current.y} ${endX} ${endY}`;
    prevPoint = { x: endX, y: endY };
  }

  return path;
}

export function arrowHeadPath(tail: Point, tip: Point, length = 16, width = 10) {
  'worklet';
  const dx = tip.x - tail.x;
  const dy = tip.y - tail.y;
  const segLength = Math.hypot(dx, dy) || 1;
  const ux = dx / segLength;
  const uy = dy / segLength;
  const px = -uy;
  const py = ux;

  const baseX = tip.x - ux * length;
  const baseY = tip.y - uy * length;
  const leftX = baseX + px * (width / 2);
  const leftY = baseY + py * (width / 2);
  const rightX = baseX - px * (width / 2);
  const rightY = baseY - py * (width / 2);

  return `M ${tip.x} ${tip.y} L ${leftX} ${leftY} L ${rightX} ${rightY} Z`;
}

export function isHorizontal(side: Side) {
  'worklet';
  return side === 'left' || side === 'right';
}

export function isVertical(side: Side) {
  'worklet';
  return side === 'top' || side === 'bottom';
}

export function cycleSides(index: number) {
  'worklet';
  const idx = ((index % SIDES.length) + SIDES.length) % SIDES.length;
  return SIDES[idx];
}

export type SideAnchor = { side: Side; anchor: Point };

export interface RoundedPathResult {
  d: string;
  points: Point[];
  from: SideAnchor;
  to: SideAnchor;
}

export interface BezierPathResult {
  d: string;
  from: SideAnchor;
  to: SideAnchor;
  c1: Point;
  c2: Point;
}

export function sideAndAnchor(rectA: RectLike, rectB: RectLike): SideAnchor {
  'worklet';
  const width = rectWidth(rectA);
  const height = rectHeight(rectA);
  const centerA = {
    x: rectA.x + width / 2,
    y: rectA.y + height / 2,
  };
  const centerB = {
    x: rectB.x + rectWidth(rectB) / 2,
    y: rectB.y + rectHeight(rectB) / 2,
  };

  const dx = centerB.x - centerA.x;
  const dy = centerB.y - centerA.y;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);

  let side: Side;
  if (adx > ady) {
    side = dx >= 0 ? 'right' : 'left';
  } else {
    side = dy >= 0 ? 'bottom' : 'top';
  }

  let anchor: Point;
  switch (side) {
    case 'left':
      anchor = { x: rectA.x, y: centerA.y };
      break;
    case 'right':
      anchor = { x: rectA.x + width, y: centerA.y };
      break;
    case 'top':
      anchor = { x: centerA.x, y: rectA.y };
      break;
    default:
      anchor = { x: centerA.x, y: rectA.y + height };
      break;
  }

  return { side, anchor };
}

export function buildRoundedOrthogonalPath(
  from: SideAnchor,
  to: SideAnchor,
  radius = 12,
  padding?: number,
): RoundedPathResult {
  'worklet';
  const effectiveRadius = Math.max(radius, 4);
  const travel = padding ?? Math.max(effectiveRadius * 1.8, 18);

  const fromVec = sideVec(from.side);
  const toVec = sideVec(to.side);

  const out = {
    x: from.anchor.x + fromVec.x * travel,
    y: from.anchor.y + fromVec.y * travel,
  };

  const inn = {
    x: to.anchor.x + toVec.x * travel,
    y: to.anchor.y + toVec.y * travel,
  };

  const middle = orthogonalWaypoints(out, inn, from.side, to.side);
  const rawPoints = [
    { x: from.anchor.x, y: from.anchor.y },
    out,
    ...middle,
    inn,
    { x: to.anchor.x, y: to.anchor.y },
  ];

  const points = pruneRedundant(rawPoints);
  const d = toRoundedSvgPath(points, effectiveRadius);

  return { d, points, from, to };
}

export function edgePathForRects(
  rectA: RectLike,
  rectB: RectLike,
  radius = 12,
  padding?: number,
): RoundedPathResult {
  'worklet';
  const from = sideAndAnchor(rectA, rectB);
  const to = sideAndAnchor(rectB, rectA);
  return buildRoundedOrthogonalPath(from, to, radius, padding);
}

export function bezierPathForRects(
  rectA: RectLike,
  rectB: RectLike,
  curvature = 0.35,
  minStrength = 40,
  maxStrength = 240,
): BezierPathResult {
  'worklet';
  const from = sideAndAnchor(rectA, rectB);
  const to = sideAndAnchor(rectB, rectA);

  const dx = to.anchor.x - from.anchor.x;
  const dy = to.anchor.y - from.anchor.y;
  const distance = Math.hypot(dx, dy);
  const strength = Math.min(Math.max(distance * curvature, minStrength), maxStrength);

  const fromVec = sideVec(from.side);
  const toVec = sideVec(to.side);

  const c1 = {
    x: from.anchor.x + fromVec.x * strength,
    y: from.anchor.y + fromVec.y * strength,
  };

  const c2 = {
    x: to.anchor.x + toVec.x * strength,
    y: to.anchor.y + toVec.y * strength,
  };

  const d = `M ${from.anchor.x} ${from.anchor.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${to.anchor.x} ${to.anchor.y}`;

  return { d, from, to, c1, c2 };
}
