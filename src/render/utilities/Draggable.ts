import * as PIXI from "pixi.js";

interface DragObject extends PIXI.DisplayObject {
  dragData: PIXI.InteractionData | null;
  dragging: number;
  dragPointerStart: PIXI.DisplayObject;
  dragObjStart: PIXI.Point;
  dragGlobalStart: PIXI.Point;
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
  obj.interactive = true;
  obj.buttonMode = true;

  obj
    .on("pointerdown", onDragStart)
    .on("pointerup", onDragEnd)
    .on("pointerupoutside", onDragEnd)
    .on("pointermove", onDragMove);
}