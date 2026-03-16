import { useRef, useEffect, useCallback, useState } from "react";
import { EditorState, Point, FurnitureTemplate, FurnitureItem, RoomLabel } from "../lib/types";
import {
  drawGrid,
  drawWalls,
  drawFurniture,
  drawLabels,
  drawWallPreview,
  drawRoomAreas,
  drawResizeHandles,
  drawSnapIndicator,
  screenToWorld,
  snapToGrid,
  snapToWallEndpoints,
  hitTestWall,
  hitTestFurniture,
  hitTestLabel,
  hitTestResizeHandle,
  ResizeCorner,
} from "../lib/canvas-renderer";
import { detectRooms } from "../lib/room-detection";

interface FloorPlanCanvasProps {
  state: EditorState;
  isDark: boolean;
  onAddWall: (start: Point, end: Point) => void;
  onSelectItem: (id: string | null) => void;
  onMoveFurniture: (id: string, x: number, y: number) => void;
  onMoveLabel: (id: string, x: number, y: number) => void;
  onRemoveWall: (id: string) => void;
  onRemoveFurniture: (id: string) => void;
  onRemoveLabel: (id: string) => void;
  onSetZoom: (zoom: number) => void;
  onSetPan: (offset: Point) => void;
  onSetWallDrawing: (drawing: { start: Point } | null) => void;
  onAddLabel: (text: string, position: Point) => void;
  onUpdateLabel: (id: string, updates: Partial<RoomLabel>) => void;
  onPushUndo: () => void;
  droppingFurniture: FurnitureTemplate | null;
  onDropFurniture: (template: FurnitureTemplate, position: Point) => void;
  onUpdateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
}

