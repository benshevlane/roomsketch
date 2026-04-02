import { useMemo } from "react";
import { FurnitureItem, Wall, Point, DEFAULT_WALL_THICKNESS } from "../lib/types";

interface MeasurementOverlayProps {
  furniture: FurnitureItem[];
  walls: Wall[];
  gridSize: number;
  zoom: number;
  panOffset: Point;
  showMeasurements: boolean;
  rulerFirstItemId: string | null;
  rulerSecondItemId: string | null;
  width: number;
  height: number;
}

interface AABB {
  x: number;
  y: number;
  w: number;
  h: number;
}

const BLUE = "#2563eb";
const ARROW_SIZE = 6;
const FONT_SIZE = 11;
const BADGE_PAD = 2;
const PROXIMITY_CM = 150; // 1500mm

/** Compute axis-aligned bounding box for a furniture item (handles rotation). */
export function getItemAABB(item: FurnitureItem): AABB {
  if (item.rotation === 0) {
    return { x: item.x, y: item.y, w: item.width, h: item.height };
  }
  const cx = item.x + item.width / 2;
  const cy = item.y + item.height / 2;
  const rad = (item.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hw = item.width / 2;
  const hh = item.height / 2;
  const corners = [
    { x: cx + cos * (-hw) - sin * (-hh), y: cy + sin * (-hw) + cos * (-hh) },
    { x: cx + cos * hw - sin * (-hh), y: cy + sin * hw + cos * (-hh) },
    { x: cx + cos * hw - sin * hh, y: cy + sin * hw + cos * hh },
    { x: cx + cos * (-hw) - sin * hh, y: cy + sin * (-hw) + cos * hh },
  ];
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
}

/** Get the 4 wall polygon edges as line segments (accounting for thickness). */
function getWallEdges(wall: Wall): { p1: Point; p2: Point }[] {
  const halfThick = (wall.thickness || DEFAULT_WALL_THICKNESS) / 2;
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.01) return [];
  const nx = (-dy / len) * halfThick;
  const ny = (dx / len) * halfThick;
  const c1 = { x: wall.start.x + nx, y: wall.start.y + ny };
  const c2 = { x: wall.start.x - nx, y: wall.start.y - ny };
  const c3 = { x: wall.end.x - nx, y: wall.end.y - ny };
  const c4 = { x: wall.end.x + nx, y: wall.end.y + ny };
  return [
    { p1: c1, p2: c4 }, // side A
    { p1: c2, p2: c3 }, // side B
    { p1: c1, p2: c2 }, // start cap
    { p1: c4, p2: c3 }, // end cap
  ];
}

/** Distance from a point to a line segment. Returns distance and closest point. */
function pointToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): { dist: number; closest: Point } {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  if (lenSq < 0.0001) {
    const d = Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
    return { dist: d, closest: { x: ax, y: ay } };
  }
  let t = ((px - ax) * abx + (py - ay) * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  return { dist: Math.sqrt((px - cx) ** 2 + (py - cy) ** 2), closest: { x: cx, y: cy } };
}

/** Compute item-to-wall gap lines. For each item edge, find nearest wall surface. */
function computeItemWallGaps(
  furniture: FurnitureItem[],
  walls: Wall[]
): { x1: number; y1: number; x2: number; y2: number; distCm: number }[] {
  if (walls.length === 0) return [];
  const allWallEdges = walls.flatMap(getWallEdges);
  const results: { x1: number; y1: number; x2: number; y2: number; distCm: number }[] = [];

  for (const item of furniture) {
    const bb = getItemAABB(item);
    // 4 edge midpoints and their outward ray directions
    const edges: { mx: number; my: number; dx: number; dy: number }[] = [
      { mx: bb.x + bb.w / 2, my: bb.y, dx: 0, dy: -1 },           // top edge → up
      { mx: bb.x + bb.w, my: bb.y + bb.h / 2, dx: 1, dy: 0 },     // right edge → right
      { mx: bb.x + bb.w / 2, my: bb.y + bb.h, dx: 0, dy: 1 },     // bottom edge → down
      { mx: bb.x, my: bb.y + bb.h / 2, dx: -1, dy: 0 },           // left edge → left
    ];

    for (const edge of edges) {
      let bestDist = Infinity;
      let bestPoint: Point | null = null;

      for (const seg of allWallEdges) {
        const res = pointToSegment(edge.mx, edge.my, seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y);
        // Only consider walls in the ray direction
        const toWallX = res.closest.x - edge.mx;
        const toWallY = res.closest.y - edge.my;
        const dot = toWallX * edge.dx + toWallY * edge.dy;
        if (dot > 0.1 && res.dist < bestDist) {
          bestDist = res.dist;
          bestPoint = res.closest;
        }
      }

      if (bestPoint && bestDist > 0.5 && bestDist < 2000) {
        results.push({
          x1: edge.mx,
          y1: edge.my,
          x2: bestPoint.x,
          y2: bestPoint.y,
          distCm: bestDist,
        });
      }
    }
  }
  return results;
}

/** Compute item-to-item gap lines for nearby pairs. */
function computeItemItemGaps(
  furniture: FurnitureItem[]
): { x1: number; y1: number; x2: number; y2: number; distCm: number }[] {
  const results: { x1: number; y1: number; x2: number; y2: number; distCm: number }[] = [];
  const bbs = furniture.map((f) => ({ id: f.id, bb: getItemAABB(f) }));

  for (let i = 0; i < bbs.length; i++) {
    for (let j = i + 1; j < bbs.length; j++) {
      const a = bbs[i].bb;
      const b = bbs[j].bb;

      const gapX = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
      const gapY = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));
      const dist = Math.sqrt(gapX ** 2 + gapY ** 2);

      if (dist <= 0 || dist > PROXIMITY_CM) continue;

      // Find connection points on nearest facing edges
      const { x1, y1, x2, y2 } = nearestEdgePoints(a, b);
      results.push({ x1, y1, x2, y2, distCm: dist });
    }
  }
  return results;
}

