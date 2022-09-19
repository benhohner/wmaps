function escapeRegex(string: string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

// BUG: fix add match for definitionidentifiers, update functions
// that reference this so they replace the correct number of matches
export const matchComponentRegex = (componentName: string) =>
  `(^[ \\t]*${escapeRegex(
    componentName
  )})([ \\t]+)?(\\[.+\\])?([ \\t]+)?(\\(.*\\))?([ \\t]+)?(\\{.*)?([ \\t]+)?(\\\/.*)?$`;

// OPTIONAL WHITESPACE
// $.CONSUME(StringLiteral, { LABEL: "LHS" });
// $.CONSUME(Edge);
// $.CONSUME1(StringLiteral, { LABEL: "RHS" });
// OPTIONAL WHITESPACE
// OPTIONAL COMMENT

// BUG:: update to new togetherscript syntax
export const matchEdgeRegex = (edgeComponentName: string) =>
  `^([ \\t]+)?(${escapeRegex(
    edgeComponentName
  )})(?:[ \\t]+)?\\.|\\.([ \\t]+)?(${escapeRegex(
    edgeComponentName
  )})(?:[ \\t]+)?(?:\\\/.*)?$`;
