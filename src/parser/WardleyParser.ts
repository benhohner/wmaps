import chevrotain from "chevrotain";

// (function jsonGrammarOnlyExample() {
function WardleyScript() {
  // ----------------- Lexer -----------------
  const createToken = chevrotain.createToken;
  const Lexer = chevrotain.Lexer;

  const Component = createToken({ name: "Component", pattern: /component/ });
  const Inertia = createToken({ name: "Inertia", pattern: /inertia/ });
  const Edge = createToken({ name: "Edge", pattern: /->/ });

  const LSquare = createToken({ name: "LSquare", pattern: /\[/ });
  const RSquare = createToken({ name: "RSquare", pattern: /]/ });
  const Comma = createToken({ name: "Comma", pattern: /,/ });

  const NewLine = createToken({
    name: "NewLine",
    pattern: /\r?\n+/,
    line_breaks: true
  });

  const StringLiteral = createToken({
    name: "StringLiteral",
    pattern: /[a-zA-Z0-9_]+([ -]+[a-zA-Z0-9_]+)*/
  });

  const NumberLiteral = createToken({
    name: "NumberLiteral",
    pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
  });

  const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /[ \t]+/
    // group: Lexer.SKIPPED
  });

  const SkippedWhiteSpace = createToken({
    name: "SkippedWhiteSpace",
    pattern: /[ \t]{1,}/,
    group: Lexer.SKIPPED
  });

  const wardleyTokens = [
    Component,
    Inertia,
    Edge,
    LSquare,
    RSquare,
    Comma,
    NumberLiteral,
    StringLiteral,
    NewLine,
    WhiteSpace,
    SkippedWhiteSpace
  ];

  const WardleyLexer = new Lexer(wardleyTokens, {
    // Less position info tracked, reduces verbosity of the playground output.
    positionTracking: "onlyStart"
  });

  // Labels only affect error messages and Diagrams.
  LSquare.LABEL = "'['";
  RSquare.LABEL = "']'";
  Comma.LABEL = "','";
  Edge.LABEL = "'->'";

  // ----------------- parser -----------------
  class WardleyParser extends chevrotain.CstParser {
    constructor() {
      super(wardleyTokens, {
        recoveryEnabled: false
      });

      const $ = this;

      $.RULE("wardley", () => {
        $.AT_LEAST_ONE(() => {
          $.OR([
            { ALT: () => $.SUBRULE($.declaration) },
            { ALT: () => $.CONSUME(NewLine) },
            { ALT: () => $.CONSUME(WhiteSpace) }
          ]);
        });
      });

      $.RULE("declaration", () => {
        $.OR([
          { ALT: () => $.SUBRULE($.componentDeclaration) },
          { ALT: () => $.SUBRULE($.edgeDeclaration) }
        ]);
        $.OPTION(() => $.CONSUME(WhiteSpace));
      });

      $.RULE("edgeDeclaration", () => {
        $.CONSUME(StringLiteral, { LABEL: "LHS" });
        $.OPTION(() => $.CONSUME(WhiteSpace));
        $.CONSUME(Edge);
        $.OPTION1(() => $.CONSUME1(WhiteSpace));
        $.CONSUME1(StringLiteral, { LABEL: "RHS" });
      });

      $.RULE("componentDeclaration", () => {
        $.CONSUME(Component);
        $.CONSUME(WhiteSpace);
        $.CONSUME(StringLiteral);
        $.CONSUME2(WhiteSpace);
        $.OPTION(() => $.SUBRULE($.coordinates));
      });

      $.RULE("coordinates", () => {
        $.CONSUME(LSquare);
        $.OPTION(() => $.CONSUME(WhiteSpace));
        $.CONSUME(NumberLiteral, { LABEL: "LHS" });
        $.OPTION1(() => $.CONSUME1(WhiteSpace));
        $.CONSUME(Comma);
        $.OPTION2(() => $.CONSUME2(WhiteSpace));
        $.CONSUME1(NumberLiteral, { LABEL: "RHS" });
        $.OPTION3(() => $.CONSUME3(WhiteSpace));
        $.CONSUME(RSquare);
      });

      // very important to call this after all the rules have been setup.
      // otherwise the parser may not work correctly as it will lack information
      // derived from the self analysis.
      this.performSelfAnalysis();
    }
  }

  // for the playground to work the returned object must contain these fields
  return {
    lexer: WardleyLexer,
    parser: WardleyParser,
    defaultRule: "wardley"
  };
}

WardleyScript();
