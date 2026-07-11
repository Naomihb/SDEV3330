module.exports = {
  cookies: () => ({ get: jest.fn(), set: jest.fn() }),
  headers: () => ({ get: jest.fn() }),
}
