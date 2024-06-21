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
      transform: {
        "^.+\\.ts?$": "ts-jest",
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
      transform: {
        "^.+\\.ts?$": "ts-jest",
      },
      runner: "jest-serial-runner",
    }
    ],
  };
