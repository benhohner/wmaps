import { Graphics } from "pixi.js";

export function Rectangle(x: number, y: number, width: number, height: number) {
  let rectangle = new Graphics();
  rectangle.lineStyle(4, 0xff3300, 1);
  rectangle.beginFill(0x66ccff);
  rectangle.drawRect(0, 0, width, height);
  rectangle.endFill();
  rectangle.x = x;
  rectangle.y = y;
  return rectangle;
}
