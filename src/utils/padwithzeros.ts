export function padWithZeros(num: number, maxSize: number): string {
    const numString = num.toString();
    const numZeros = maxSize - numString.length;
    if (numZeros <= 0) {
      return numString;
    } else {
      return "0".repeat(numZeros) + numString;
    }
  }
