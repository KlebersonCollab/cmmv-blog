# Plan: Fix X.com Iframe Breakage in PostPage

## Architecture / Component Overview
The bug exists inside the Vue component `PagePost.vue` located under various themes (e.g. `theme-centralotaku`, `theme-cupomnahora`, etc.) within the `apps/web` project. The `processPostContent` function handles auto-embedding of URLs.

## Data Models and Interfaces
No data models will be changed.

## API Endpoints or Module Boundaries
Components affected:
1. `apps/web/src/theme-centralotaku/views/PagePost.vue`
2. `apps/web/src/theme-cupomnahora/views/PagePost.vue`
3. `apps/web/src/theme-testatudo/views/PagePost.vue`
4. `apps/web/src/theme-invasaonerd/views/PagePost.vue`
5. `apps/web/src/theme-gamedevbr/views/PagePost.vue`

## Technology choices with rationale
We'll update the regular expressions inside `processPostContent` to detect if the URL is immediately preceded by a quote (`"` or `'`).
Instead of Lookbehinds (which may not be widely supported), we can simplify the callback signature:
```javascript
const twitterUrlPatterns = [
    /(^|[^"'])(https?:\/\/(?:www\.)?twitter\.com\/[a-zA-Z0-9_]+\/status\/[0-9]+(?:\?[^\s<"']*)?)/g,
    /(^|[^"'])(https?:\/\/(?:www\.)?x\.com\/[a-zA-Z0-9_]+\/status\/[0-9]+(?:\?[^\s<"']*)?)/g
];
// ... 
        processedContent = processedContent.replace(pattern, (match, prefix, fullUrl) => {
            return `${prefix}<div class="twitter-embed">
                <blockquote class="twitter-tweet" data-dnt="true" data-theme="light">
                    <a href="${fullUrl}"></a>
                </blockquote>
            </div>`;
        });
```
This safely avoids matching URLs inside attributes (like `src="https...`).
