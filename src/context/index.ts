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
} from './model/types';
export { DEFAULT_CHILD_CONTEXT } from './model/types';
export { RISK_LEVEL_MAP, mapRiskLevel } from './model/risk';
export type { ContextSnapshot, ContextAssembly } from './engine/contextSnapshot';

// Store
export { useChildContextStore } from './store/ChildContextStore';

// Hook
export { useChildContext } from './store/useChildContext';

// Pure functions
export {
  deriveStage,
  recalculateFlags,
  applyExtraction,
  consolidateMemoryForNewDay,
} from './engine/updateRules';

// Intent router
export {
  classifyIntent,
  shouldExtract,
  buildClassifyIntentPrompt,
  parseClassifyIntentResponse,
} from './memory/intentRouter';

// Injection engine
export {
  buildDynamicSystemPrompt,
  buildUserMessage,
} from './engine/injectionEngine';

// Extraction service
export {
  extractConversationPoints,
  scheduleExtraction,
} from './memory/extractionService';

// Context assembler
export {
  assembleFreeChatContext,
  assembleDailyAdviceContext,
  buildDailyAdviceSystemPrompt,
} from './engine/contextAssembler';

// Ingest helpers
export {
  mapAssessmentSummaryToContext,
  mapTreatmentPlanToContext,
} from './ingest/clinicalIngest';
export { mapPendingScalesToContext } from './ingest/taskIngest';
