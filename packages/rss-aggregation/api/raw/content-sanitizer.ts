import { Service, Logger, Config } from "@cmmv/core";
import validator from "validator";
import { SecurityService } from "../security/security.service";

export interface SanitizeStats {
    removedLinks: string[];
    removedVideos: string[];
    removedImages: string[];
}

export interface SanitizeResult {
    html: string;
    stats: SanitizeStats;
}

// Note: Constants moved to Config.get() in methods - kept for backward compatibility

// Block-level HTML tags whose container we remove when the link/image inside is invalid
const BLOCK_TAGS = ['p', 'div', 'figure', 'section', 'article', 'li', 'blockquote'];

// Domains that should always be considered reachable (social embeds, etc.)
const SOCIAL_DOMAINS = [
    'instagram.com', 'facebook.com', 'youtube.com', 'vimeo.com', 
    'twitter.com', 'x.com', 'tiktok.com', 'pinterest.com',
    'koreaboo.com', // Adding this specifically as requested
];

// Querystring params that are tracking/resize artifacts and should be stripped before dedup
const TRACKING_QS_PARAMS = [
    'w', 'h', 'fit', 'resize', 'width', 'height',
    'quality', 'q', 'auto', 'format', 'fm',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
];

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

@Service()
export class ContentSanitizer {
    private readonly logger = new Logger("ContentSanitizer");
    private readonly securityService: SecurityService;

    constructor(securityService: SecurityService) {
        this.securityService = securityService;
        this.logger.log('ContentSanitizer initialized with security validation');
    }

    /**
     * Entry point: sanitize HTML content.
     */
    async sanitize(html: string, featureImage?: string): Promise<SanitizeResult> {
        const stats: SanitizeStats = {
            removedLinks: [],
            removedVideos: [],
            removedImages: [],
        };

        if (!html || typeof html !== 'string') {
            return { html: html || '', stats };
        }

        // Step 1 — Dedup and validate images
        const imgResult = await this.validateAndRemoveImages(html, featureImage);
        html = imgResult.html;
        stats.removedImages = imgResult.removedImages;

        // Step 2 — Validate and remove invalid videos/embeds
        const videoResult = await this.validateAndRemoveVideos(html);
        html = videoResult.html;
        stats.removedVideos = videoResult.removedVideos;

        // Step 3 — Validate and remove invalid links
        const linkResult = await this.validateAndRemoveLinks(html);
        html = linkResult.html;
        stats.removedLinks = linkResult.removedLinks;

        return { html, stats };
    }

    // ─────────────────────────────────────────────────────────────────────
    // 1. Image validation
    // ─────────────────────────────────────────────────────────────────────

