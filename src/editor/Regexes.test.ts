import { replaceCoordinatesRegex } from "./Regexes";

import { it, expect, describe, vitest } from "vitest";

const testRegex = (componentName: string, testString: string) => {
  const regexp = new RegExp(replaceCoordinatesRegex(componentName), "gm");
  return regexp.test(testString);
};

const genTruthyTest = (componentName: string, testString: string) => {
  return it(`matches component "${componentName}" in "${testString.replace(
    /\n|\r/g,
    ""
  )}"`, () => {
    expect(testRegex(componentName, testString)).toBeTruthy();
  });
};

const genFalsyTest = (componentName: string, testString: string) => {
  return it(`doesn't match component "${componentName}" in "${testString.replace(
    /\n|\r/g,
    ""
  )}"`, () => {
    expect(testRegex(componentName, testString)).toBeFalsy();
  });
};

describe("replaceCoordinatesRegex", () => {
  genTruthyTest("corn", "component corn");
  genTruthyTest("corn", "component corn// comment");
  genTruthyTest("corn", "component corn // comment");
  genTruthyTest("corn", "component corn  // comment");
  genTruthyTest("corn", "component corn  \t// comment");
  genTruthyTest("corn", "component corn [-1.3, 2.3e1]");
  genTruthyTest("corn", " component corn [-1.3, 2.3e1]");
  genTruthyTest("corn", "component corn[-1.3,2.3]");
  genTruthyTest("corn", "component corn[-1.3,2.3]//[0.3,0.5]");
  genTruthyTest("corn", "component corn [-1.3, 2.3e1] ");
  genFalsyTest("corn", "component corn  hole");
  genFalsyTest("corn", "component corn  hole [0.3, 0.4]");
  genFalsyTest("corn", "component corn \t hole ///");
  genFalsyTest("corn", "component corn hole//comment");
  genFalsyTest("corn", "component cornhole");
});
