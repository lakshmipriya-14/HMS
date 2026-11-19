module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@multispeciality-hms/contracts$': '<rootDir>/../packages/contracts/src/index.ts',
    '^@multispeciality-hms/shared-types$': '<rootDir>/../packages/shared-types/src/index.ts',
    '^@multispeciality-hms/validation$': '<rootDir>/../packages/validation/src/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
