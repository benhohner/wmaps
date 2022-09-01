export const matchComponentRegex = (componentName: string) =>
  `(component[ \\t]+${componentName})([ \\t]+)?(\\[.+\\])?([ \\t]+)?(\\/.*)?$`;
