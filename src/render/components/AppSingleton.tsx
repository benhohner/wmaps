import { Application, Container } from "pixi.js";
import PixiFps from "pixi-fps";

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
      resizeTo: document.getElementById("app")!,
    });

    AppSingleton._instance = this;

    // Resize container on window resize
    window.addEventListener("resize", (e) => {
      this.resize();
    });

    // A container to hold all components, lines, text
    this.stage.addChild(this.graphContainer);
    this.graphContainer.sortableChildren = true; // make zIndex work

    // FPS Monitor
    this.stage.addChild(new PixiFps());
  }
}

export default new AppSingleton();