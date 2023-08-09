export function padWithZeros(num: number, maxSize: number): string {
  return num.toString().padStart(maxSize, "0");
}
