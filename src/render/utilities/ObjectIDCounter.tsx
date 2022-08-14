/** Gets a a persistent autoincrementing integer ID */
class ObjectIDCounter {
  static _instance: ObjectIDCounter; // For tracking singleton status

  private _id: number = 0;

  constructor(scope = window) {
    // Make singleton
    if (ObjectIDCounter._instance) {
      return ObjectIDCounter._instance;
    }
    ObjectIDCounter._instance = this;
  }

  getID() {
    this._id++;
    return this._id;
  }
}

export default new ObjectIDCounter();
