process.env.TZ = "GMT";
module.exports = {
  projects: [
    {
      displayName: "UNIT",
      testMatch: ["<rootDir>/tests/**/*.unitTest.ts"],
      preset: "ts-jest",
      testEnvironment: "node",
      roots: ["<rootDir>/tests"],
      setupFiles: ["jest-plugin-context/setup"],
      moduleFileExtensions: ["js", "ts"],
      testResultsProcessor: "jest-sonar-reporter",
      transform: {
        "^.+\\.tsx?$": "ts-jest",
      },
    },
    {
      displayName: "INTEGRATION",
      testMatch: ["<rootDir>/tests/**/*.intTest.ts"],
      preset: "ts-jest",
      testEnvironment: "node",
      roots: ["<rootDir>/tests"],
      setupFiles: ["jest-plugin-context/setup"],
      moduleFileExtensions: ["js", "ts"],
      testResultsProcessor: "jest-sonar-reporter",
      transform: {
        "^.+\\.tsx?$": "ts-jest",
      },
      runner: "jest-serial-runner",
      ignoreCoveragePathPatterns: ['/opt/']
    }
    ],
  };
