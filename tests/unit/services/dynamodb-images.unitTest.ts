import { DynamoDbImage } from "../../../src/services/dynamodb-images";
import { default as primitivesJson } from "../../resources/dynamodb-image-primitives.json";
import { default as stringDateTime } from "../../resources/dynamodb-image-string-timestamps.json";
import { default as setsJson } from "../../resources/dynamodb-image-sets.json";
import { default as listJson } from "../../resources/dynamodb-image-list.json";
import { default as mapJson } from "../../resources/dynamodb-image-map.json";
import { default as nestedJson } from "../../resources/dynamodb-image-nested.json";
import { castToImageShape } from "../../utils";

describe("parse()", () => {
  it("should parse a Dynamo image containing all primitive types", () => {
    const image = DynamoDbImage.parse(castToImageShape(primitivesJson));
    expect(image.getNull("NullField")).toEqual(null);
    expect(image.getBoolean("BooleanField")).toEqual(true);
    expect(image.getNumber("NumberField")).toEqual(123.45);
    expect(image.getString("StringField")).toEqual("Hello");
    expect(image.getBinary("BinaryField")!.toString("utf-8")).toEqual(
      "this text is base64-encoded"
    );
  });

  it("should parse a Dynamo image containing all primitive types", () => {
    const image = DynamoDbImage.parse(castToImageShape(stringDateTime));
    expect(image.getDate("StringISOTimestampField")).toEqual(
      "2023-02-16 12:07:22.056"
    );
    expect(image.getDate("StringDateField")).toEqual("2023-02-16 00:00:00.000");
  });

  it("should parse a Dynamo image containing all set types", () => {
    const image = DynamoDbImage.parse(castToImageShape(setsJson));
    expect(image.getStrings("StringsField")).toEqual([
      "Giraffe",
      "Hippo",
      "Zebra",
    ]);
    expect(image.getNumbers("NumbersField")).toEqual([42.2, -19, 7.5, 3.14]);
    expect(
      image.getBinaries("BinariesField").map((b: Buffer) => b.toString("utf-8"))
    ).toEqual(["Sunny", "Rainy", "Snowy"]);
  });

  it("should parse a Dynamo image containing a list type", () => {
    const image = DynamoDbImage.parse(castToImageShape(listJson));
    expect(image.getList("ListField")!.getString("0")).toEqual("Cookies");
    expect(image.getList("ListField")!.getString("1")).toEqual("Coffee");
    expect(image.getList("ListField")!.getNumber("2")).toEqual(3.14159);
  });

  it("should parse a Dynamo image containing a map type", () => {
    const image = DynamoDbImage.parse(castToImageShape(mapJson));

    const expectedMap: DynamoDbImage = DynamoDbImage.parse({
      Name: { S: "Joe" },
      Age: { N: "35" },
    });

    expect(image.getMap("MapField")).toEqual(expectedMap);
  });

  it("should access nested values correctly", () => {
    const image = DynamoDbImage.parse(castToImageShape(nestedJson));

    const nestedListField: DynamoDbImage = image
      .getMap("ParentMapField")!
      .getList("ListField")!;
    expect(nestedListField.getString("0")).toEqual("Hello");
    expect(nestedListField.getMap("1")!.getString("StringField")).toEqual(
      "Hello"
    );

    const nestedMapField: DynamoDbImage = image
      .getList("ParentListField")!
      .getMap("0")!;
    expect(nestedMapField.getString("StringField")).toEqual("Hello");
    expect(nestedMapField.getList("ListField")!.getString("0")).toEqual(
      "Hello"
    );
  });

  it("should fail on request for incorrect type", () => {
    const image = DynamoDbImage.parse(castToImageShape(primitivesJson));
    expect(() => image.getString("NumberField")).toThrowError("not of type");
  });

  it("should handle a number when presented as a null", () => {
    let image = DynamoDbImage.parse(
      castToImageShape({ NumberField: { NULL: true } })
    );
    expect(image.getNumber("NumberField")).toEqual(undefined);
  });

  it("should handle a number when presented as a string", () => {
    let image = DynamoDbImage.parse(
      castToImageShape({ NumberField: { S: "2.2" } })
    );
    expect(image.getNumber("NumberField")).toEqual(2.2);

    image = DynamoDbImage.parse(castToImageShape({ NumberField: { S: "22" } }));
    expect(image.getNumber("NumberField")).toEqual(22);

    image = DynamoDbImage.parse(
      castToImageShape({ NumberField: { S: "-2.2" } })
    );
    expect(image.getNumber("NumberField")).toEqual(-2.2);

    image = DynamoDbImage.parse(castToImageShape({ NumberField: { S: ".2" } }));
    expect(image.getNumber("NumberField")).toEqual(0.2);
  });

  it("should reject a number when presented as non numerical strings", () => {
    let image = DynamoDbImage.parse(
      castToImageShape({ NumberField: { S: " " } })
    );
    expect(() => image.getNumber("NumberField")).toThrowError("not of type");

    image = DynamoDbImage.parse(castToImageShape({ NumberField: { S: "" } }));
    expect(() => image.getNumber("NumberField")).toThrowError("not of type");

    image = DynamoDbImage.parse(castToImageShape({ NumberField: { S: "." } }));
    expect(() => image.getNumber("NumberField")).toThrowError("not of type");

    image = DynamoDbImage.parse(
      castToImageShape({ NumberField: { S: "1.." } })
    );
    expect(() => image.getNumber("NumberField")).toThrowError("not of type");

    image = DynamoDbImage.parse(
      castToImageShape({ NumberField: { S: "..1" } })
    );
    expect(() => image.getNumber("NumberField")).toThrowError("not of type");

    image = DynamoDbImage.parse(
      castToImageShape({ NumberField: { S: "1aa" } })
    );
    expect(() => image.getNumber("NumberField")).toThrowError("not of type");

    image = DynamoDbImage.parse(
      castToImageShape({ NumberField: { S: "aa1" } })
    );
    expect(() => image.getNumber("NumberField")).toThrowError("not of type");

    image = DynamoDbImage.parse(
      castToImageShape({ NumberField: { S: "string" } })
    );
    expect(() => image.getNumber("NumberField")).toThrowError("not of type");
  });
});