export default function FloorPlanCanvas({
  state,
  isDark,
  onAddWall,
  onSelectItem,
  onMoveFurniture,
  onMoveLabel,
  onRemoveWall,
  onRemoveFurniture,
  onRemoveLabel,
  onSetZoom,
  onSetPan,
  onSetWallDrawing,
  onAddLabel,
  onUpdateLabel,
  onPushUndo,
  droppingFurniture,
  onDropFurniture,
  onUpdateFurniture,
}: FloorPlanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [dragItemOffset, setDragItemOffset] = useState<Point>({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<ResizeCorner | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; itemX: number; itemY: number; itemW: number; itemH: number } | null>(null);
  const [wallSnapPoint, setWallSnapPoint] = useState<Point | null>(null);

  // Inline label editing state
  const [editingLabel, setEditingLabel] = useState<{ id: string | null; x: number; y: number; text: string; isNew: boolean }>({ id: null, x: 0, y: 0, text: "", isNew: false });
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Pinch-to-zoom state
  const pointerCache = useRef<Map<number, PointerEvent>>(new Map());
  const prevPinchDist = useRef<number | null>(null);

  // Canvas resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    // Clear
    ctx.fillStyle = isDark ? "#171614" : "#f7f6f2";
    ctx.fillRect(0, 0, w, h);

    // Grid
    drawGrid(ctx, w, h, state.gridSize, state.zoom, state.panOffset, isDark);

    // Room areas
    const rooms = detectRooms(state.walls);
    if (rooms.length > 0) {
      drawRoomAreas(ctx, rooms, state.gridSize, state.zoom, state.panOffset, isDark);
    }

    // Walls
    drawWalls(ctx, state.walls, state.gridSize, state.zoom, state.panOffset, isDark, state.selectedItemId);

    // Wall preview with snapping
    if (state.wallDrawing && state.selectedTool === "wall") {
      const worldMouse = screenToWorld(mousePos.x, mousePos.y, state.gridSize, state.zoom, state.panOffset);
      const gridSnapped = snapToGrid(worldMouse, 10);
      const { snapped: wallSnapped, didSnap } = snapToWallEndpoints(gridSnapped, state.walls, 15);
      const finalPoint = didSnap ? wallSnapped : gridSnapped;
      drawWallPreview(ctx, state.wallDrawing.start, finalPoint, state.gridSize, state.zoom, state.panOffset, isDark);
      if (didSnap) {
        drawSnapIndicator(ctx, wallSnapped, state.gridSize, state.zoom, state.panOffset);
      }
    }

    // Furniture
    drawFurniture(ctx, state.furniture, state.gridSize, state.zoom, state.panOffset, isDark, state.selectedItemId);

    // Resize handles for selected furniture
    const selectedFurn = state.furniture.find((f) => f.id === state.selectedItemId);
    if (selectedFurn && state.selectedTool === "select") {
      drawResizeHandles(ctx, selectedFurn, state.gridSize, state.zoom, state.panOffset);
    }

    // Labels
    drawLabels(ctx, state.labels, state.gridSize, state.zoom, state.panOffset, isDark, state.selectedItemId);

    // Snap indicator when drawing walls and not in preview mode
    if (state.selectedTool === "wall" && !state.wallDrawing) {
      const worldMouse = screenToWorld(mousePos.x, mousePos.y, state.gridSize, state.zoom, state.panOffset);
      const gridSnapped = snapToGrid(worldMouse, 10);
      const { didSnap } = snapToWallEndpoints(gridSnapped, state.walls, 15);
      if (didSnap) {
        const { snapped } = snapToWallEndpoints(gridSnapped, state.walls, 15);
        drawSnapIndicator(ctx, snapped, state.gridSize, state.zoom, state.panOffset);
      }
    }

    // Scale indicator
    drawScaleIndicator(ctx, w, h, state.gridSize, state.zoom, isDark);
  });

  function drawScaleIndicator(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    gridSize: number,
    zoom: number,
    isDark: boolean
  ) {
    const meterPx = gridSize * zoom;
    const x = 16;
    const y = h - 24;

    ctx.strokeStyle = isDark ? "#797876" : "#7a7974";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + meterPx, y);
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y + 4);
    ctx.moveTo(x + meterPx, y - 4);
    ctx.lineTo(x + meterPx, y + 4);
    ctx.stroke();

    ctx.font = `500 12px 'General Sans', 'DM Sans', sans-serif`;
    ctx.fillStyle = isDark ? "#797876" : "#7a7974";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("1m", x + meterPx / 2, y - 6);
  }

  const getCanvasPos = useCallback((e: React.PointerEvent | PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const getCanvasPosMouse = useCallback((e: React.MouseEvent | React.DragEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const pos = getCanvasPos(e);

      // Track pointer for pinch-to-zoom
      pointerCache.current.set(e.pointerId, e.nativeEvent);
      if (pointerCache.current.size === 2) {
        // Start pinch — compute initial distance
        const pointers = Array.from(pointerCache.current.values());
        const dx = pointers[0].clientX - pointers[1].clientX;
        const dy = pointers[0].clientY - pointers[1].clientY;
        prevPinchDist.current = Math.sqrt(dx * dx + dy * dy);
        return;
      }

      // Middle mouse or alt+click for panning
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        setDragStart({ x: pos.x - state.panOffset.x, y: pos.y - state.panOffset.y });
        return;
      }

      if (e.button !== 0) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (state.selectedTool === "select") {
        // Check resize handles first
        const selectedFurn = state.furniture.find((f) => f.id === state.selectedItemId);
        if (selectedFurn) {
          const corner = hitTestResizeHandle(pos.x, pos.y, selectedFurn, state.gridSize, state.zoom, state.panOffset);
          if (corner) {
            setIsResizing(true);
            setResizeCorner(corner);
            setResizeStart({
              x: pos.x,
              y: pos.y,
              itemX: selectedFurn.x,
              itemY: selectedFurn.y,
              itemW: selectedFurn.width,
              itemH: selectedFurn.height,
            });
            onPushUndo();
            return;
          }
        }

        // Try to hit test furniture first, then walls, then labels
        const hitFurn = hitTestFurniture(pos.x, pos.y, state.furniture, state.gridSize, state.zoom, state.panOffset);
        if (hitFurn) {
          const pxPerCm = (state.gridSize * state.zoom) / 100;
          onSelectItem(hitFurn.id);
          setIsDragging(true);
          setDragItemOffset({
            x: pos.x - (hitFurn.x * pxPerCm + state.panOffset.x),
            y: pos.y - (hitFurn.y * pxPerCm + state.panOffset.y),
          });
          return;
        }

        const hitLbl = hitTestLabel(pos.x, pos.y, state.labels, state.gridSize, state.zoom, state.panOffset, ctx);
        if (hitLbl) {
          const pxPerCm = (state.gridSize * state.zoom) / 100;
          onSelectItem(hitLbl.id);
          setIsDragging(true);
          setDragItemOffset({
            x: pos.x - (hitLbl.x * pxPerCm + state.panOffset.x),
            y: pos.y - (hitLbl.y * pxPerCm + state.panOffset.y),
          });
          return;
        }

        const hitW = hitTestWall(pos.x, pos.y, state.walls, state.gridSize, state.zoom, state.panOffset);
        if (hitW) {
          onSelectItem(hitW.id);
          return;
        }

        onSelectItem(null);
      } else if (state.selectedTool === "wall") {
        const world = screenToWorld(pos.x, pos.y, state.gridSize, state.zoom, state.panOffset);
        const gridSnapped = snapToGrid(world, 10);
        const { snapped: wallSnapped, didSnap } = snapToWallEndpoints(gridSnapped, state.walls, 15);
        const finalPoint = didSnap ? wallSnapped : gridSnapped;

        if (state.wallDrawing) {
          onAddWall(state.wallDrawing.start, finalPoint);
          onSetWallDrawing({ start: finalPoint });
        } else {
          onSetWallDrawing({ start: finalPoint });
        }
      } else if (state.selectedTool === "eraser") {
        const hitFurn = hitTestFurniture(pos.x, pos.y, state.furniture, state.gridSize, state.zoom, state.panOffset);
        if (hitFurn) { onRemoveFurniture(hitFurn.id); return; }

        const hitLbl = hitTestLabel(pos.x, pos.y, state.labels, state.gridSize, state.zoom, state.panOffset, ctx);
        if (hitLbl) { onRemoveLabel(hitLbl.id); return; }

        const hitW = hitTestWall(pos.x, pos.y, state.walls, state.gridSize, state.zoom, state.panOffset);
        if (hitW) { onRemoveWall(hitW.id); return; }
      } else if (state.selectedTool === "label") {
        const world = screenToWorld(pos.x, pos.y, state.gridSize, state.zoom, state.panOffset);
        const snapped = snapToGrid(world, 10);
        // Show inline input instead of prompt
        const pxPerCm = (state.gridSize * state.zoom) / 100;
        const screenX = snapped.x * pxPerCm + state.panOffset.x;
        const screenY = snapped.y * pxPerCm + state.panOffset.y;
        setEditingLabel({ id: null, x: screenX, y: screenY, text: "", isNew: true });
        // We need to store the world position for when we commit
        editingLabelWorldPos.current = snapped;
        setTimeout(() => labelInputRef.current?.focus(), 0);
      }
    },
    [state, getCanvasPos, onSelectItem, onAddWall, onSetWallDrawing, onRemoveWall, onRemoveFurniture, onRemoveLabel, onPushUndo, onUpdateFurniture]
  );

  // Store world position for new labels
  const editingLabelWorldPos = useRef<Point>({ x: 0, y: 0 });

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const pos = getCanvasPos(e);
      setMousePos(pos);

      // Update pointer in cache
      pointerCache.current.set(e.pointerId, e.nativeEvent);

      // Pinch-to-zoom
      if (pointerCache.current.size === 2 && prevPinchDist.current !== null) {
        const pointers = Array.from(pointerCache.current.values());
        const dx = pointers[0].clientX - pointers[1].clientX;
        const dy = pointers[0].clientY - pointers[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const scale = dist / prevPinchDist.current;
        const newZoom = Math.max(0.3, Math.min(3, state.zoom * scale));

        // Zoom towards center of the two pointers
        const centerX = (pointers[0].clientX + pointers[1].clientX) / 2;
        const centerY = (pointers[0].clientY + pointers[1].clientY) / 2;
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const cx = centerX - rect.left;
          const cy = centerY - rect.top;
          const zoomRatio = newZoom / state.zoom;
          const newPanX = cx - (cx - state.panOffset.x) * zoomRatio;
          const newPanY = cy - (cy - state.panOffset.y) * zoomRatio;
          onSetZoom(newZoom);
          onSetPan({ x: newPanX, y: newPanY });
        }

        prevPinchDist.current = dist;
        return;
      }

      if (isPanning) {
        onSetPan({
          x: pos.x - dragStart.x,
          y: pos.y - dragStart.y,
        });
        return;
      }

      if (isResizing && resizeStart && resizeCorner && state.selectedItemId) {
        const pxPerCm = (state.gridSize * state.zoom) / 100;
        const dxPx = pos.x - resizeStart.x;
        const dyPx = pos.y - resizeStart.y;
        const dxCm = dxPx / pxPerCm;
        const dyCm = dyPx / pxPerCm;

        let newW = resizeStart.itemW;
        let newH = resizeStart.itemH;
        let newX = resizeStart.itemX;
        let newY = resizeStart.itemY;

        if (resizeCorner === "br") {
          newW = Math.max(20, resizeStart.itemW + dxCm);
          newH = Math.max(20, resizeStart.itemH + dyCm);
        } else if (resizeCorner === "bl") {
          newW = Math.max(20, resizeStart.itemW - dxCm);
          newH = Math.max(20, resizeStart.itemH + dyCm);
          newX = resizeStart.itemX + resizeStart.itemW - newW;
        } else if (resizeCorner === "tr") {
          newW = Math.max(20, resizeStart.itemW + dxCm);
          newH = Math.max(20, resizeStart.itemH - dyCm);
          newY = resizeStart.itemY + resizeStart.itemH - newH;
        } else if (resizeCorner === "tl") {
          newW = Math.max(20, resizeStart.itemW - dxCm);
          newH = Math.max(20, resizeStart.itemH - dyCm);
          newX = resizeStart.itemX + resizeStart.itemW - newW;
          newY = resizeStart.itemY + resizeStart.itemH - newH;
        }

        newW = Math.round(newW);
        newH = Math.round(newH);
        newX = Math.round(newX);
        newY = Math.round(newY);

        onUpdateFurniture(state.selectedItemId, { width: newW, height: newH, x: newX, y: newY });
        return;
      }

      if (isDragging && state.selectedItemId) {
        const pxPerCm = (state.gridSize * state.zoom) / 100;
        const worldX = (pos.x - dragItemOffset.x - state.panOffset.x) / pxPerCm;
        const worldY = (pos.y - dragItemOffset.y - state.panOffset.y) / pxPerCm;
        const snappedX = Math.round(worldX / 5) * 5;
        const snappedY = Math.round(worldY / 5) * 5;

        // Check if it's furniture or label
        const furn = state.furniture.find((f) => f.id === state.selectedItemId);
        if (furn) {
          onMoveFurniture(state.selectedItemId, snappedX, snappedY);
          return;
        }
        const lbl = state.labels.find((l) => l.id === state.selectedItemId);
        if (lbl) {
          onMoveLabel(state.selectedItemId, snappedX, snappedY);
        }
      }

      // Update wall snap indicator
      if (state.selectedTool === "wall") {
        const world = screenToWorld(pos.x, pos.y, state.gridSize, state.zoom, state.panOffset);
        const gridSnapped = snapToGrid(world, 10);
        const { snapped, didSnap } = snapToWallEndpoints(gridSnapped, state.walls, 15);
        setWallSnapPoint(didSnap ? snapped : null);
      }
    },
    [state, isPanning, isDragging, isResizing, resizeStart, resizeCorner, dragStart, dragItemOffset, getCanvasPos, onSetPan, onSetZoom, onMoveFurniture, onMoveLabel, onUpdateFurniture]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      pointerCache.current.delete(e.pointerId);
      if (pointerCache.current.size < 2) {
        prevPinchDist.current = null;
      }

      if (isDragging) {
        onPushUndo();
      }
      setIsDragging(false);
      setIsPanning(false);
      setIsResizing(false);
      setResizeCorner(null);
      setResizeStart(null);
    },
    [isDragging, onPushUndo]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.3, Math.min(3, state.zoom * delta));

      // Zoom towards mouse
      const pos = getCanvasPosMouse(e);
      const zoomRatio = newZoom / state.zoom;
      const newPanX = pos.x - (pos.x - state.panOffset.x) * zoomRatio;
      const newPanY = pos.y - (pos.y - state.panOffset.y) * zoomRatio;

      onSetZoom(newZoom);
      onSetPan({ x: newPanX, y: newPanY });
    },
    [state.zoom, state.panOffset, getCanvasPosMouse, onSetZoom, onSetPan]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (state.selectedTool === "wall" && state.wallDrawing) {
        onSetWallDrawing(null);
        return;
      }

      // Double-click on label to edit inline
      if (state.selectedTool === "select") {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

        const hitLbl = hitTestLabel(pos.x, pos.y, state.labels, state.gridSize, state.zoom, state.panOffset, ctx);
        if (hitLbl) {
          const pxPerCm = (state.gridSize * state.zoom) / 100;
          const screenX = hitLbl.x * pxPerCm + state.panOffset.x;
          const screenY = hitLbl.y * pxPerCm + state.panOffset.y;
          setEditingLabel({ id: hitLbl.id, x: screenX, y: screenY, text: hitLbl.text, isNew: false });
          editingLabelWorldPos.current = { x: hitLbl.x, y: hitLbl.y };
          setTimeout(() => labelInputRef.current?.focus(), 0);
        }
      }
    },
    [state.selectedTool, state.wallDrawing, state.labels, state.gridSize, state.zoom, state.panOffset, onSetWallDrawing]
  );

  // Inline label editing handlers
  const commitLabel = useCallback(() => {
    const text = editingLabel.text.trim();
    if (text) {
      if (editingLabel.isNew) {
        onAddLabel(text, editingLabelWorldPos.current);
      } else if (editingLabel.id) {
        onUpdateLabel(editingLabel.id, { text });
      }
    }
    setEditingLabel({ id: null, x: 0, y: 0, text: "", isNew: false });
  }, [editingLabel, onAddLabel, onUpdateLabel]);

  const cancelLabel = useCallback(() => {
    setEditingLabel({ id: null, x: 0, y: 0, text: "", isNew: false });
  }, []);

  const handleLabelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitLabel();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelLabel();
    }
  }, [commitLabel, cancelLabel]);

  // Handle furniture drop from library
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      try {
        const data = e.dataTransfer.getData("application/json");
        if (!data) return;
        const template: FurnitureTemplate = JSON.parse(data);
        const pos = getCanvasPosMouse(e);
        const world = screenToWorld(pos.x, pos.y, state.gridSize, state.zoom, state.panOffset);
        const snapped = snapToGrid(world, 10);
        onDropFurniture(template, snapped);
      } catch {}
    },
    [state, getCanvasPosMouse, onDropFurniture]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "Escape") {
        onSetWallDrawing(null);
        onSelectItem(null);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (state.selectedItemId) {
          const furn = state.furniture.find((f) => f.id === state.selectedItemId);
          if (furn) onRemoveFurniture(state.selectedItemId);
          const wall = state.walls.find((w) => w.id === state.selectedItemId);
          if (wall) onRemoveWall(state.selectedItemId);
          const lbl = state.labels.find((l) => l.id === state.selectedItemId);
          if (lbl) onRemoveLabel(state.selectedItemId);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.selectedItemId, state.furniture, state.walls, state.labels, onRemoveFurniture, onRemoveWall, onRemoveLabel, onSetWallDrawing, onSelectItem]);

  const cursorStyle = (() => {
    if (isPanning) return "grabbing";
    if (isResizing) return "nwse-resize";
    if (state.selectedTool === "wall") return "crosshair";
    if (state.selectedTool === "eraser") return "crosshair";
    if (state.selectedTool === "label") return "text";
    if (state.selectedTool === "select") return isDragging ? "grabbing" : "default";
    return "default";
  })();

  const isEditingLabel = editingLabel.id !== null || editingLabel.isNew;

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden"
      data-testid="canvas-container"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: cursorStyle, touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-testid="floor-plan-canvas"
      />
      {/* Inline label editing overlay */}
      {isEditingLabel && (
        <input
          ref={labelInputRef}
          type="text"
          value={editingLabel.text}
          onChange={(e) => setEditingLabel((prev) => ({ ...prev, text: e.target.value }))}
          onKeyDown={handleLabelKeyDown}
          onBlur={commitLabel}
          className="absolute bg-background border border-primary rounded px-2 py-1 text-sm outline-none shadow-md z-10"
          style={{
            left: editingLabel.x - 60,
            top: editingLabel.y - 14,
            width: 120,
            transform: "translateY(-50%)",
          }}
          placeholder="Enter label..."
        />
      )}
    </div>
  );
}
