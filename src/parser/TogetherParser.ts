import {
  createToken,
  Lexer,
  CstParser,
  ParserMethod,
  CstNode,
  TokenType,
  ITokenConfig,
  ILexingError,
} from "chevrotain";

import XRegExp from "xregexp";

// Fragment dictionary
const f: { [key: string]: RegExp } = {};

// Create re-usable fragments using xRegExp
function FRAGMENT(name: string, def: string | RegExp) {
  f[name] = XRegExp.build(def as string, f);
}

// Create a pattern using previously defined fragments
// function MAKE_PATTERN(def: string, flags?: Flags) {
//   return XRegExp.build(def, f, flags);
// }

// Return a fragment from the fragment dictionary in a composable form
function C(name: string) {
  return f[name].source;
}

const createComposableToken = ({
  name,
  pattern,
  ...args
}: ITokenConfig): TokenType => {
  FRAGMENT(name, pattern as string | RegExp);
  return createToken({
    name,
    pattern: RegExp(pattern as string | RegExp),
    ...args,
  });
};

// define fragments
FRAGMENT("BaseWhitespace", " \\t");
FRAGMENT("Command", "\\/");
FRAGMENT("EdgeJoin", "\\.");
FRAGMENT("Assign", "=");
FRAGMENT("DefinitionSpecifier", ":");
FRAGMENT("FutureSpecifier", "\\^");
FRAGMENT("NoteSpecifier", "#");
FRAGMENT("QuoteSingle", "'");
FRAGMENT("QuoteDouble", '"');
FRAGMENT("Comma", ",");
FRAGMENT("ParenOpen", "\\(");
FRAGMENT("ParenClose", "\\)");
FRAGMENT("BraceOpen", "\\{");
FRAGMENT("BraceClose", "\\}");
FRAGMENT("BracketOpen", "\\[");
FRAGMENT("BracketClose", "\\]");
FRAGMENT("IdentifierSymbols", `'"~\`!@$%&\\*\\-_+\\|\\\\;\\?`);

// Strings
const StringLiteral = createComposableToken({
  name: "StringLiteral",
  pattern: `"(.*?)"|'(.*?)'`,
});

const Comment = createComposableToken({
  name: "Comment",
  pattern: `\/\/.*`,
  group: Lexer.SKIPPED,
});

// Reserved Symbols
// gotta escape - / \ ^ $ * + ? . ( ) | [ ] { }
const Command = createComposableToken({
  name: "Command",
  pattern: "\\/[a-zA-Z][a-zA-Z0-9]*",
  longer_alt: Comment,
});
const EdgeJoin = createComposableToken({ name: "EdgeJoin", pattern: "\\." });
const Assign = createComposableToken({ name: "Assign", pattern: "=" });
const DefinitionSpecifier = createComposableToken({
  name: "DefinitionSpecifier",
  pattern: ":",
});
const AttributeSubvalueSpecifier = createComposableToken({
  name: "AttributeSubvalueSpecifier",
  pattern: ":",
});
const FutureSpecifier = createComposableToken({
  name: "FutureSpecifier",
  pattern: "\\^",
});
const NoteSpecifier = createComposableToken({
  name: "NoteSpecifier",
  pattern: "#",
});
const Comma = createComposableToken({
  name: "Comma",
  pattern: ",",
});
const ParenOpen = createComposableToken({
  name: "ParenOpen",
  pattern: "\\(",
  push_mode: "attribute_mode",
});
const ParenClose = createComposableToken({
  name: "ParenClose",
  pattern: "\\)",
  pop_mode: true,
});
const BraceOpen = createComposableToken({ name: "BraceOpen", pattern: "\\{" });
const BraceClose = createComposableToken({
  name: "BraceClose",
  pattern: "\\}",
});
const BracketOpen = createComposableToken({
  name: "BracketOpen",
  pattern: "\\[",
});
const BracketClose = createComposableToken({
  name: "BracketClose",
  pattern: "\\]",
});

// Skipped Symbols
const Newline = createComposableToken({
  name: "Newline",
  pattern: "\\r\\n|\\n",
  group: Lexer.SKIPPED,
});
const Whitespace = createComposableToken({
  name: "Whitespace",
  pattern: `[${C("BaseWhitespace")}]+`,
  // group: Lexer.SKIPPED,
});
const AttributeBreak = createComposableToken({
  name: "AttributeBreak",
  pattern: `[${C("BaseWhitespace")}\\r\\n]+`,
});

