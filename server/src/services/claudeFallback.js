/**
 * Helpers for graceful fallback when Claude API is unavailable
 * (credit exhausted, auth error, rate-limit, etc.).
 *
 * - isClaudeCreditError: detect API errors that warrant prompt-mode fallback
 * - tryClaudeOrEmitPrompt: wrapper for SSE routes
 */

/** APIキーが設定されているか（ANTHROPIC_API_KEY / CLAUDE_API_KEY のどちらでも可） */
export function hasClaudeKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY);
}

export function isClaudeCreditError(err) {
  const msg = String(err?.message || err || '');
  // Claude API error patterns we treat as "no credit / auth fail / key missing"
  return /credit_balance_too_low|credit.*balance.*too.*low|balance.*too.*low|too.*low.*credit|insufficient_quota|insufficient.*balance|insufficient.*credit|authentication_error|invalid[\s_-]*api[\s_-]*key|api[\s_-]*key.*invalid|could\s*not\s*resolve\s*authentication|apiKey\s*or\s*authToken|rate[\s_-]*limit|429\b|401\b|402\b/i.test(msg);
}

/**
 * Run apiCall(); if Claude is unavailable (credit/auth/rate-limit), or if
 * the caller passed `promptOnly=true`, emit a `fallback_prompt` SSE event
 * with the prompts so the user can run them externally.
 *
 * @param {object|object[]} promptInfo - { system, user, label } or array
 * @param {() => Promise<any>} apiCall - the actual Claude call
 * @param {(event: string, data: object) => void} sendEvent
 * @param {boolean} promptOnly
 * @returns {Promise<any|null>} - apiCall result, or null when fallback emitted
 */
export async function tryClaudeOrEmitPrompt(promptInfo, apiCall, sendEvent, promptOnly = false) {
  const prompts = Array.isArray(promptInfo) ? promptInfo : [promptInfo];

  if (promptOnly) {
    sendEvent('fallback_prompt', { reason: 'prompt_only', prompts });
    return null;
  }

  // APIキー未設定なら呼び出しを試みず、即プロンプト方式に切り替える
  if (!hasClaudeKey()) {
    sendEvent('fallback_prompt', { reason: 'no_api_key', prompts });
    return null;
  }

  try {
    return await apiCall();
  } catch (err) {
    if (isClaudeCreditError(err)) {
      sendEvent('fallback_prompt', {
        reason: 'api_error',
        message: err.message,
        prompts,
      });
      return null;
    }
    throw err;
  }
}
