import { AnalyseRunHandler } from './handlers/analyse-run.handler';
import { BrowseFileHandler } from './handlers/browse-file.handler';
import { ChatHandler } from './handlers/chat.handler';
import { DeleteLlmProviderHandler } from './handlers/delete-llm-provider.handler';
import { GenerateApplyHandler } from './handlers/generate-apply.handler';
import { GenerateHandler } from './handlers/generate.handler';
import { GetEnvCheckHandler } from './handlers/get-env-check.handler';
import { GetGalileusStateHandler } from './handlers/get-galileus-state.handler';
import { GetLastModeHandler } from './handlers/get-last-mode.handler';
import { GetLlmConfigHandler } from './handlers/get-llm-config.handler';
import { JourneyConfirmPhaseHandler } from './handlers/journey-confirm-phase.handler';
import { ManagedLlmCommandHandler } from './handlers/managed-llm-command.handler';
import { RequestLlmsHandler } from './handlers/request-llms.handler';
import { RunDagDirectHandler } from './handlers/run-dag-direct.handler';
import { SaveLlmProviderHandler } from './handlers/save-llm-provider.handler';
import { SetLastModeHandler } from './handlers/set-last-mode.handler';
import { SetRouteProfileHandler } from './handlers/set-route-profile.handler';
import { StopDagHandler } from './handlers/stop-dag.handler';
import { OpenFileHandler } from './handlers/open-file.handler';
import { RequestAssetsHandler } from './handlers/request-assets.handler';
import { SubmitApprovalHandler } from './handlers/submit-approval.handler';
import { CreateAssetHandler } from './handlers/create-asset.handler';
import { DeleteAssetHandler } from './handlers/delete-asset.handler';
import { MessageRouter } from './routers/message-router';
import type { MessageContext } from './types/message-context.types';
import type { MessageHandler } from './types/message-handler.types';

type HandlerCtor = new () => MessageHandler;

export const createMessageRouter = function (): {
  register: (type: string, handler: MessageHandler) => void;
  dispatch: (type: string, payload: unknown, context: MessageContext) => Promise<void>;
} {
  const router = new (MessageRouter as unknown as new () => {
    register: (type: string, handler: MessageHandler) => void;
    dispatch: (type: string, payload: unknown, context: MessageContext) => Promise<void>;
  })();

  router.register('codernic:get-env-check', new (GetEnvCheckHandler as unknown as HandlerCtor)());
  router.register('galileus:get-state', new (GetGalileusStateHandler as unknown as HandlerCtor)());
  router.register('codernic:get-last-mode', new (GetLastModeHandler as unknown as HandlerCtor)());
  router.register('codernic:set-last-mode', new (SetLastModeHandler as unknown as HandlerCtor)());
  router.register('codernic:set-route-profile', new (SetRouteProfileHandler as unknown as HandlerCtor)());
  router.register('codernic:browse-file', new (BrowseFileHandler as unknown as HandlerCtor)());
  router.register('codernic:get-llm-config', new (GetLlmConfigHandler as unknown as HandlerCtor)());
  router.register(
    'codernic:save-llm-provider',
    new (SaveLlmProviderHandler as unknown as HandlerCtor)(),
  );
  router.register(
    'codernic:delete-llm-provider',
    new (DeleteLlmProviderHandler as unknown as HandlerCtor)(),
  );
  router.register('codernic:request-llms', new (RequestLlmsHandler as unknown as HandlerCtor)());
  router.register(
    'codernic:managed-llm-command',
    new (ManagedLlmCommandHandler as unknown as HandlerCtor)(),
  );
  router.register(
    'codernic:journey-confirm-phase',
    new (JourneyConfirmPhaseHandler as unknown as HandlerCtor)(),
  );
  router.register('codernic:analyse-run', new (AnalyseRunHandler as unknown as HandlerCtor)());
  router.register('codernic:generate', new (GenerateHandler as unknown as HandlerCtor)());
  router.register('codernic:run-dag-direct', new (RunDagDirectHandler as unknown as HandlerCtor)());
  router.register(
    'codernic:generate-apply',
    new (GenerateApplyHandler as unknown as HandlerCtor)(),
  );
  router.register('codernic:chat', new (ChatHandler as unknown as HandlerCtor)());
  router.register('codernic:stop-dag', new (StopDagHandler as unknown as HandlerCtor)());
  router.register('codernic:open-file', new (OpenFileHandler as unknown as HandlerCtor)());
  router.register(
    'codernic:submit-approval',
    new (SubmitApprovalHandler as unknown as HandlerCtor)(),
  );
  router.register('codernic:request-assets', new (RequestAssetsHandler as unknown as HandlerCtor)());
  router.register('codernic:create-asset', new (CreateAssetHandler as unknown as HandlerCtor)());
  router.register('codernic:delete-asset', new (DeleteAssetHandler as unknown as HandlerCtor)());

  return router;
};