/** Find the nearest facing edge points between two AABBs. */
function nearestEdgePoints(a: AABB, b: AABB): { x1: number; y1: number; x2: number; y2: number } {
  // Determine overlap ranges
  const overlapX0 = Math.max(a.x, b.x);
  const overlapX1 = Math.min(a.x + a.w, b.x + b.w);
  const overlapY0 = Math.max(a.y, b.y);
  const overlapY1 = Math.min(a.y + a.h, b.y + b.h);

  const hasOverlapX = overlapX0 < overlapX1;
  const hasOverlapY = overlapY0 < overlapY1;

  if (hasOverlapX) {
    // Vertically separated
    const midX = (overlapX0 + overlapX1) / 2;
    if (a.y + a.h <= b.y) {
      return { x1: midX, y1: a.y + a.h, x2: midX, y2: b.y };
    } else {
      return { x1: midX, y1: a.y, x2: midX, y2: b.y + b.h };
    }
  }

  if (hasOverlapY) {
    // Horizontally separated
    const midY = (overlapY0 + overlapY1) / 2;
    if (a.x + a.w <= b.x) {
      return { x1: a.x + a.w, y1: midY, x2: b.x, y2: midY };
    } else {
      return { x1: a.x, y1: midY, x2: b.x + b.w, y2: midY };
    }
  }

  // Diagonal: connect nearest corners
  const aCx = a.x + a.w / 2;
  const aCy = a.y + a.h / 2;
  const bCx = b.x + b.w / 2;
  const bCy = b.y + b.h / 2;
  const x1 = bCx > aCx ? a.x + a.w : a.x;
  const y1 = bCy > aCy ? a.y + a.h : a.y;
  const x2 = bCx > aCx ? b.x : b.x + b.w;
  const y2 = bCy > aCy ? b.y : b.y + b.h;
  return { x1, y1, x2, y2 };
}

/** SVG arrowhead marker definition. */
function ArrowMarker({ id }: { id: string }) {
  return (
    <marker
      id={id}
      markerWidth={ARROW_SIZE}
      markerHeight={ARROW_SIZE}
      refX={ARROW_SIZE}
      refY={ARROW_SIZE / 2}
      orient="auto"
      markerUnits="userSpaceOnUse"
    >
      <polygon
        points={`0,0 ${ARROW_SIZE},${ARROW_SIZE / 2} 0,${ARROW_SIZE}`}
        fill={BLUE}
      />
    </marker>
  );
}

function ArrowMarkerReverse({ id }: { id: string }) {
  return (
    <marker
      id={id}
      markerWidth={ARROW_SIZE}
      markerHeight={ARROW_SIZE}
      refX={0}
      refY={ARROW_SIZE / 2}
      orient="auto"
      markerUnits="userSpaceOnUse"
    >
      <polygon
        points={`${ARROW_SIZE},0 0,${ARROW_SIZE / 2} ${ARROW_SIZE},${ARROW_SIZE}`}
        fill={BLUE}
      />
    </marker>
  );
}