// Identifiers & Keywords
const AttributeIdentifier = createToken({
  name: "AttributeIdentifier",
  pattern: /[a-zA-Z_][a-zA-Z0-9-]*/,
});

const Identifier = createToken({
  name: "Identifier",
  // not // / . = : ^ ' " , ( ) { } [ ]
  pattern: new RegExp(
    `[a-zA-Z0-9${C("IdentifierSymbols")}]+([ ]+[a-zA-Z0-9${C(
      "IdentifierSymbols"
    )}]+)*`
  ),
});

// Tokens are out of order because of longer_alt
const NumberLiteral = createToken({
  name: "NumberLiteral",
  pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/,
  longer_alt: Identifier,
});

const AttributeNumberLiteral = createToken({
  name: "NumberLiteral",
  pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/,
});

export const togetherTokens = {
  modes: {
    normal_mode: [
      Command,
      EdgeJoin,
      DefinitionSpecifier,
      FutureSpecifier,
      NoteSpecifier,
      // only because brackets with coords for now
      Comma,
      ParenOpen,
      BraceOpen,
      BraceClose,
      BracketOpen,
      BracketClose,

      Whitespace,
      Newline,
      Comment,

      // only because brackets with coords for now
      NumberLiteral,
      Identifier,
    ],
    attribute_mode: [
      Assign,
      AttributeSubvalueSpecifier,
      Comma,
      ParenClose,

      AttributeBreak,
      Comment,

      StringLiteral,
      AttributeNumberLiteral,
      AttributeIdentifier,
    ],
  },
  defaultMode: "normal_mode",

  // can match anything, have to come last
  // Name,
};

// ============== Lexer ===============
export const TogetherLexer = new Lexer(togetherTokens, {
  // Optimize position info for performance
  // positionTracking: "onlyStart",
  // Throw error if Lexer isn't able to use all optimizations
  // disabled because /[^]/ (Complement Sets) can't be optimized
  ensureOptimizations: true,
});

// ============== Parser ==============
class TogetherParser extends CstParser {
  public default!: ParserMethod<[], CstNode>;
  private statement!: ParserMethod<[], CstNode>;
  private command!: ParserMethod<[], CstNode>;
  private attributes!: ParserMethod<[], CstNode>;
  private attribute!: ParserMethod<[], CstNode>;
  private edgeDeclaration!: ParserMethod<[], CstNode>;
  private componentDeclaration!: ParserMethod<[], CstNode>;
  private coordinates!: ParserMethod<[], CstNode>;
  private note!: ParserMethod<[], CstNode>;

