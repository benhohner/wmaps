import { Application, Container, BitmapFont } from "pixi.js";
import PixiFps from "pixi-fps";

import { addComponent, rerenderGraph } from "../../state/Graph";

class AppSingleton extends Application {
  static _instance: AppSingleton;

  graphContainer = new Container();

  constructor() {
    if (AppSingleton._instance) {
      return AppSingleton._instance;
    }

    super({
      backgroundColor: 0xf0f0f0,
      antialias: true,
      autoDensity: true,
      // this may introduce coordinate bugs
      resolution: 3,
      resizeTo: document.getElementById("app")!,
    });

    AppSingleton._instance = this;

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

    // Resize container on window resize
    const onResize = () => {
      this.resize();
      rerenderGraph();
    };
    window.addEventListener("resize", onResize);

    // A container to hold all components, lines, text
    this.stage.addChild(this.graphContainer);
    this.graphContainer.sortableChildren = true; // make zIndex work

    // FPS Monitor
    this.stage.addChild(new PixiFps());

    this.view.addEventListener("mousedown", (e: any) => {
      // Might double click more than once within 200ms
      if (e.detail % 2 === 0) {
        addComponent(e.offsetX, e.offsetY);
      }
    });
  }
}

export default new AppSingleton();