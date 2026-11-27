module.exports = {
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@multispeciality-hms/contracts$': '<rootDir>/../../../packages/contracts/src/index.ts',
    '^@multispeciality-hms/shared-types$': '<rootDir>/../../../packages/shared-types/src/index.ts',
    '^@multispeciality-hms/validation$': '<rootDir>/../../../packages/validation/src/index.ts',
    '^@multispeciality-hms/config$': '<rootDir>/../../../packages/config/src/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
