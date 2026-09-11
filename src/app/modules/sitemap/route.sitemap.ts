import express from 'express';
import { sitemapControllers } from './controller.sitemap';

const router = express.Router();

// Mounted at the app root in app.ts (not under /api/v1) so it resolves at
// the conventional https://www.hydraazone.com/sitemap.xml
router.get('/sitemap.xml', sitemapControllers.getSitemap);

export const sitemapRoute = router;
