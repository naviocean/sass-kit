import { evaluateToolCall, isSensitiveFile } from './hooks/pre-tool-guard.mjs';
import { resolveActiveModels } from './scripts/configure-models.mjs';

export { resolveActiveModels };

export const SaasKitCorePlugin = async () => {
  return {
    'tool.execute.before': async (input, output) => {
      const toolName = input?.tool || '';
      const toolArgs = output?.args || input?.args || {};
      const verdict = evaluateToolCall(toolName, toolArgs);
      if (verdict.blocked) {
        throw new Error(`AgentShield Runtime Guard Block: ${verdict.reason}`);
      }
    },
    'permission.ask': async (perm, out) => {
      const targetFile = perm?.file || perm?.path || '';
      if (targetFile && isSensitiveFile(targetFile)) {
        out.status = 'deny';
      }
    },
  };
};

export default SaasKitCorePlugin;
