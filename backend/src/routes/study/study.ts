// The study routes — lecture digests, study-document plans and sections, video links, and the PDF.
// Each is one step of the pipeline the extension runs (see @canvas-assistant/shared types/study.ts):
// validate, delegate, answer through rsp(). Nothing is stored between steps.

import { Hono } from 'hono';
import { runStep } from '@/routes/study/common';
import { digestLecture } from '@/services/study/study-digest';
import { findLinks } from '@/services/study/study-links';
import { planDocument } from '@/services/study/study-plan';
import { renderStudyPdf } from '@/services/study/study-render';
import { writeSection } from '@/services/study/study-section';
import { validateDigest, validateLinks, validatePlan, validateRender, validateSection } from '@/services/study/study-validate';

export const router_study = new Hono();

router_study.post('/digest', (c) => runStep(c, validateDigest, digestLecture));
router_study.post('/plan', (c) => runStep(c, validatePlan, planDocument));
router_study.post('/section', (c) => runStep(c, validateSection, writeSection));
router_study.post('/links', (c) => runStep(c, validateLinks, findLinks));
router_study.post('/render', (c) => runStep(c, validateRender, (doc) => renderStudyPdf(doc)));
