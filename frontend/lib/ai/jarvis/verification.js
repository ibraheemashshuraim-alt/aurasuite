import { supabase } from '../../supabase';
import { MockJarvisConnector } from './connector';

/**
 * 5-Stage Computer Task Verification Engine
 * COMMAND -> ACTION -> ACTUAL RESULT CHECK -> VERIFICATION -> SUCCESS/FAILED
 */
export async function executeAndVerifyComputerTask({
  executionId,
  organizationId,
  command,
  connector = new MockJarvisConnector(),
}) {
  const recordId = `verif-${Date.now()}`;
  const now = new Date().toISOString();

  // STAGE 1: COMMAND (Validation)
  if (!command?.action) {
    throw new Error('Invalid computer command: action cannot be empty');
  }
  if (!command?.expectedResultCriteria?.trim()) {
    throw new Error('Security rule violated: computer task must define explicit expectedResultCriteria (mere "Done" is not allowed)');
  }

  const commandDesc = `[${command.action}] target=${command.target || ''} value=${command.value || ''} expect=${command.expectedResultCriteria}`;

  // STAGE 2: ACTION (Execution via Connector)
  let actionResult;
  try {
    actionResult = await connector.executeAction(command);
  } catch (err) {
    const failedOutcome = {
      id: recordId,
      execution_id: executionId,
      organization_id: organizationId,
      command_requested: commandDesc,
      action_taken: `Failed to invoke action: ${err.message}`,
      actual_result: 'Execution aborted',
      verification_status: 'failed',
      failure_reason: `Connector error: ${err.message}`,
      execution_logs: 'OS connection failed',
      verified_at: now,
    };
    await persistRecord(failedOutcome);
    return failedOutcome;
  }

  // STAGE 3: ACTUAL RESULT CHECK (Inspection)
  const actualResult = (actionResult.output || '').trim();

  // STAGE 4: VERIFICATION (Strict evaluation)
  // CRITICAL RULE: A task is NEVER verified simply because Jarvis says "Done"
  let isVerified = false;
  let failureReason = '';

  if (actualResult.toLowerCase() === 'done' || actualResult.toLowerCase() === 'success') {
    if (command.expectedResultCriteria.toLowerCase() !== 'done') {
      isVerified = false;
      failureReason = `Verification rejected: Controller returned generic "Done" without meeting criteria: "${command.expectedResultCriteria}"`;
    } else {
      isVerified = true;
    }
  } else if (actualResult.toLowerCase().includes(command.expectedResultCriteria.toLowerCase())) {
    isVerified = true;
  } else {
    isVerified = false;
    failureReason = `Actual result did not meet expected criteria "${command.expectedResultCriteria}". Received: "${actualResult}"`;
  }

  // STAGE 5: SUCCESS / FAILED Determination
  const status = isVerified ? 'verified' : 'failed';

  const outcome = {
    id: recordId,
    execution_id: executionId,
    organization_id: organizationId,
    command_requested: commandDesc,
    action_taken: actionResult.output,
    actual_result: actualResult,
    verification_status: status,
    failure_reason: failureReason || null,
    execution_logs: actionResult.rawLogs,
    verified_at: new Date().toISOString(),
  };

  await persistRecord(outcome);
  return outcome;
}

async function persistRecord(outcome) {
  try {
    await supabase.from('verification_records').insert(outcome);
  } catch (err) {
    console.warn('Failed to persist verification record:', err.message);
  }
}
