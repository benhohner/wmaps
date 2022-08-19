import { proxy } from "valtio";

/** A Singleton to Store the App In  */
class StateSingleton {
  static _instance: any; // For tracking singleton status

  state: object = proxy({});

  constructor() {
    // Make singleton
    if (StateSingleton._instance) {
      return StateSingleton._instance;
    }
    StateSingleton._instance = this;
  }
}

export default new StateSingleton();
