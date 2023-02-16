import { padWithZeros } from "../../src/utils/padwithzeros";

describe('padWithZeros', () => {
    it('pads a number with zeros to the left if it is less than the maximum size', () => {
      expect(padWithZeros(7, 3)).toEqual('007');
      expect(padWithZeros(7, 5)).toEqual('00007');
      expect(padWithZeros(42, 3)).toEqual('042');
      expect(padWithZeros(123, 3)).toEqual('123');
      expect(padWithZeros(123, 5)).toEqual('00123');
      expect(padWithZeros(12345, 5)).toEqual('12345');
    });
  });
  

