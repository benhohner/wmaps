import chevrotain from "chevrotain";

export function WardleyScript() {
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
    line_breaks: true,
  });

  const StringLiteral = createToken({
    name: "StringLiteral",
    pattern: /[a-zA-Z0-9_\/\+:]+([ -]+[a-zA-Z0-9_\/\+:]+)*/,
  });

  const NumberLiteral = createToken({
    name: "NumberLiteral",
    pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/,
  });

  const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /[ \t]+/,
    // group: Lexer.SKIPPED
  });

  const SkippedWhiteSpace = createToken({
    name: "SkippedWhiteSpace",
    pattern: /[ \t]{1,}/,
    group: Lexer.SKIPPED,
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
    SkippedWhiteSpace,
  ];

  const WardleyLexer = new Lexer(wardleyTokens, {
    // Less position info tracked, reduces verbosity of the playground output.
    positionTracking: "onlyStart",
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
        recoveryEnabled: false,
      });

      const $ = this;

      $.RULE("wardley", () => {
        $.MANY(() => {
          $.OR([
            { ALT: () => $.SUBRULE($.declaration) },
            { ALT: () => $.CONSUME(NewLine) },
            { ALT: () => $.CONSUME(WhiteSpace) },
          ]);
        });
      });

      $.RULE("declaration", () => {
        $.OR([
          { ALT: () => $.SUBRULE($.componentDeclaration) },
          { ALT: () => $.SUBRULE($.edgeDeclaration) },
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
        $.OPTION(() => $.CONSUME2(WhiteSpace));
        $.OPTION1(() => $.SUBRULE($.coordinates));
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
    defaultRule: "wardley",
  };
}

const { lexer, parser } = WardleyScript();

const parserInstance = new parser();

const BaseWardleyVisitor = parserInstance.getBaseCstVisitorConstructor();

class WardleyVisitor extends BaseWardleyVisitor {
  constructor() {
    super();
    // The "validateVisitor" method is a helper utility which performs static analysis
    // to detect missing or redundant visitor methods
    this.validateVisitor();
  }
  /* Visit methods */
  wardley(ctx) {
    if (ctx.declaration) {
      return ctx.declaration.map((dec) => this.visit(dec));
    } else {
      return [];
    }
  }

  declaration(ctx) {
    let dec = undefined;
    if (ctx.componentDeclaration) {
      dec = this.visit(ctx.componentDeclaration[0]);
    } else if (ctx.edgeDeclaration) {
      dec = this.visit(ctx.edgeDeclaration[0]);
    }
    return dec;
  }

  edgeDeclaration(ctx) {
    return {
      type: "edgeDeclaration",
      lhs: ctx.LHS[0].image,
      rhs: ctx.RHS[0].image,
    };
  }

  componentDeclaration(ctx) {
    let coordinates = undefined;
    if (ctx.coordinates) {
      coordinates = this.visit(ctx.coordinates[0]);
    }
    return {
      type: "componentDeclaration",
      componentName: ctx.StringLiteral[0].image,
      coordinates,
    };
  }

  coordinates(ctx) {
    return [Number(ctx.LHS[0].image), Number(ctx.RHS[0].image)];
  }
}

type CoordinatesASTT = [number, number] | undefined;

interface ComponentDeclarationASTT {
  type: "componentDeclaration";
  componentName: string;
  coordinates: CoordinatesASTT;
}

interface EdgeDeclarationASTT {
  type: "edgeDeclaration";
  lhs: string;
  rhs: string;
}

type DeclarationASTT = ComponentDeclarationASTT | EdgeDeclarationASTT;

export type WardleyASTT = DeclarationASTT[];

export function parseInput(text: string) {
  parserInstance.input = lexer.tokenize(text).tokens;

  // Initiate parse from top level declaration ("wardley")
  const cst = parserInstance.wardley();
  if (parserInstance.errors.length > 0) {
    throw Error("Parsing errors detected\n" + parserInstance.errors[0].message);
  }

  const visitorInstance = new WardleyVisitor();

  return visitorInstance.visit(cst) as WardleyASTT;
}