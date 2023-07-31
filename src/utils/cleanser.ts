declare global {
  interface Array<T> {
    /**
     * First trims whitespace from string items.
     * Secondly sets any items with an empty string to null.
     *
     * @returns A new array with the cleansed items.
     */
    fingerprintCleanser(): T[];
  }
}

if (!Array.prototype.fingerprintCleanser) {
  Object.defineProperty(Array.prototype, "fingerprintCleanser", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function fingerprintCleanser(this: any[]): any[] {
      return this.map((i) => (typeof i === "string" ? i?.trim() : i)).map((i) =>
        i === "" ? null : i
      );
    },
  });
}

export function vinCleanser(vin: string | undefined): string {
  return vin ? vin.replace(/[^a-zA-Z0-9]/g, "") : "";
}
