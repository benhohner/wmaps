type SparseBooleanArray = boolean | undefined;

/** Gets a live updating list of all pressed keys */
class KeyPressure {
  static _instance: KeyPressure; // For tracking singleton status

  /**
   * A sparse array of all the keys currently pressed.
   * @type {SparseBooleanArray[]}
   * @public
   */
  public keys: SparseBooleanArray[] = [];

  constructor(scope = window) {
    // Make singleton
    if (KeyPressure._instance) {
      console.log("already exists");
      return KeyPressure._instance;
    }
    KeyPressure._instance = this;

    scope.onkeyup = (e) => {
      this.keys[e.keyCode] = false;
    };
    scope.onkeydown = (e) => {
      this.keys[e.keyCode] = true;
    };
  }
}

export default new KeyPressure();
