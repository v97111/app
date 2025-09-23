type Side = 'left' | 'right' | 'top' | 'bottom';
type Point = { x: number; y: number };

interface NodeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PortSelection {
  parent: Side;
  child: Side;
}

// Convert side to unit vector
function sideVector(side: Side): Point {
  switch (side) {
    case 'left': return { x: -1, y: 0 };
    case 'right': return { x: 1, y: 0 };
    case 'top': return { x: 0, y: -1 };
    case 'bottom': return { x: 0, y: 1 };
  }
}

// Select port side based on angle with hysteresis
function selectSideFromAngle(dx: number, dy: number, previousSide?: Side): Side {
  const deg = Math.atan2(dy, dx) * 180 / Math.PI;
  
  // Hysteresis: add 10° buffer to prevent flicker
  const buffer = previousSide ? 10 : 0;
  
  if (deg >= (-45 - buffer) && deg <= (45 + buffer)) return 'right';
  if (deg > (45 - buffer) && deg < (135 + buffer)) return 'bottom';
  if (deg <= (-45 + buffer) && deg >= (-135 - buffer)) return 'top';
  return 'left';
}

// Pick optimal ports between parent and child nodes
export function pickPorts(
  parentRect: NodeRect, 
  childRect: NodeRect, 
  options = { xAlign: 24, yAlign: 24 },
  previousPorts?: PortSelection
): PortSelection {
  const parentCenter = { 
    x: parentRect.x + parentRect.width / 2, 
    y: parentRect.y + parentRect.height / 2 
  };
  const childCenter = { 
    x: childRect.x + childRect.width / 2, 
    y: childRect.y + childRect.height / 2 
  };
  
  const dx = childCenter.x - parentCenter.x;
  const dy = childCenter.y - parentCenter.y;

  // Axis-aligned fast paths with tolerance
  if (Math.abs(dx) <= options.xAlign) {
    return dy >= 0 
      ? { parent: 'bottom', child: 'top' } 
      : { parent: 'top', child: 'bottom' };
  }
  
  if (Math.abs(dy) <= options.yAlign) {
    return dx >= 0 
      ? { parent: 'right', child: 'left' } 
      : { parent: 'left', child: 'right' };
  }

  // Angular sectors with hysteresis
  const parentSide = selectSideFromAngle(dx, dy, previousPorts?.parent);
  const opposite: Record<Side, Side> = { 
    left: 'right', 
    right: 'left', 
    top: 'bottom', 
    bottom: 'top' 
  };
  
  return { parent: parentSide, child: opposite[parentSide] };
}

// Get port position on node edge
export function getPortPosition(rect: NodeRect, side: Side): Point {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  
  switch (side) {
    case 'left': return { x: rect.x, y: centerY };
    case 'right': return { x: rect.x + rect.width, y: centerY };
    case 'top': return { x: centerX, y: rect.y };
    case 'bottom': return { x: centerX, y: rect.y + rect.height };
  }
}

// Check if line segment intersects rectangle (with padding)
function lineIntersectsRect(
  start: Point, 
  end: Point, 
  rect: NodeRect, 
  padding = 8
): boolean {
  const expandedRect = {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + 2 * padding,
    height: rect.height + 2 * padding,
  };
  
  // Simple AABB line intersection test
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  
  return !(
    maxX < expandedRect.x ||
    minX > expandedRect.x + expandedRect.width ||
    maxY < expandedRect.y ||
    minY > expandedRect.y + expandedRect.height
  );
}

