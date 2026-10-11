import { accessTokenFromEnv, query } from '@qodercn-ai/qodercn-agent-sdk';

for await (const message of query({
  prompt: 'Analyze the codebase, find functions without test coverage, and write unit tests for them.',
  options: {
    auth: accessTokenFromEnv(),
    allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
    permissionMode: 'acceptEdits',  // Auto-approve file edits
  },
})) {
  if (message.type === 'assistant') {
    for (const block of message.message.content) {
      if (block.type === 'text') {
        console.log(block.text);              // AI text response
      } else if (block.type === 'tool_use') {
        console.log(`Tool: ${block.name}`);   // Tool being called
      }
    }
  } else if (message.type === 'result') {
    console.log(`Done: ${message.subtype}`);  // Final result
  }
}
