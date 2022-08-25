import * as PIXI from "pixi.js";

import { ExtendedGraphics } from "../components/types";

interface DragObject extends ExtendedGraphics {
  dragData: PIXI.InteractionData | undefined;
  dragging: number;
  dragPointerStart: PIXI.DisplayObject;
  dragObjStart: PIXI.Point;
  dragGlobalStart: PIXI.Point;
}

export type OnDragStartCallback = (event: PIXI.InteractionEvent) => void;
export type OnDragMoveCallback = (event: PIXI.InteractionEvent) => void;
export type OnDragEndCallback = (event: PIXI.InteractionEvent) => void;

export type ObjectUpdateStrategy = (
  obj: DragObject,
  x: number,
  y: number
) => void;

const defaultObjectUpdateStrategy = (obj: DragObject, x: number, y: number) => {
  obj.position.x = x;
  obj.position.y = y;
};

function onDragStart(
  event: PIXI.InteractionEvent,
  callback: OnDragStartCallback | undefined = undefined
) {
  const obj = event.currentTarget as DragObject;

  obj.dragData = event.data;

  obj.dragging = 1;

  obj.dragPointerStart = event.data.getLocalPosition(obj.parent);

  obj.dragObjStart = new PIXI.Point();
  obj.dragObjStart.copyFrom(obj.position);

  obj.dragGlobalStart = new PIXI.Point();
  obj.dragGlobalStart.copyFrom(event.data.global);

  if (callback) {
    callback(event);
  }
}

function onDragEnd(
  event: PIXI.InteractionEvent,
  callback: OnDragEndCallback | undefined = undefined
) {
  const obj = event.currentTarget as DragObject;

  if (!obj.dragging) return;

  obj.dragging = 0;

  // set the interaction data to null
  delete obj.dragData;

  if (callback) {
    callback(event);
  }
}

function onDragMove(
  event: PIXI.InteractionEvent,
  callback: OnDragMoveCallback | undefined = undefined,
  objectUpdateStrategy: ObjectUpdateStrategy = defaultObjectUpdateStrategy
) {
  const obj = event.currentTarget as DragObject;
  if (!obj.dragging) return;

  const data = obj.dragData; // it can be different pointer!
  if (!data) return;

  if (obj.dragging === 1) {
    // If distance moved since click is > 3 pixels, we're dragging
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

    objectUpdateStrategy(
      obj,
      obj.dragObjStart.x + (dragPointerEnd.x - obj.dragPointerStart.x),
      obj.dragObjStart.y + (dragPointerEnd.y - obj.dragPointerStart.y)
    );

    if (callback) {
      callback(event);
    }
  }
}

export function setDraggable(
  obj: PIXI.DisplayObject,
  onDragStartCallback: OnDragStartCallback | undefined = undefined,
  onDragMoveCallback: OnDragMoveCallback | undefined = undefined,
  onDragEndCallback: OnDragEndCallback | undefined = undefined,
  objectUpdateStrategy: ObjectUpdateStrategy = defaultObjectUpdateStrategy
) {
  obj.interactive = true;
  obj.buttonMode = true;

  obj.on("pointerdown", (e) => onDragStart(e, onDragStartCallback));
  obj.on("pointerup", (e) => onDragEnd(e, onDragEndCallback));
  obj.on("pointerupoutside", (e) => onDragEnd(e, onDragEndCallback));
  obj.on("pointermove", (e) =>
    onDragMove(e, onDragMoveCallback, objectUpdateStrategy)
  );
}