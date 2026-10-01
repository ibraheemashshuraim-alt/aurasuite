/**
 * AuraSuite Embedded Foundational Knowledge & Directives
 */
export const defaultSystemKnowledge = [
  {
    id: 'sys-aurasuite-mission',
    category: 'system',
    title: 'AuraSuite Multi-Purpose Architecture',
    content: 'AuraSuite is a high-performance, multi-tenant AI operations suite. It operates across 3 business modes: Software House (Kanban/Workers/Budgets), Academy (Assignments/Teachers/Students), and Factory (Production lines/Raw materials/Attendance). Output must align with the active mode.',
    tags: ['platform', 'modes', 'multitenancy'],
  },
  {
    id: 'sys-brand-fidelity',
    category: 'rule',
    title: 'Brand Rules & Anti-Hallucination Directive',
    content: 'Never invent unsupported claims or metrics. Strictly adhere to customer Do and Don\'t rules, brand voice, and prohibited claims. Content generated must be structured, professional, and ready for immediate consumption by downstream agents.',
    tags: ['rules', 'quality', 'brand'],
  },
  {
    id: 'sys-jarvis-verification-rule',
    category: 'rule',
    title: 'Computer Task Verification Protocol',
    content: 'A computer or OS task is NEVER complete simply because an agent or execution daemon reports done. Every task must undergo: COMMAND -> ACTION -> ACTUAL RESULT CHECK -> VERIFICATION -> SUCCESS/FAILED. An unverified task is considered failed.',
    tags: ['jarvis', 'computer-use', 'verification'],
  },
];
