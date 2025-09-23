import type { Side, RectLike } from '@/types/graph';

export function sector(dx: number, dy: number): Side {
  'worklet';
  const deg = Math.atan2(dy, dx) * 180 / Math.PI;
  if (deg >= -45 && deg <= 45) return 'right';
  if (deg > 45 && deg < 135) return 'bottom';
  if (deg <= -45 && deg >= -135) return 'top';
  return 'left';
}

export function pickPorts(p: RectLike, c: RectLike, tol = 24): { parent: Side; child: Side } {
  'worklet';
  const pcx = p.x + p.w/2, pcy = p.y + p.h/2;
  const ccx = c.x + c.w/2, ccy = c.y + c.h/2;
  const dx = ccx - pcx, dy = ccy - pcy;
  
  if (Math.abs(dx) <= tol) return { parent: 'bottom', child: 'top' };
  if (Math.abs(dy) <= tol) return { parent: dx > 0 ? 'right' : 'left', child: dx > 0 ? 'left' : 'right' };
  
  const ps = sector(dx, dy);
  const opp: Record<Side, Side> = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };
  return { parent: ps, child: opp[ps] };
}

export function sideVec(s: Side) { 
  'worklet'; 
  return s === 'left' ? {x: -1, y: 0} : s === 'right' ? {x: 1, y: 0} : s === 'top' ? {x: 0, y: -1} : {x: 0, y: 1}; 
}

export function anchorFromSide(r: RectLike, s: Side) {
  'worklet';
  const cx = r.x + r.w/2, cy = r.y + r.h/2;
  if (s === 'left') return { x: r.x, y: cy };
  if (s === 'right') return { x: r.x + r.w, y: cy };
  if (s === 'top') return { x: cx, y: r.y };
  return { x: cx, y: r.y + r.h };
}

// Basic orthogonal path with rounded corners
export function orthogonalWaypoints(
  out: {x: number; y: number},
  inn: {x: number; y: number},
  parentSide: Side,
  childSide: Side
) {
  'worklet';
  const pts: {x: number; y: number}[] = [];
  const bothH = (parentSide === 'left' || parentSide === 'right') && (childSide === 'left' || childSide === 'right');
  const bothV = (parentSide === 'top' || parentSide === 'bottom') && (childSide === 'top' || childSide === 'bottom');

  if (bothH) {
    const midX = (out.x + inn.x) / 2;
    pts.push({ x: midX, y: out.y }, { x: midX, y: inn.y });
  } else if (bothV) {
    const midY = (out.y + inn.y) / 2;
    pts.push({ x: out.x, y: midY }, { x: inn.x, y: midY });
  } else {
    // choose an L that is less likely to cross nodes; start simple
    pts.push({ x: out.x, y: inn.y });
  }

  return pts;
}

export function toRoundedSvgPath(pts: {x: number; y: number}[], r = 10) {
  'worklet';
  if (!pts.length) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i-1];
    const p1 = pts[i];
    const p2 = pts[i+1];
    
    if (!p2) { 
      d += ` L ${p1.x} ${p1.y}`; 
      break; 
    }
    
    const v1x = p1.x - p0.x, v1y = p1.y - p0.y;
    const v2x = p2.x - p1.x, v2y = p2.y - p1.y;
    const rr = Math.min(r, Math.max(Math.abs(v1x) + Math.abs(v1y), 1)/2, Math.max(Math.abs(v2x) + Math.abs(v2y), 1)/2);
    const p1a = { x: p1.x - Math.sign(v1x) * rr, y: p1.y - Math.sign(v1y) * rr };
    const p1b = { x: p1.x + Math.sign(v2x) * rr, y: p1.y + Math.sign(v2y) * rr };
    d += ` L ${p1a.x} ${p1a.y} Q ${p1.x} ${p1.y} ${p1b.x} ${p1b.y}`;
  }
  return d;
}