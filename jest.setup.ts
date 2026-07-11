import '@testing-library/jest-dom'

// Silence Next.js server component warnings in tests
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn() }),
  usePathname: () => '/',
}))

// Silence React act() warnings from async state updates in tests
global.IS_REACT_ACT_ENVIRONMENT = true
