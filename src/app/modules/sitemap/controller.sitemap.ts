import catchAsync from '../../utils/catchAsync';
import { sitemapServices } from './service.sitemap';

// GET /sitemap.xml — mounted at the site root (not under /api/v1)
const getSitemap = catchAsync(async (req, res) => {
    const xml = await sitemapServices.generateSitemapXml();
    res.header('Content-Type', 'application/xml');
    res.send(xml);
});

export const sitemapControllers = {
    getSitemap,
};
