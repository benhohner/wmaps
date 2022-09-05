function escapeRegex(string: string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export const matchComponentRegex = (componentName: string) =>
  `(component[ \\t]+${escapeRegex(
    componentName
  )})([ \\t]+)?(\\[.+\\])?([ \\t]+)?(\\/.*)?$`;
