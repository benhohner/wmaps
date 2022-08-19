import * as PIXI from "pixi.js";
import { DisplayObject } from "pixi.js";

interface DragObject extends DisplayObject {
  dragData: PIXI.InteractionData | null;
  dragging: number;
  dragPointerStart: PIXI.DisplayObject;
  dragObjStart: PIXI.Point;
  dragGlobalStart: PIXI.Point;
}

// === CLICKS AND SNAP ===

export function snap(obj: DragObject) {
  obj.position.x = Math.min(Math.max(obj.position.x, 0), app.screen.width);
  obj.position.y = Math.min(Math.max(obj.position.y, 0), app.screen.height);
}

function onDragStart(event: PIXI.InteractionEvent) {
  const obj = event.currentTarget as DragObject;
  obj.dragData = event.data;
  obj.dragging = 1;
  obj.dragPointerStart = event.data.getLocalPosition(obj.parent);
  obj.dragObjStart = new PIXI.Point();
  obj.dragObjStart.copyFrom(obj.position);
  obj.dragGlobalStart = new PIXI.Point();
  obj.dragGlobalStart.copyFrom(event.data.global);
}

function onDragEnd(event: PIXI.InteractionEvent) {
  const obj = event.currentTarget as DragObject;
  if (!obj.dragging) return;

  // snap(obj);

  obj.dragging = 0;
  // set the interaction data to null
  obj.dragData = null;
}

function onDragMove(event: PIXI.InteractionEvent) {
  const obj = event.currentTarget as DragObject;
  if (!obj.dragging) return;
  const data = obj.dragData; // it can be different pointer!
  if (obj.dragging === 1) {
    // click or drag?
    if (
      Math.abs(data.global.x - obj.dragGlobalStart.x) +
        Math.abs(data.global.y - obj.dragGlobalStart.y) >=
      3
    ) {
      // DRAG
      obj.dragging = 2;
    }
  }
  if (obj.dragging === 2) {
    const dragPointerEnd = data.getLocalPosition(obj.parent);
    // DRAG
    obj.position.set(
      obj.dragObjStart.x + (dragPointerEnd.x - obj.dragPointerStart.x),
      obj.dragObjStart.y + (dragPointerEnd.y - obj.dragPointerStart.y)
    );
  }
}

export function setDraggable(obj: PIXI.DisplayObject) {
  // Rotate around the center

  obj.interactive = true;
  obj.buttonMode = true;
  console.log("set draggable");

  obj
    .on("pointerdown", onDragStart)
    .on("pointerup", onDragEnd)
    .on("pointerupoutside", onDragEnd)
    .on("pointermove", onDragMove);
}