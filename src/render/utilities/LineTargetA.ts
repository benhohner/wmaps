/** An object to store lineTargetA in  */
class LineTargetA {
  static _instance: LineTargetA; // For tracking singleton status

  public target: any;

  constructor(scope = window) {
    // Make singleton
    if (LineTargetA._instance) {
      return LineTargetA._instance;
    }
    LineTargetA._instance = this;
  }
}

export default new LineTargetA();
