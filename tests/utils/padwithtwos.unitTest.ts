import { padWithZeros } from '../../src/utils/padwithzeros';

describe('padWithZeros', () => {
  it('pads a number with zeros to the left if it is less than the maximum size', () => {
    expect(padWithZeros(7, 3)).toBe('007');
    expect(padWithZeros(7, 5)).toBe('00007');
    expect(padWithZeros(42, 3)).toBe('042');
    expect(padWithZeros(123, 3)).toBe('123');
    expect(padWithZeros(123, 5)).toBe('00123');
    expect(padWithZeros(12345, 5)).toBe('12345');
  });
});
