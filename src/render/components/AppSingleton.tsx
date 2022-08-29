import { Application, Container, BitmapFont } from "pixi.js";
import { FPSMonitor } from "../utilities/FPSMonitor";

import { appendText } from "../../editor/Editor";
import { getObjectID } from "../../state/State";

// @ts-ignore
Application.prototype.render = null; // Disable auto-rendering by removing the function

class AppSingleton extends Application {
  static _instance: AppSingleton;

  graphContainer = new Container();
  dirty: boolean = false;

  constructor() {
    if (AppSingleton._instance) {
      return AppSingleton._instance;
    }

    super({
      backgroundColor: 0xf0f0f0,
      antialias: true,
      autoDensity: true,
      // this may introduce coordinate bugs
      resolution: 2,
      resizeTo: document.getElementById("app")!,
    });

    AppSingleton._instance = this;

    //Set up custom renderer
    this.ticker.add(() => {
      if (this.dirty) {
        // Manually render when something has changed
        this.renderer.render(this.stage);
        this.dirty = false;
      }
    });

    // Create a font for usage
    BitmapFont.from(
      "TitleFont",
      {
        fill: "#000000",
        // supersize font based on dpr
        fontSize: 14 * this.renderer.resolution,
        fontWeight: "normal",
      },
      {
        chars:
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789~1234567890!@#$%^&*-=_+()[]{}<>,./;':\"\\| ",
      }
    );

    // A container to hold all components, lines, text
    this.stage.addChild(this.graphContainer);
    this.graphContainer.sortableChildren = true; // make zIndex work

    // FPS Monitor
    // this.stage.addChild(new FPSMonitor());

    this.view.addEventListener("mousedown", (e: any) => {
      // Might double click more than once within 200ms
      if (e.detail % 2 === 0) {
        const coords = this.rendererToWardleyCoords(e.offsetX, e.offsetY);
        appendText(
          `\ncomponent c${getObjectID()} [${coords[1]}, ${coords[0]}]`
        );
      }
    });
  }

  wardleyToRendererCoords(x: number, y: number) {
    return [
      (x * this.renderer.width) / this.renderer.resolution,
      ((1 - y) * this.renderer.height) / this.renderer.resolution,
    ];
  }

  rendererToWardleyCoords(x: number, y: number) {
    return [
      ((1 / this.renderer.width) * this.renderer.resolution * x).toFixed(3),
      (1 - (1 / this.renderer.height) * this.renderer.resolution * y).toFixed(
        3
      ),
    ];
  }
}

export default new AppSingleton();
