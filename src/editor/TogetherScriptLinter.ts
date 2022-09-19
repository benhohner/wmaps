import { Diagnostic } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";

import { parseToCST, TokenError } from "../parser/TogetherParser";
import {
  MismatchedTokenException,
  NoViableAltException,
  NotAllInputParsedException,
  EarlyExitException,
} from "chevrotain";

export const togetherScriptLinter =
  () =>
  (view: EditorView): Diagnostic[] => {
    try {
      parseToCST(view.state.doc.toString());
    } catch (e) {
      let from = 0;
      let to = 0;
      let message = "";

      if (e instanceof TokenError) {
        let errors = [];
        return e.errors.map((error) => {
          return {
            from: error.offset,
            message: error.message,
            severity: "error",
            to: (error.offset || 0) + 1,
          };
        });
      } else if (
        e instanceof MismatchedTokenException ||
        e instanceof NoViableAltException ||
        e instanceof NotAllInputParsedException ||
        e instanceof EarlyExitException
      ) {
        let error = e;
        from = error.token.startOffset;
        to = error.token.endOffset
          ? error.token.endOffset + 1
          : view.state.doc.length;
        message = `${error.message}`;

        return [
          {
            from,
            message,
            severity: "error",
            to,
          },
        ];
      } else {
        console.error(e);
        return [];
      }
    }
    return [];
  };
