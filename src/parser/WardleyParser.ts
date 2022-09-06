import {
  createToken,
  Lexer,
  CstParser,
  ICstVisitor,
  ParserMethod,
  CstNode,
} from "chevrotain";

export function WardleyScript() {
  // ----------------- Lexer -----------------
  const Component = createToken({ name: "Component", pattern: /component/ });
  const Inertia = createToken({ name: "Inertia", pattern: /inertia/ });
  const Edge = createToken({ name: "Edge", pattern: /->/, label: "'->'" });
  const Comment = createToken({
    name: "Comment",
    pattern: /\/\/[^\n\r]*/,
    group: Lexer.SKIPPED,
  });

  const LSquare = createToken({ name: "LSquare", pattern: /\[/, label: "'['" });
  const RSquare = createToken({ name: "RSquare", pattern: /]/, label: "']'" });
  const Comma = createToken({ name: "Comma", pattern: /,/, label: "','" });

  const NewLine = createToken({
    name: "NewLine",
    pattern: /\r?\n+/,
    line_breaks: true,
  });

  // TODO: string literal starting with a number matches numberliteral, need to do lookahead
  const StringLiteral = createToken({
    name: "StringLiteral",
    pattern:
      /[a-zA-Z0-9_\+:\?!@#$%^&\*\(\)\{\}\/\`~]+([ -]+[a-zA-Z0-9_\+:\?!@#$%^&\*\(\)\{\}\/\`~]+)*/,
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
    Comment,
    NumberLiteral,
    StringLiteral,
    NewLine,
    WhiteSpace,
    SkippedWhiteSpace,
  ];

  const WardleyLexer = new Lexer(wardleyTokens, {
    // Less position info tracked, reduces verbosity of the playground output.
    // positionTracking: "onlyStart",
  });

  // ----------------- parser -----------------
  class WardleyParser extends CstParser {
    public wardley!: ParserMethod<[], CstNode>;
    private declaration!: ParserMethod<[], CstNode>;
    private edgeDeclaration!: ParserMethod<[], CstNode>;
    private componentDeclaration!: ParserMethod<[], CstNode>;
    private coordinates!: ParserMethod<[], CstNode>;

    constructor() {
      super(wardleyTokens, {
        // This can cause some problems
        recoveryEnabled: true,
      });

      // shorthand for easier writing and comprehension
      const $ = this;

      $.wardley = $.RULE("wardley", () => {
        $.MANY(() => {
          $.OR([
            { ALT: () => $.CONSUME(Comment) },
            { ALT: () => $.SUBRULE($.declaration) },
            { ALT: () => $.CONSUME(NewLine) },
            { ALT: () => $.CONSUME(WhiteSpace) },
          ]);
        });
      });

      $.declaration = $.RULE("declaration", () => {
        $.OR([
          { ALT: () => $.SUBRULE($.componentDeclaration) },
          { ALT: () => $.SUBRULE($.edgeDeclaration) },
        ]);
        $.OPTION(() => $.CONSUME(WhiteSpace));
      });
      $.edgeDeclaration = $.RULE("edgeDeclaration", () => {
        $.CONSUME(StringLiteral, { LABEL: "LHS" });
        $.OPTION(() => $.CONSUME(WhiteSpace));
        $.CONSUME(Edge);
        $.OPTION1(() => $.CONSUME1(WhiteSpace));
        $.CONSUME1(StringLiteral, { LABEL: "RHS" });
      });

      $.componentDeclaration = $.RULE("componentDeclaration", () => {
        $.CONSUME(Component);
        $.CONSUME(WhiteSpace);
        $.CONSUME(StringLiteral);
        $.OPTION(() => $.CONSUME2(WhiteSpace));
        $.OPTION1(() => $.SUBRULE($.coordinates));
      });

      $.coordinates = $.RULE("coordinates", () => {
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

export const BaseWardleyVisitor = parserInstance.getBaseCstVisitorConstructor();
export type BaseWardleyVisitorT = new (...args: any[]) => ICstVisitor<any, any>;

class WardleyVisitorToAST extends BaseWardleyVisitor {
  constructor() {
    super();
    // The "validateVisitor" method is a helper utility which performs static analysis
    // to detect missing or redundant visitor methods
    this.validateVisitor();
  }
  /* Visit methods */
  wardley(ctx: any) {
    if (ctx.declaration) {
      return ctx.declaration.map((dec: any) => this.visit(dec));
    } else {
      return [];
    }
  }

  declaration(ctx: any) {
    let dec = undefined;
    if (ctx.componentDeclaration) {
      dec = this.visit(ctx.componentDeclaration[0]);
    } else if (ctx.edgeDeclaration) {
      dec = this.visit(ctx.edgeDeclaration[0]);
    }
    return dec;
  }

  edgeDeclaration(ctx: any) {
    return {
      type: "edgeDeclaration",
      lhs: ctx.LHS[0].image,
      rhs: ctx.RHS[0].image,
    };
  }

  componentDeclaration(ctx: any) {
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

  coordinates(ctx: any) {
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
    const err = parserInstance.errors[0];

    throw new Error(
      `Error: ${err.name} at line ${err.token.startLine} col ${
        err.token.startColumn
      }\n${err.stack!}`
    );
  }

  const visitorInstance = new WardleyVisitorToAST();
  return visitorInstance.visit(cst) as WardleyASTT;
}

export function parseInputToCST(text: string) {
  parserInstance.input = lexer.tokenize(text).tokens;

  // Initiate parse from top level declaration ("wardley")
  const cst = parserInstance.wardley();

  if (parserInstance.errors.length > 0) {
    const err = parserInstance.errors[0];

    throw new Error(
      `Error: ${err.name} at line ${err.token.startLine} col ${
        err.token.startColumn
      }\n${err.stack!}`
    );
  }

  return cst;
}
