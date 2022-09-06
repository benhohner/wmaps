function escapeRegex(string: string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export const matchComponentRegex = (componentName: string) =>
  `(component[ \\t]+${escapeRegex(
    componentName
  )})([ \\t]+)?(\\[.+\\])?([ \\t]+)?(\\\/.*)?$`;

// OPTIONAL WHITESPACE
// $.CONSUME(StringLiteral, { LABEL: "LHS" });
// $.OPTION(() => $.CONSUME(WhiteSpace));
// $.CONSUME(Edge);
// $.OPTION1(() => $.CONSUME1(WhiteSpace));
// $.CONSUME1(StringLiteral, { LABEL: "RHS" });
// OPTIONAL WHITESPACE
// OPTIONAL COMMENT

export const matchEdgeRegex = (edgeComponentName: string) =>
  `^([ \\t]+)?(${escapeRegex(
    edgeComponentName
  )})(?:[ \\t]+)?->|->([ \\t]+)?(${escapeRegex(
    edgeComponentName
  )})(?:[ \\t]+)?(?:\\\/.*)?$`;
