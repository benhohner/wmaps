import { Application } from "pixi.js";

/** A Singleton to Store the App In  */
class AppSingleton {
  static _instance: any; // For tracking singleton status

  app: any;

  constructor() {
    // Make singleton
    if (AppSingleton._instance) {
      return AppSingleton._instance;
    }
    AppSingleton._instance = this;

    this.app = new Application({
      width: 500,
      height: 350,
      backgroundColor: 0xf0f0f0
    });
    this.app.stage.sortableChildren = true; // make zIndex work
  }
}

export default new AppSingleton();
