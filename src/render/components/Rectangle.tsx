import { Graphics } from "pixi.js";

export function Rectangle(x: number, y: number, width: number, height: number) {
  let rectangle = new Graphics();
  rectangle.lineStyle(0);
  rectangle.beginFill(0xf0f0f0);
  rectangle.drawRect(0, 0, width, height);
  rectangle.endFill();
  rectangle.x = x;
  rectangle.y = y;
  return rectangle;
}
