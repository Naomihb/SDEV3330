/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // stub out CSS, images, and Next.js internals
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^next/navigation$': '<rootDir>/__mocks__/next/navigation.js',
    '^next/headers$': '<rootDir>/__mocks__/next/headers.js',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  collectCoverageFrom: [
    'utils/**/*.ts',
    'lib/**/*.ts',
    'app/api/**/*.ts',
    'components/**/*.tsx',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    // API routes and UI components are covered by the pytest integration
    // suite (tests/integration), not jest — only gate pure logic here.
    './utils/': { branches: 70, functions: 75, lines: 75, statements: 75 },
    './lib/ai/': { branches: 70, functions: 75, lines: 75, statements: 75 },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
      },
    }],
  },
  globals: {},
}

module.exports = config
