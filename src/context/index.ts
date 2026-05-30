/**
 * 上下文工程 — 统一导出
 */

// Types
export type {
  ChildContext,
  IntentType,
  IntentResult,
  RehabStage,
  ExtractionResult,
} from './types';
export { DEFAULT_CHILD_CONTEXT } from './types';

// Store
export { useChildContextStore } from './ChildContextStore';

// Hook
export { useChildContext } from './useChildContext';

// Pure functions
export {
  deriveStage,
  recalculateFlags,
  applyExtraction,
  consolidateMemoryForNewDay,
} from './updateRules';

// Intent router
export {
  classifyIntent,
  shouldExtract,
  buildClassifyIntentPrompt,
  parseClassifyIntentResponse,
} from './intentRouter';

// Injection engine
export {
  buildDynamicSystemPrompt,
  buildUserMessage,
} from './injectionEngine';

// Extraction service
export {
  extractConversationPoints,
  scheduleExtraction,
} from './extractionService';