  constructor(tokens: typeof togetherTokens) {
    super(tokens, {
      // This can cause some problems
      // TODO: enable once debugged
      recoveryEnabled: false,
    });

    // shorthand for easier writing and comprehension
    const $ = this;

    $.default = $.RULE("default", () => {
      $.MANY(() => {
        $.OR([
          { ALT: () => $.CONSUME(Newline) },
          { ALT: () => $.SUBRULE($.statement) },
          { ALT: () => $.CONSUME(Comment) },
          { ALT: () => $.CONSUME(Whitespace) },
        ]);
      });
    });

    $.statement = $.RULE("statement", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.command) },
        {
          GATE: $.BACKTRACK($.edgeDeclaration),
          ALT: () => $.SUBRULE($.edgeDeclaration),
        },
        {
          GATE: $.BACKTRACK($.componentDeclaration),
          ALT: () => $.SUBRULE($.componentDeclaration),
        },
        { ALT: () => $.SUBRULE($.note) },
      ]);
      $.OPTION(() => $.CONSUME(Whitespace));
    });

    $.command = $.RULE("command", () => {
      $.CONSUME(Command);
      $.OPTION(() => $.SUBRULE($.attributes));
    });

    $.attributes = $.RULE("attributes", () => {
      $.CONSUME(ParenOpen);
      $.MANY(() => {
        $.OR([
          {
            ALT: () => $.SUBRULE($.attribute),
          },
          {
            ALT: () => $.CONSUME(AttributeBreak),
          },
        ]);
      });
      $.CONSUME(ParenClose);
    });

    $.attribute = $.RULE("attribute", () => {
      $.CONSUME(AttributeIdentifier, { LABEL: "AttributeName" });
      $.OPTION(() => {
        $.CONSUME(Assign);
        $.OR([
          {
            ALT: () => {
              $.CONSUME1(AttributeNumberLiteral);
              $.OPTION1(() => {
                $.CONSUME(Comma);
                $.CONSUME2(AttributeNumberLiteral);
              });
            },
          },
          {
            ALT: () => {
              $.CONSUME(StringLiteral);
            },
          },
          {
            ALT: () => {
              $.MANY_SEP({
                SEP: Comma,
                DEF: () => {
                  $.CONSUME1(AttributeIdentifier);
                  $.OPTION2(() => {
                    $.CONSUME2(AttributeSubvalueSpecifier);
                    $.CONSUME3(AttributeNumberLiteral);
                  });
                },
              });
            },
          },
        ]);
      });
    });

    $.componentDeclaration = $.RULE("componentDeclaration", () => {
      $.CONSUME(Identifier);
      $.OPTION(() => {
        $.CONSUME(DefinitionSpecifier);
        $.CONSUME(NumberLiteral);
      });
      $.OPTION1(() => {
        $.CONSUME(Whitespace);
        $.SUBRULE($.coordinates);
      });
      $.OPTION2(() => {
        $.CONSUME1(Whitespace);
        $.SUBRULE($.attributes);
      });
      $.OPTION3(() => {
        $.CONSUME2(Whitespace);
        $.CONSUME(BraceOpen);
        $.MANY(() => {
          $.OPTION4(() => $.CONSUME3(Whitespace));
          $.SUBRULE($.statement, { LABEL: "Pipeline" });
        });
        $.CONSUME(BraceClose);
      });
      $.OPTION5(() => {
        $.CONSUME4(Whitespace);
      });
    });

    $.edgeDeclaration = $.RULE("edgeDeclaration", () => {
      $.CONSUME(Identifier, { LABEL: "LHS" });
      $.CONSUME(EdgeJoin);
      $.OPTION(() => $.SUBRULE($.attributes));
      $.CONSUME1(Identifier, { LABEL: "RHS" });
      $.OPTION1(() => $.CONSUME(Whitespace));
    });

    $.coordinates = $.RULE("coordinates", () => {
      $.CONSUME(BracketOpen);
      $.CONSUME(NumberLiteral, { LABEL: "LHS" });
      $.OPTION1(() => $.CONSUME1(Whitespace));
      $.CONSUME(Comma);
      $.OPTION2(() => $.CONSUME2(Whitespace));
      $.CONSUME1(NumberLiteral, { LABEL: "RHS" });
      $.CONSUME(BracketClose);
    });

    $.note = $.RULE("note", () => {
      $.CONSUME(NoteSpecifier);
      $.OPTION(() => $.CONSUME(Whitespace));
      $.CONSUME(Identifier);
      $.OPTION1(() => {
        $.CONSUME1(Whitespace);
        $.SUBRULE($.coordinates);
      });
    });

    // very important to call this after all the rules have been setup.
    // otherwise the parser may not work correctly as it will lack information
    // derived from the self analysis.
    this.performSelfAnalysis();
  }
}

const parserInstance = new TogetherParser(togetherTokens);

export const BaseTogetherVisitor =
  parserInstance.getBaseCstVisitorConstructor();

export class TokenError extends Error {
  column: number | undefined = undefined;
  length: number | undefined = undefined;
  line: number | undefined = undefined;
  offset: number | undefined = undefined;
  errors: ILexingError[] = [];

  constructor(message: string | undefined, options?: ErrorOptions | undefined) {
    super(message, options);
  }
}

export function parseToCST(text: string) {
  // Initiate parse from top level aka default rule ("default")
  let tokenized = TogetherLexer.tokenize(text);

  if (tokenized.errors.length > 0) {
    let error = new TokenError("TokenizingError");
    error.errors = tokenized.errors;
    throw error;
  }

  parserInstance.input = tokenized.tokens;
  const cst = parserInstance.default();

  if (parserInstance.errors.length > 0) {
    parserInstance.errors.forEach((e) => {
      throw e;
    });
  }

  return cst;
}

// export function parseToAST(text: string) {
//   const visitorInstance = new WardleyVisitorToAST();
//   return visitorInstance.visit(parseToCST(text)) as WardleyASTT;
// }
