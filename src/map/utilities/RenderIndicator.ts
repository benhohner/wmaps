import { Graphics, BitmapText, BitmapFont, TextureLoader } from "pixi.js";

export class RenderIndicator {
  r = new Graphics()
    .lineStyle(0)
    .beginFill(0xff0000)
    .drawRect(0, 0, 20, 20)
    .endFill();
  filled = true;
  counter = 0;
  text: BitmapText;

  constructor() {
    // Create a font for usage
    BitmapFont.from(
      "TitleFont",
      {
        fill: "#000000",
        // supersize font based on dpr
        fontSize: 16 * window.devicePixelRatio,
        fontWeight: "normal",
      },
      {
        chars:
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789~1234567890!@#$%^&?*-=_+()[]{}<>,./;':\"\\| ",
      }
    );
    this.text = new BitmapText(this.counter.toString(), {
      fontName: "TitleFont",
      fontSize: 16,
    });
    this.r.addChild(this.text);
  }

  reset() {
    this.counter = 0;
  }

  onRender() {
    if (this.filled) {
      this.r
        .clear()
        .lineStyle(0)
        .beginFill(0xff0000)
        .drawRect(0, 0, 20, 20)
        .endFill();
    } else {
      this.r
        .clear()
        .lineStyle(0)
        .beginFill(0xffffff)
        .drawRect(0, 0, 20, 20)
        .endFill();
    }
    this.text.text = this.counter.toString();
    this.filled = !this.filled;
    this.counter++;
  }
}
