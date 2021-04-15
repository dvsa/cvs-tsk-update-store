export interface EventSourceArn {
    region: string;
    accountId: string;
    table: string;
    timestamp: string;
}

export const stringToArn = (input: string): EventSourceArn => {
    if (!input || !input.trim()) {
        throw new Error("ARN is null or blank");
    }

    const parts: string[] = split(input, ":", 5);

    if (parts.length !== 6) {
        throw new Error("ARN does not consist of six colon-delimited parts");
    }

    if (parts[0] !== "arn") {
        throw new Error("ARN part 0 should be exact string \'arn\'");
    }

    if (parts[1] !== "aws") {
        throw new Error("ARN part 1 should be exact string \'aws\'");
    }

    if (parts[2] !== "dynamodb") {
        throw new Error("ARN part 2 is not \'dynamodb\' - this is not a DynamoDB ARN");
    }

    const pathParts = parts[5].split("/");

    if (pathParts.length < 4) {
        throw new Error("ARN path should consist of at least four parts: table/{tableName}/stream/{timestamp}/");
    }

    if (pathParts[0] !== "table") {
        throw new Error("ARN path part 0 should be exact string \'table\'");
    }

    if (pathParts[2] !== "stream") {
        throw new Error("ARN path part 2 should be exact string \'stream\'");
    }

    return {
        region: parts[3],
        accountId: parts[4],
        table: pathParts[1],
        timestamp: pathParts[3],
    };
};

/**
 * Split a string into substrings using the specified separator, and return them as an array.
 *
 * This differs from String.prototype.slice() in that using a limit does not truncate the input string.
 *
 * Example: given const s: string = "a:b:c:d",
 * s.split(":", 2)  = ["a", "b"]
 * split(s, ":", 2) = ["a", "b", "c:d"]
 *
 * @param s the string to split
 * @param separator the separator or delimiter to use
 * @param limit the number of separators to encounter before returning (see example above)
 */
const split = (s: string, separator: string, limit: number): string[] => {
    const tmp = s.split(separator);

    const parts = tmp.splice(0, limit);

    parts.push(tmp.join(separator));

    return parts;
};