// Generate orthogonal path with obstacle avoidance
export function createOrthogonalPath(
  parentRect: NodeRect,
  childRect: NodeRect,
  parentSide: Side,
  childSide: Side,
  obstacles: NodeRect[] = [],
  padding = 16
): Point[] {
  const parentAnchor = getPortPosition(parentRect, parentSide);
  const childAnchor = getPortPosition(childRect, childSide);
  
  // Create offset points
  const parentVec = sideVector(parentSide);
  const childVec = sideVector(childSide);
  
  const outPoint: Point = {
    x: parentAnchor.x + parentVec.x * padding,
    y: parentAnchor.y + parentVec.y * padding,
  };
  
  const inPoint: Point = {
    x: childAnchor.x + childVec.x * padding,
    y: childAnchor.y + childVec.y * padding,
  };
  
  const points: Point[] = [parentAnchor, outPoint];
  
  // Determine path type
  const bothHorizontal = (parentSide === 'left' || parentSide === 'right') && 
                        (childSide === 'left' || childSide === 'right');
  const bothVertical = (parentSide === 'top' || parentSide === 'bottom') && 
                      (childSide === 'top' || childSide === 'bottom');
  
  if (bothHorizontal) {
    // Horizontal to horizontal: use midX
    let midX = (outPoint.x + inPoint.x) / 2;
    
    // Check for obstacles and adjust midX if needed
    const testSegment1 = { start: outPoint, end: { x: midX, y: outPoint.y } };
    const testSegment2 = { start: { x: midX, y: outPoint.y }, end: { x: midX, y: inPoint.y } };
    const testSegment3 = { start: { x: midX, y: inPoint.y }, end: inPoint };
    
    for (const obstacle of obstacles) {
      if (obstacle === parentRect || obstacle === childRect) continue;
      
      if (lineIntersectsRect(testSegment2.start, testSegment2.end, obstacle)) {
        // Adjust midX to avoid obstacle
        const obstacleCenter = obstacle.x + obstacle.width / 2;
        const channelWidth = 32;
        midX = obstacleCenter > midX 
          ? obstacle.x - channelWidth 
          : obstacle.x + obstacle.width + channelWidth;
      }
    }
    
    points.push(
      { x: midX, y: outPoint.y },
      { x: midX, y: inPoint.y }
    );
  } else if (bothVertical) {
    // Vertical to vertical: use midY
    let midY = (outPoint.y + inPoint.y) / 2;
    
    // Check for obstacles and adjust midY if needed
    for (const obstacle of obstacles) {
      if (obstacle === parentRect || obstacle === childRect) continue;
      
      const testSegment = { 
        start: { x: outPoint.x, y: midY }, 
        end: { x: inPoint.x, y: midY } 
      };
      
      if (lineIntersectsRect(testSegment.start, testSegment.end, obstacle)) {
        const obstacleCenter = obstacle.y + obstacle.height / 2;
        const channelWidth = 32;
        midY = obstacleCenter > midY 
          ? obstacle.y - channelWidth 
          : obstacle.y + obstacle.height + channelWidth;
      }
    }
    
    points.push(
      { x: outPoint.x, y: midY },
      { x: inPoint.x, y: midY }
    );
  } else {
    // Mixed: choose best L-shape
    const candidateA = { x: outPoint.x, y: inPoint.y };
    const candidateB = { x: inPoint.x, y: outPoint.y };
    
    // Test both candidates for obstacles
    let bestCandidate = candidateA;
    let aIntersects = false;
    let bIntersects = false;
    
    for (const obstacle of obstacles) {
      if (obstacle === parentRect || obstacle === childRect) continue;
      
      if (lineIntersectsRect(outPoint, candidateA, obstacle) ||
          lineIntersectsRect(candidateA, inPoint, obstacle)) {
        aIntersects = true;
      }
      
      if (lineIntersectsRect(outPoint, candidateB, obstacle) ||
          lineIntersectsRect(candidateB, inPoint, obstacle)) {
        bIntersects = true;
      }
    }
    
    // Choose candidate with fewer intersections
    if (bIntersects && !aIntersects) {
      bestCandidate = candidateA;
    } else if (aIntersects && !bIntersects) {
      bestCandidate = candidateB;
    }
    
    points.push(bestCandidate);
  }
  
  points.push(inPoint, childAnchor);
  return points;
}

// Convert points to SVG path with rounded corners
export function pointsToRoundedSvgPath(points: Point[], radius = 12): string {
  if (points.length < 2) return '';
  
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    
    // Calculate vectors
    const v1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    const v2 = { x: p2.x - p1.x, y: p2.y - p1.y };
    
    // Calculate lengths
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    if (len1 === 0 || len2 === 0) {
      path += ` L ${p1.x} ${p1.y}`;
      continue;
    }
    
    // Adjust radius to fit
    const maxRadius = Math.min(radius, len1 / 2, len2 / 2);
    
    if (maxRadius <= 0) {
      path += ` L ${p1.x} ${p1.y}`;
      continue;
    }
    
    // Calculate corner points
    const n1 = { x: v1.x / len1, y: v1.y / len1 };
    const n2 = { x: v2.x / len2, y: v2.y / len2 };
    
    const cornerStart = {
      x: p1.x - n1.x * maxRadius,
      y: p1.y - n1.y * maxRadius,
    };
    
    const cornerEnd = {
      x: p1.x + n2.x * maxRadius,
      y: p1.y + n2.y * maxRadius,
    };
    
    path += ` L ${cornerStart.x} ${cornerStart.y}`;
    path += ` Q ${p1.x} ${p1.y} ${cornerEnd.x} ${cornerEnd.y}`;
  }
  
  // Add final point
  const lastPoint = points[points.length - 1];
  path += ` L ${lastPoint.x} ${lastPoint.y}`;
  
  return path;
}

// Main function to create edge path
export function createEdgePath(
  parentRect: NodeRect,
  childRect: NodeRect,
  obstacles: NodeRect[] = [],
  previousPorts?: PortSelection
): { path: string; ports: PortSelection } {
  const ports = pickPorts(parentRect, childRect, undefined, previousPorts);
  const points = createOrthogonalPath(
    parentRect,
    childRect,
    ports.parent,
    ports.child,
    obstacles
  );
  const path = pointsToRoundedSvgPath(points);
  
  return { path, ports };
}