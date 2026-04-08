# Implementation Plan: AI Validation Feedback
## Goals
Incorporate content validation feedback into the feed generation process for AI versions so users can act on missing or broken media.

## Proposed Strategy
1.  **Contract Update**: Open `packages/rss-aggregation/contracts/feed-raw.contract.ts` and add:
    ```typescript
    @ContractField({
        protoType: 'string', // Stored as JSON string to accommodate array of stats
        nullable: true,
    })
    aiValidation?: string;
    ```
2.  **Service Update (`raw.service.ts`)**:
    *   Find the `processAIJob` logic invoking the AI process.
    *   Update AI generation prompt instructions to explicitly prevent generating invalid URLs.
    *   After sanitization, collect `removedLinks`, `removedImages`, `removedVideos` arrays.
    *   Form a JSON object representing the sanitization stats. If any arrays contain items, store the stringified JSON into the `aiValidation` field during the final `save to database` step.
    *   Add this field into the JSON job.result returned to the client in `getAIJobStatus`.
3.  **App Admin View Update (`RawView.vue`)**:
    *   In the `<template>`, navigate to the preview pane showing `aiContent`.
    *   Conditionally render an alert box reading `aiValidation` properties from the selected `previewItem` or `aiContent`.
    *   Display bulleted warning: "The system removed {x} broken links, {y} videos, and {z} images."
    *   Update the `FeedItem` interface to include `aiValidation?: string`.
4.  **Verification**: 
    *   Restart server to trigger the CMMV schema compilation/migration.
    *   Mock an item generating broken links or check an existing item logic via proxy.
