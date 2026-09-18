import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

const client = isLambda
  ? new DynamoDBClient({})
  : new DynamoDBClient({
      region: "us-east-1",
      endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
      credentials: {
        accessKeyId: "DUMMYIDEXAMPLE",
        secretAccessKey: "DUMMYEXAMPLEKEY",
      },
    });

const docClient = DynamoDBDocumentClient.from(client);

export { docClient };
