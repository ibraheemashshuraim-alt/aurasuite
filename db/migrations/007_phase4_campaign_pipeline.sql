ALTER TABLE public.engine_tasks
ADD COLUMN campaign_id UUID DEFAULT NULL,
ADD COLUMN next_task_id UUID DEFAULT NULL,
ADD COLUMN upstream_task_id UUID DEFAULT NULL,
ADD COLUMN step_order INTEGER DEFAULT 1;

-- Add a comment to describe
COMMENT ON COLUMN public.engine_tasks.campaign_id IS 'Groups tasks belonging to a single multi-agent campaign';
COMMENT ON COLUMN public.engine_tasks.next_task_id IS 'The ID of the next task to trigger automatically upon completion';
COMMENT ON COLUMN public.engine_tasks.upstream_task_id IS 'The ID of the previous task to pull results from';

NOTIFY pgrst, 'reload schema';
