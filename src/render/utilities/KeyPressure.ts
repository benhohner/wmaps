type SparseBooleanArray = boolean | undefined;

type ListenerArray = [number, Function];

/** Gets a live updating list of all pressed keys */
class KeyPressure {
  static _instance: KeyPressure; // For tracking singleton status

  /**
   * A sparse array of all the keys currently pressed.
   * @type {SparseBooleanArray[]}
   * @public
   */
  public keys: SparseBooleanArray[] = [];

  private _keydownListeners: ListenerArray[] = [];
  private _keyupListeners: ListenerArray[] = [];

  constructor(scope = window) {
    // Make singleton
    if (KeyPressure._instance) {
      console.log("already exists");
      return KeyPressure._instance;
    }
    KeyPressure._instance = this;

    scope.onkeydown = (e) => {
      // prevent repeating
      if (!this.keys[e.keyCode]) {
        this.keys[e.keyCode] = true;
        this._keydownListeners.forEach((listener) => {
          if (listener[0] === e.keyCode) {
            listener[1]();
          }
        });
      }
    };

    scope.onkeyup = (e) => {
      this._keyupListeners.forEach((listener) => {
        if (listener[0] === e.keyCode) {
          listener[1]();
        }
      });
      this.keys[e.keyCode] = false;
    };
  }

  addKeydownListener(keyCode: number, listener: Function) {
    return this._keydownListeners.push([keyCode, listener]);
  }

  removeKeydownListener(listenerId: number) {
    delete this._keydownListeners[listenerId];
  }

  addKeyupListener(keyCode: number, listener: Function) {
    return this._keyupListeners.push([keyCode, listener]);
  }

  removeKeyupListener(listenerId: number) {
    delete this._keyupListeners[listenerId];
  }
}

export default new KeyPressure();