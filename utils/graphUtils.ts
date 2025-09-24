import type { Side, RectLike } from '@/types/graph';

export type AnchorPoint = { x: number; y: number; side: Side };

const SIDES: Side[] = ['top', 'right', 'bottom', 'left'];

export function anchorsForRect(rect: RectLike): AnchorPoint[] {
  'worklet';
  const width = Number.isFinite(rect.w) ? rect.w : 0;
  const height = Number.isFinite(rect.h) ? rect.h : 0;
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
  out: { x: number; y: number },
  inn: { x: number; y: number },
  parentSide: Side,
  childSide: Side,
) {
  'worklet';
  const points: { x: number; y: number }[] = [];
  const parentHorizontal = parentSide === 'left' || parentSide === 'right';
  const childHorizontal = childSide === 'left' || childSide === 'right';

  if (parentHorizontal && childHorizontal) {
    const midX = (out.x + inn.x) / 2;
    points.push({ x: midX, y: out.y }, { x: midX, y: inn.y });
  } else if (!parentHorizontal && !childHorizontal) {
    const midY = (out.y + inn.y) / 2;
    points.push({ x: out.x, y: midY }, { x: inn.x, y: midY });
  } else {
    const via: { x: number; y: number } = parentHorizontal
      ? { x: inn.x, y: out.y }
      : { x: out.x, y: inn.y };
    points.push(via);
  }

  return points;
}

export function toRoundedSvgPath(points: { x: number; y: number }[], radius = 12) {
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

export function arrowHeadPath(tail: { x: number; y: number }, tip: { x: number; y: number }, length = 16, width = 10) {
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
