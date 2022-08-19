import { Application, Container, DisplayObject } from "pixi.js";

/** A Singleton to Store the App In  */
class AppSingleton {
  static _instance: any; // For tracking singleton status

  app: Application = new Application({
    backgroundColor: 0xf0f0f0,
    antialias: true,
    autoDensity: true,
    resizeTo: document.getElementById("app")!,
  });

  stage: Container<DisplayObject> = this.app.stage;
  graphContainer = new Container();

  constructor() {
    // Make singleton
    if (AppSingleton._instance) {
      return AppSingleton._instance;
    }
    AppSingleton._instance = this;

    this.app.stage.sortableChildren = true; // make zIndex work

    window.addEventListener("resize", (e) => {
      this.app.resize();
    });

    // TODO make the components and lines go in here
    this.stage.addChild(this.graphContainer);
  }
}

export default new AppSingleton();