/** A single dimension line with arrowheads and centered label badge. */
function DimensionLine({
  x1, y1, x2, y2, distanceMm,
}: {
  x1: number; y1: number; x2: number; y2: number; distanceMm: number;
}) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const label = `${Math.round(distanceMm)} mm`;
  const labelWidth = label.length * 6.5 + BADGE_PAD * 4;
  const labelHeight = FONT_SIZE + BADGE_PAD * 4;

  return (
    <g>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={BLUE}
        strokeWidth={1}
        markerEnd="url(#arrow-end)"
        markerStart="url(#arrow-start)"
      />
      <rect
        x={midX - labelWidth / 2}
        y={midY - labelHeight / 2}
        width={labelWidth}
        height={labelHeight}
        fill="white"
        stroke={BLUE}
        strokeWidth={0.5}
        rx={2}
      />
      <text
        x={midX}
        y={midY}
        textAnchor="middle"
        dominantBaseline="central"
        fill={BLUE}
        fontSize={FONT_SIZE}
        fontFamily="system-ui, sans-serif"
        fontWeight={500}
      >
        {label}
      </text>
    </g>
  );
}

/** Dashed blue outline for a selected ruler item. */
function DashedOutline({
  bb, toScreenX, toScreenY, pxPerCm,
}: {
  bb: AABB; toScreenX: (x: number) => number; toScreenY: (y: number) => number; pxPerCm: number;
}) {
  return (
    <rect
      x={toScreenX(bb.x)}
      y={toScreenY(bb.y)}
      width={bb.w * pxPerCm}
      height={bb.h * pxPerCm}
      fill="none"
      stroke={BLUE}
      strokeWidth={2}
      strokeDasharray="6 3"
      rx={2}
    />
  );
}

export default function MeasurementOverlay({
  furniture,
  walls,
  gridSize,
  zoom,
  panOffset,
  showMeasurements,
  rulerFirstItemId,
  rulerSecondItemId,
  width,
  height,
}: MeasurementOverlayProps) {
  const pxPerCm = (gridSize * zoom) / 100;
  const toScreenX = (worldX: number) => worldX * pxPerCm + panOffset.x;
  const toScreenY = (worldY: number) => worldY * pxPerCm + panOffset.y;

  // Show Measurements toggle: item-to-wall and item-to-item gaps
  const measurementLines = useMemo(() => {
    if (!showMeasurements) return [];
    const wallGaps = computeItemWallGaps(furniture, walls);
    const itemGaps = computeItemItemGaps(furniture);
    return [...wallGaps, ...itemGaps];
  }, [showMeasurements, furniture, walls]);

  // Ruler tool state
  const rulerFirst = rulerFirstItemId ? furniture.find((f) => f.id === rulerFirstItemId) : null;
  const rulerSecond = rulerSecondItemId ? furniture.find((f) => f.id === rulerSecondItemId) : null;
  const rulerLine = useMemo(() => {
    if (!rulerFirst || !rulerSecond) return null;
    const a = getItemAABB(rulerFirst);
    const b = getItemAABB(rulerSecond);
    const gapX = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
    const gapY = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));
    const dist = Math.sqrt(gapX ** 2 + gapY ** 2);
    if (dist <= 0) return null;
    const pts = nearestEdgePoints(a, b);
    return { ...pts, distCm: dist };
  }, [rulerFirst, rulerSecond]);

  const hasContent = measurementLines.length > 0 || rulerFirstItemId || rulerSecondItemId;
  if (!hasContent) return null;

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <defs>
        <ArrowMarker id="arrow-end" />
        <ArrowMarkerReverse id="arrow-start" />
      </defs>

      {/* Show Measurements lines */}
      {showMeasurements &&
        measurementLines.map((line, i) => (
          <DimensionLine
            key={`m-${i}`}
            x1={toScreenX(line.x1)}
            y1={toScreenY(line.y1)}
            x2={toScreenX(line.x2)}
            y2={toScreenY(line.y2)}
            distanceMm={Math.round(line.distCm * 10)}
          />
        ))}

      {/* Ruler: dashed outlines on selected items */}
      {rulerFirst && (
        <DashedOutline bb={getItemAABB(rulerFirst)} toScreenX={toScreenX} toScreenY={toScreenY} pxPerCm={pxPerCm} />
      )}
      {rulerSecond && (
        <DashedOutline bb={getItemAABB(rulerSecond)} toScreenX={toScreenX} toScreenY={toScreenY} pxPerCm={pxPerCm} />
      )}

      {/* Ruler: measurement line between two items */}
      {rulerLine && (
        <DimensionLine
          x1={toScreenX(rulerLine.x1)}
          y1={toScreenY(rulerLine.y1)}
          x2={toScreenX(rulerLine.x2)}
          y2={toScreenY(rulerLine.y2)}
          distanceMm={Math.round(rulerLine.distCm * 10)}
        />
      )}
    </svg>
  );
}
