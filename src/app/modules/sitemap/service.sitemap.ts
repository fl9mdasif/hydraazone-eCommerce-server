import config from '../../config';
import { Category } from '../category/model.category';
import { Product } from '../product/model.product';

const escapeXml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

type TUrlEntry = {
    loc: string;
    lastmod?: Date | string;
    changefreq: string;
    priority: string;
};

const buildUrlXml = ({ loc, lastmod, changefreq, priority }: TUrlEntry) => {
    const lastmodTag = lastmod
        ? `\n    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>`
        : '';
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
};

// Generates sitemap.xml content for active products + active categories.
const generateSitemapXml = async () => {
    const baseUrl = (config.site_url as string).replace(/\/+$/, '');

    const [products, categories] = await Promise.all([
        Product.find({ status: 'active' }).select('slug updatedAt').lean(),
        Category.find({ isActive: true }).select('slug updatedAt').lean(),
    ]);

    const entries: TUrlEntry[] = [
        { loc: baseUrl, changefreq: 'daily', priority: '1.0' },
        ...categories.map((c) => ({
            loc: `${baseUrl}/category/${c.slug}`,
            lastmod: c.updatedAt,
            changefreq: 'weekly',
            priority: '0.8',
        })),
        ...products.map((p) => ({
            loc: `${baseUrl}/product/${p.slug}`,
            lastmod: p.updatedAt,
            changefreq: 'weekly',
            priority: '0.7',
        })),
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
        .map(buildUrlXml)
        .join('\n')}\n</urlset>`;
};

export const sitemapServices = {
    generateSitemapXml,
};
