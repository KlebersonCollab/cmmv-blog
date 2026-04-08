# Specification: AI Version Content Validation
## Background
When generating an AI version of a feed item, the AI may invent nonexistent URLs or include broken images and videos present in the raw HTML. Although the backend implements a `ContentSanitizer` to remove unreachable media during the `processAIJob`, the results (removed nodes) are not exposed to the database or the Admin UI. As a result, the admin has no insight into missing media, creating a lack of transparency and broken content workflows.

## Requirements
*   **Must** track when broken links, images, or videos are removed by the `ContentSanitizer`.
*   **Must** persist the sanitization metadata alongside the AI content in the database (`FeedRaw`).
*   **Must** display visual feedback representing these removals in the Admin interface preview panel (`RawView.vue`).
*   **Must** fortify the AI prompts to strongly command against inventing new URLs and to only use media from the original input.

## Features
*   **AI Validation DB Schema**: Extends `FeedRawContract` to include an `aiValidation` JSON field.
*   **Background Logging Expansion**: `raw.service.ts` updates `aiValidation` with data from `ContentSanitizer`.
*   **Admin Reporting Alerts**: Front-end validation feedback in `RawView.vue`.

## Acceptance Criteria
*   **Given** a raw feed containing a fake or invalid image URL
*   **When** the user hits "Generate AI Version"
*   **Then** the UI successfully receives the sanitized content WITHOUT the invalid image, AND displays an alert containing the validation report (e.g., "1 image removed").

*   **Given** the application starts up
*   **When** `feed-raw.contract.ts` defines `aiValidation`
*   **Then** CMMV automatically migrates the database schema correctly.
