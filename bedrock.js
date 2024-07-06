/*
 * Invoke AWS Bedrock LLM model in guest mode using AWS SDK for JavaScript
 *
 *
 * Install AWS SDK:
 *
 * npm install @aws-sdk/client-cognito-identity @aws-sdk/client-sts @aws-sdk/client-bedrock-runtime
 * or
 * yarn add @aws-sdk/client-cognito-identity @aws-sdk/client-sts @aws-sdk/client-bedrock-runtime
 *
 *
 * Prerequisites:
 *
 * 1. Make sure your organization have access to at least one Bedrock model in at least one of the region.
 * 2. Create an AWS Cognito Identity pool using basic (classic) authentication.
 * 3. Create a guest role in the identity pool.
 * 4. Grant the role a policy with full access to Bedrock.
 * 5. Copy the region name, identity pool ID and role ARN string.
 * 6. Modify the variables below, including prompt and streamMode.
 */

// prompt for bedrock model
const prompt = `

Human: Please invent a fake programming language for cats.

Assistant:`;

// streaming output mode
const streamingMode = false;

// bedrock resource
const region = "{region}";
const cognitoIdentityPoolId = `${region}:00000000-0000-0000-0000-000000000000`;
const bedrockRoleArn =
  "arn:aws:iam::000000000000:role/service-role/{AWSRoleForBedrockName}";
const modelId = "anthropic.claude-v2";
const modelParams = {
  prompt: prompt,
  max_tokens_to_sample: 2048,
  temperature: 0.1,
  top_p: 0.9,
};

/*
 * Execute:
 *
 * > node bedrock.js
 */

// ================================================================================

import {
  CognitoIdentityClient,
  GetIdCommand,
  GetOpenIdTokenCommand,
} from "@aws-sdk/client-cognito-identity";
import {
  STSClient,
  AssumeRoleWithWebIdentityCommand,
} from "@aws-sdk/client-sts";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

(async () => {
  try {
    const config = {
      region: region,
    };

    // get guest identity id

    const cognitoClient = new CognitoIdentityClient(config);
    /** @type {import('@aws-sdk/client-cognito-identity').GetIdCommandOutput} */
    const idResponse = await cognitoClient.send(
      new GetIdCommand({
        IdentityPoolId: cognitoIdentityPoolId,
      })
    );
    const id = idResponse.IdentityId;

    // get access token

    /** @type {import('@aws-sdk/client-cognito-identity').GetOpenIdTokenCommandOutput} */
    const tokenResponse = await cognitoClient.send(
      new GetOpenIdTokenCommand({
        IdentityId: id,
      })
    );
    const token = tokenResponse.Token;

    // get credential with session policy

    const stsClient = new STSClient(config);
    /** @type {import('@aws-sdk/client-sts').AssumeRoleWithWebIdentityCommandOutput} */
    const credentialsResponse = await stsClient.send(
      new AssumeRoleWithWebIdentityCommand({
        RoleArn: bedrockRoleArn,
        WebIdentityToken: token,
        RoleSessionName: "bedrock_session",
      })
    );
    const credentials = credentialsResponse.Credentials;

    // get bedrock client using the credential

    const bedrockClient = new BedrockRuntimeClient({
      region: region,
      credentials: {
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        expiration: credentials.Expiration,
        sessionToken: credentials.SessionToken,
      },
    });

    // invoke bedrock model

    if (!streamingMode) {
      // non-streaming mode

      /** @type {import('@aws-sdk/client-bedrock-runtime').InvokeModelCommandOutput} */
      const bedrockResponse = await bedrockClient.send(
        new InvokeModelCommand({
          body: JSON.stringify(modelParams), // required
          modelId: modelId, // required
          accept: "application/json",
          contentType: "application/json",
        })
      );

      // decode reply
      const bedrockReply = JSON.parse(
        new TextDecoder().decode(bedrockResponse.body)
      );

      // write output to console
      console.log(prompt + bedrockReply.completion);
    } else {
      // streaming mode

      /** @type {import('@aws-sdk/client-bedrock-runtime').InvokeModelWithResponseStreamCommandOutput} */
      const bedrockResponse = await bedrockClient.send(
        new InvokeModelWithResponseStreamCommand({
          body: JSON.stringify(modelParams), // required
          modelId: modelId, // required
          accept: "application/json",
          contentType: "application/json",
        })
      );

      // write streaming output to console (node only)

      process.stdout.write(prompt);

      for await (const body of bedrockResponse.body) {
        if (body?.chunk?.bytes) {
          try {
            const reply = JSON.parse(
              new TextDecoder().decode(body.chunk.bytes)
            );
            process.stdout.write(reply.completion);
          } catch (e) {}
        }
      }
      process.stdout.write("\n");
    }
  } catch (e) {
    console.log(e);
  }
})();