    async validateAndRemoveImages(
        html: string,
        featureImage?: string,
    ): Promise<{ html: string; removedImages: string[] }> {
        const removedImages: string[] = [];
        const seenUrls = new Set<string>();
        const normalizedFeature = featureImage ? this.normalizeImageUrl(featureImage) : null;

        const imgTagRegex = /<img\b[^>]*>/gi;
        const uniqueSrcs: string[] = [];

        // Pass 1: Deduplication
        let deduped = html.replace(imgTagRegex, (imgTag) => {
            const srcMatch = imgTag.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
            if (!srcMatch) return imgTag;

            const rawSrc = srcMatch[1].trim();
            const normalized = this.normalizeImageUrl(rawSrc);

            if (normalizedFeature && normalized === normalizedFeature) {
                removedImages.push(rawSrc);
                return '';
            }

            if (seenUrls.has(normalized)) {
                removedImages.push(rawSrc);
                return '';
            }

            seenUrls.add(normalized);
            uniqueSrcs.push(rawSrc);
            return imgTag;
        });

        deduped = this.cleanOrphanedBlocks(deduped);

        // Pass 2: Reachability check
        const maxImageChecks = Config.get("security.sanitizer.maxImageChecks", 20);
        const srcsToCheck = uniqueSrcs.slice(0, maxImageChecks);
        if (srcsToCheck.length === 0) return { html: deduped, removedImages };

        const urlCheckTimeout = Config.get("security.sanitizer.urlCheckTimeout", 5000);
        const checkResults = await Promise.all(
            srcsToCheck.map(async (src) => ({
                src,
                reachable: await this.isUrlReachable(src, urlCheckTimeout),
            }))
        );

        const unreachableSrcs = new Set(
            checkResults.filter(r => !r.reachable).map(r => r.src)
        );

        if (unreachableSrcs.size === 0) return { html: deduped, removedImages };

        let result = deduped;
        for (const src of unreachableSrcs) {
            removedImages.push(src);
            const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const imgPattern = new RegExp(`<img\\b[^>]*src\\s*=\\s*["']${escapedSrc}["'][^>]*>`, 'i');
            result = this.removeTagSmart(result, imgPattern);
        }

        return { html: result, removedImages };
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. Video / embed validation
    // ─────────────────────────────────────────────────────────────────────

    async validateAndRemoveVideos(html: string): Promise<{ html: string; removedVideos: string[] }> {
        const removedVideos: string[] = [];
        const videoTagRegex = /<video\b[^>]*>[\s\S]*?<\/video>/gi;
        const iframeTagRegex = /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi;

        const collected: Array<{ tag: string; url: string | null }> = [];
        let match: RegExpExecArray | null;

        while ((match = videoTagRegex.exec(html)) !== null) {
            collected.push({ tag: match[0], url: this.extractSrcFromTag(match[0]) });
        }

        while ((match = iframeTagRegex.exec(html)) !== null) {
            collected.push({ tag: match[0], url: this.extractSrcFromTag(match[0]) });
        }

        const maxVideoChecks = Config.get("security.sanitizer.maxVideoChecks", 10);
        const targets = collected.slice(0, maxVideoChecks);
        if (targets.length === 0) return { html, removedVideos };

        const urlCheckTimeout = Config.get("security.sanitizer.urlCheckTimeout", 5000);
        const validationResults = await Promise.all(
            targets.map(async ({ tag, url }) => {
                if (!url) return { tag, remove: true, url: '' };
                const reachable = await this.isUrlReachable(url, urlCheckTimeout);
                return { tag, remove: !reachable, url };
            })
        );

        let result = html;
        for (const { tag, remove, url } of validationResults) {
            if (!remove) continue;
            removedVideos.push(url || tag.substring(0, 80));
            result = this.removeTagSmart(result, new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
        }

        return { html: result, removedVideos };
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. Link validation
    // ─────────────────────────────────────────────────────────────────────

    async validateAndRemoveLinks(html: string): Promise<{ html: string; removedLinks: string[] }> {
        const removedLinks: string[] = [];
        const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
        const hrefSet = new Set<string>();
        let m: RegExpExecArray | null;

        while ((m = anchorRegex.exec(html)) !== null) {
            const hrefMatch = m[1].match(/\bhref\s*=\s*["']([^"']+)["']/i);
            if (!hrefMatch) continue;
            const href = hrefMatch[1].trim();
            if (this.shouldSkipLink(href)) continue;
            hrefSet.add(href);
            const maxLinkChecks = Config.get("security.sanitizer.maxLinkChecks", 15);
            if (hrefSet.size >= maxLinkChecks) break;
        }

        if (hrefSet.size === 0) return { html, removedLinks };

        const urlCheckTimeout = Config.get("security.sanitizer.urlCheckTimeout", 5000);
        const checkResults = await Promise.all(
            Array.from(hrefSet).map(async (href) => ({
                href,
                reachable: await this.isUrlReachable(href, urlCheckTimeout),
            }))
        );

        const invalidHrefs = new Set(
            checkResults.filter(r => !r.reachable).map(r => r.href)
        );

        if (invalidHrefs.size === 0) return { html, removedLinks };

        let result = html;
        for (const href of invalidHrefs) {
            removedLinks.push(href);
            const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const anchorPattern = new RegExp(
                `<a\\b[^>]*href\\s*=\\s*["']${escapedHref}["'][^>]*>([\\s\\S]*?)<\\/a>`,
                'gi',
            );

            // Use a replacer function to apply smart removal
            result = result.replace(anchorPattern, (match, innerText) => {
                const blockInfo = this.findParentBlock(result, match);
                
                if (blockInfo && this.shouldRemoveWholeBlock(blockInfo.content, match)) {
                    // Mark the entire block for removal later by returning a unique placeholder
                    // or just remove it now from the result (complex because we are inside replace)
                    return '<!-- REMOVE_BLOCK -->';
                }

                // If block is kept, just keep the inner text and remove <a> markup
                return innerText;
            });
        }

        // Second pass to resolve <!-- REMOVE_BLOCK --> markers
        for (const tag of BLOCK_TAGS) {
            const blockPattern = new RegExp(`<${tag}\\b[^>]*>[^<]*<!-- REMOVE_BLOCK -->[\\s\\S]*?<\\/${tag}>`, 'gi');
            result = result.replace(blockPattern, '');
        }

        return { html: this.cleanOrphanedBlocks(result), removedLinks };
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Finds the parent block containing the specified content.
     */
    private findParentBlock(html: string, innerContent: string): { tag: string; content: string } | null {
        const escapedInner = innerContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        for (const tag of BLOCK_TAGS) {
            const pattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?${escapedInner}[\\s\\S]*?<\\/${tag}>`, 'i');
            const match = html.match(pattern);
            if (match) return { tag, content: match[0] };
        }
        return null;
    }

    /**
     * Determines if the entire block should be removed based on text content length.
     */
    private shouldRemoveWholeBlock(blockContent: string, tagToRemove: string): boolean {
        // Strip the tag being removed and other HTML tags
        const remainingHtml = blockContent.replace(tagToRemove, '');
        const text = this.stripTags(remainingHtml).trim();
        const minTextLength = Config.get("security.sanitizer.minTextLength", 40);
        return text.length < minTextLength;
    }

    /**
     * Removes a tag intelligently: if the parent block has meat, only remove the tag.
     */
    private removeTagSmart(html: string, tagPattern: RegExp): string {
        const match = html.match(tagPattern);
        if (!match) return html;

        const tagContent = match[0];
        const blockInfo = this.findParentBlock(html, tagContent);

        if (blockInfo && this.shouldRemoveWholeBlock(blockInfo.content, tagContent)) {
            // Remove entire block
            const escapedBlock = blockInfo.content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return html.replace(new RegExp(escapedBlock, 'i'), '').trim();
        }

        // Just remove the tag and keep the block
        return html.replace(tagPattern, '').trim();
    }

    private stripTags(html: string): string {
        return html.replace(/<[^>]*>/g, '');
    }

    private normalizeImageUrl(rawUrl: string): string {
        try {
            const url = new URL(rawUrl);
            url.hash = '';
            for (const param of TRACKING_QS_PARAMS) url.searchParams.delete(param);
            const params = url.searchParams.toString();
            const base = `${url.protocol}//${url.host}${url.pathname}`.toLowerCase();
            return params ? `${base}?${params}` : base;
        } catch {
            return rawUrl.toLowerCase().trim();
        }
    }

    private extractSrcFromTag(tag: string): string | null {
        const srcMatch = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
        return srcMatch ? srcMatch[1].trim() : null;
    }

    private shouldSkipLink(href: string): boolean {
        if (!href) return true;

        // Validate URL security first
        const validationResult = this.validateUrl(href, 'link_validation');
        if (validationResult.warnings.length > 0) {
            this.securityService.logWarnings(validationResult.warnings);
        }

        const lower = href.toLowerCase().trim();
        return lower.startsWith('mailto:') || lower.startsWith('tel:') ||
               lower.startsWith('javascript:') || lower.startsWith('#') || lower === '/';
    }

    private cleanOrphanedBlocks(html: string): string {
        return html
            .replace(/<figure[^>]*>\s*<\/figure>/gi, '')
            .replace(/<p[^>]*>\s*<\/p>/gi, '')
            .replace(/<div[^>]*>\s*<\/div>/gi, '')
            .replace(/<li[^>]*>\s*<\/li>/gi, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    async isUrlReachable(url: string, timeoutMs?: number): Promise<boolean> {
        try {
            // Check whitelist first
            const urlObj = new URL(url);
            if (SOCIAL_DOMAINS.some(domain => urlObj.hostname.endsWith(domain))) {
                return true;
            }

            const controller = new AbortController();
            const actualTimeout = timeoutMs || Config.get("security.sanitizer.urlCheckTimeout", 5000);
            const timer = setTimeout(() => controller.abort(), actualTimeout);

            let response: Response;

            try {
                response = await fetch(url, {
                    method: 'HEAD',
                    signal: controller.signal,
                    headers: { 'User-Agent': BROWSER_UA },
                    redirect: 'follow',
                });

                if (response.status === 405) throw new Error('HEAD not allowed');
            } catch {
                response = await fetch(url, {
                    method: 'GET',
                    signal: controller.signal,
                    headers: { 
                        'User-Agent': BROWSER_UA,
                        'Range': 'bytes=0-0' 
                    },
                    redirect: 'follow',
                });
            }

            clearTimeout(timer);

            // Consider 401/403 as potentially reachable (bypass anti-bot blocks)
            return response.status < 400 || response.status === 403 || response.status === 401;
        } catch {
            return false;
        }
    }

    /**
     * Validate URL for security issues using validator.js
     */
    private validateUrl(url: string, context: string): import("../security/security.service").SecurityValidationResult {
        return this.securityService.validateUrl(url, context);
    }

    /**
     * Check if domain is in allowed list (extending SOCIAL_DOMAINS)
     */
    private isAllowedDomain(url: string): boolean {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();

            // Check against SOCIAL_DOMAINS
            if (SOCIAL_DOMAINS.some(domain => hostname.endsWith(domain))) {
                return true;
            }

            // Validate domain using validator.js
            return validator.isFQDN(hostname) || validator.isIP(hostname);
        } catch {
            return false;
        }
    }

    /**
     * Enhanced URL normalization with validation
     */
    private normalizeUrlWithValidation(url: string): string {
        try {
            const normalized = this.normalizeImageUrl(url);

            // Additional validation checks
            const urlObj = new URL(normalized);

            // Validate scheme (http/https only for security)
            const scheme = urlObj.protocol.slice(0, -1).toLowerCase();
            if (scheme !== 'http' && scheme !== 'https') {
                const validationResult = this.securityService.validateUrl(normalized, 'url_normalization');
                if (validationResult.warnings.length > 0) {
                    this.securityService.logWarnings(validationResult.warnings);
                }
            }

            return normalized;
        } catch {
            return url;
        }
    }
}
