# Invoke AWS Bedrock LLM Model Using AWS SDK for JavaScript

A basic script of invoking an AWS Bedrock LLM model (using Anthropic Claude v2 as example) and get responses.

## Prerequisites

1. Make sure your organization [have access to at least one Bedrock model](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html) in at least one of the region.
2. Create an [**AWS Cognito Identity pool**](https://docs.aws.amazon.com/cognito/latest/developerguide/identity-pools.html) using **Guest access** and **Basic (classic) authentication**.
3. Create a [**IAM role**](https://docs.aws.amazon.com/cognito/latest/developerguide/iam-roles.html) in the identity pool and grant it the [**permission with Bedrock full access policy**](https://github.com/aws-samples/amazon-bedrock-workshop#enable-aws-iam-permissions-for-bedrock).
4. Copy the region name, identity pool ID string and the role's ARN (Amazon Resource Name) string to replace  the variables in the script [`bedrock.js`](https://github.com/alankrantas/aws-sdk-js-bedrock-llm-example/blob/main/bedrock.js):

```javascript
const region = "{region}";
const cognitoIdentityPoolId = `${region}:00000000-0000-0000-0000-000000000000`;
const bedrockRoleArn =
  "arn:aws:iam::000000000000:role/service-role/{AWSRoleForBedrockName}";
```

> The reason of having to access Bedrock in guest mode is due to the [session policy behavior/design of the STS client](https://github.com/aws/aws-sdk-js/issues/4303#issuecomment-1603405731). You'll have to encode/hide the identity pool ID as well as the role ARN.

## Install AWS SDK for JavaScript

```bash
npm install @aws-sdk/client-cognito-identity @aws-sdk/client-sts @aws-sdk/client-bedrock-runtime
// or
yarn add ...
```

> For additional SDK reference, see [Get started in the browser](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/getting-started-browser.html) and [Developer Reference](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/).

## Configure Prompt and Parameters

```javascript
// streaming output mode
const streamingMode = false;

// model prompt
const prompt = `

Human: Please invent a fake programming language for cats.

Assistant:`;

// model params
const modelId = "anthropic.claude-v2";
const modelParams = {
  prompt: prompt,
  max_tokens_to_sample: 2048,
  temperature: 0.1,
  top_p: 0.9,
};
```

> See [Anthropic Claude Text Completions API](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-text-completion.html) and [Prompt engineering overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) for how to configure the prompt and parameters.

### Notes

1. The non-streaming mode (wait until all responses returned) should be able to work in browser (not tested).
2. The streaming output mode (by setting `streamingMode` to `true`) uses `process` of Node.js to print string without new lines. But you can get the idea of how the streaming works.

## Execute Example

```bash
node bedrock.js
```

### Example Output

```

Human: Please invent a fake programming language for cats.

Assistant: Here is an idea for a fake programming language for cats:

MeowScript

- Variables are called "mice" instead of variables. So you would declare a mouse like:

mouse myMouse;

- Functions are called "catnaps" instead of functions. So you define a catnap like:

catnap eatFood() {
  // code here
}

- Common language keywords:

- meow - used instead of print/console.log to output something
- purr - used instead of return to return from a catnap
- scratch - used instead of break to break out of a loop
- pounce - used instead of continue to skip to next loop iteration

- Loops like "while" and "for" would be called "prowl" and "stalk" instead

- Logical operators like "&&" and "||" would be "hiss" and "purr"

- Comments start with "//" but are called "thoughts" instead of comments

So a simple MeowScript program might look like:

mouse foodBowl;

catnap eatFood() {
  meow("Yummy food!");
  purr;
}

prowl (foodBowl.isEmpty()) {
  meow("Bowl is empty, meow for more!");
  eatFood();
}

So that gives a general idea of what a cat programming language could look like!
```

> In order to have the model "remember" the previous conversation, include the previous output as prompt in front of the new ones.

