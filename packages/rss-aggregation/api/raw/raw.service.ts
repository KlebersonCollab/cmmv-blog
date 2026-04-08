import {
    Service, Logger,
    Config, Application
} from "@cmmv/core";

import {
    Repository, MoreThanOrEqual,
    IsNull, LessThanOrEqual
} from "@cmmv/repository";

//@ts-ignore
import { AIContentService } from "@cmmv/ai-content";
//@ts-ignore
import { PromptsServiceTools } from "@cmmv/blog/prompts/prompts.service";
//@ts-ignore
import { ParserService } from "../parser/parser.service";

import { ContentSanitizer } from "./content-sanitizer";
import { SecurityService } from "../security/security.service";

interface AIJob {
    id: string;
    rawId: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    result?: any;
    error?: string;
    startTime: Date;
    customContent?: string;
    promptId?: string;
    model?: string;
}

@Service()
export class RawService {
    private readonly logger = new Logger("RawService");
    private aiJobs: Map<string, AIJob> = new Map();

    constructor(
        private readonly aiContentService: AIContentService,
        private readonly parserService: ParserService,
        private readonly contentSanitizer: ContentSanitizer,
        private readonly securityService: SecurityService
    ) {}

    /**
     * Get raw feed items
     * @param queries The queries to filter the raw feed items
     * @returns The raw feed items
     */
    async getRaws(queries: any) {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");

        queries.rejected = false;
        queries.pubDate = MoreThanOrEqual(new Date(Date.now() - 1000 * 60 * 60 * 24 * 2));
        queries.postRef = IsNull();
        delete queries.sortBy;
        delete queries.sort;

        const raw = await Repository.findAll(FeedRawEntity, queries, [], {
            order: {
                relevance: "DESC",
                pubDate: "DESC"
            }
        });

        return raw;
    }

    /**
     * Start an asynchronous AI content generation job
     * @param id The ID of the raw feed item
     * @param customContent Optional custom content to process instead of the original
     * @param promptId Optional prompt ID to use for the AI job
     * @param model Optional AI model to use
     * @returns Job ID for tracking the processing status
     */
    async startAIJob(id: string, customContent?: string, promptId?: string, model?: string): Promise<string> {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");
        const raw = await Repository.findOne(FeedRawEntity, { id });

        if (!raw) {
            throw new Error(`Raw feed item with ID ${id} not found`);
        }

        // Generate unique job ID
        const jobId = `ai-job-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

        let jobPromptId = promptId;
        let jobModel = model;

        // Fetch channel defaults if prompt or model is missing
        if (!jobPromptId || jobPromptId === 'default' || !jobModel) {
            const FeedChannelsEntity = Repository.getEntity("FeedChannelsEntity");
            const channel: any = await Repository.findOne(FeedChannelsEntity, { id: raw.channel });

            if (channel) {
                if (!jobModel) jobModel = channel.aiModel;
                if (!jobPromptId || jobPromptId === 'default') jobPromptId = channel.aiPromptId;
            }
        }

        // Final fallbacks
        if (!jobModel) jobModel = 'gemini';
        if (!jobPromptId || jobPromptId === 'default') jobPromptId = 'default';

        const job: AIJob = {
            id: jobId,
            rawId: id,
            status: 'pending',
            startTime: new Date(),
            customContent,
            promptId: jobPromptId,
            model: jobModel
        };

        this.aiJobs.set(jobId, job);
        this.logger.log(`Created AI job ${jobId} for raw feed item ${id}. Total jobs: ${this.aiJobs.size}`);
        
        setTimeout(() => this.processAIJob(jobId), 0);

        return jobId;
    }

    /**
     * Parse AI response robustly
     * @param text The raw text from the AI
     * @returns Parsed JSON object
     */
    private parseAIResponse(text: string): any {
        if (!text) throw new Error("Empty AI response");

        // Strategy 1: Clean and parse directly
        let cleaned = text.trim();
        
        try {
            return JSON.parse(cleaned);
        } catch (e) {
            // Strategy 2: Extract JSON from markdown or generic text
            let jsonContent = "";
            
            // Try markdown code blocks first
            const codeBlockMatch = cleaned.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (codeBlockMatch) {
                jsonContent = codeBlockMatch[1];
            } else {
                // Try to find the first { and last }
                const firstBrace = cleaned.indexOf('{');
                const lastBrace = cleaned.lastIndexOf('}');
                if (firstBrace >= 0 && lastBrace > firstBrace) {
                    jsonContent = cleaned.substring(firstBrace, lastBrace + 1);
                }
            }

            if (jsonContent) {
                try {
                    return JSON.parse(jsonContent.trim());
                } catch (innerError) {
                    this.logger.log("Standard JSON parse failed, attempting regex extraction fallback");
                    
                    // Strategy 3: Regex fallback for common fields
                    const result: any = {};
                    
                    const titleMatch = jsonContent.match(/"title"\s*:\s*"([\s\S]*?)"\s*(?:,|\n|\s*\})/);
                    const contentMatch = jsonContent.match(/"content"\s*:\s*"([\s\S]*?)"\s*(?:,|\n|\s*\})/);
                    const tagsMatch = jsonContent.match(/"suggestedTags"\s*:\s*(\[[\s\S]*?\])/);
                    const categoriesMatch = jsonContent.match(/"suggestedCategories"\s*:\s*(\[[\s\S]*?\])/);
                    const continuationMatch = jsonContent.match(/"continuation"\s*:\s*"([\s\S]*?)"\s*(?:,|\n|\s*\})/);

                    if (titleMatch) result.title = titleMatch[1];
                    if (contentMatch) result.content = contentMatch[1];
                    if (continuationMatch) result.continuation = continuationMatch[1];
                    
                    if (tagsMatch) {
                        try { result.suggestedTags = JSON.parse(tagsMatch[1]); } 
                        catch { 
                            result.suggestedTags = tagsMatch[1]
                                .replace(/[\[\]"]/g, '')
                                .split(',')
                                .map(t => t.trim())
                                .filter(t => t.length > 0);
                        }
                    }
                    
                    if (categoriesMatch) {
                        try { result.suggestedCategories = JSON.parse(categoriesMatch[1]); } 
                        catch {
                            result.suggestedCategories = categoriesMatch[1]
                                .replace(/[\[\]"]/g, '')
                                .split(',')
                                .map(c => c.trim())
                                .filter(c => c.length > 0);
                        }
                    }

                    if (result.title || result.content || result.continuation) {
                        return result;
                    }

                    throw innerError;
                }
            }

            throw new Error("No valid JSON found in AI response");
        }
    }

    /**
     * Matches suggested category names with existing categories in the database
     * @param suggestedNames Array of suggested category names from AI
     * @returns Array of matched category names
     */
    private async matchSuggestedCategories(suggestedNames: string[]): Promise<string[]> {
        if (!suggestedNames || !Array.isArray(suggestedNames) || suggestedNames.length === 0) {
            return [];
        }

        try {
            const CategoryEntity = Repository.getEntity("CategoriesEntity");
            const allCategories = await Repository.findAll(CategoryEntity, { active: true });
            
            if (!allCategories || !allCategories.data) {
                return [];
            }

            const matchedNames: string[] = [];
            const existingCategories = allCategories.data;

            for (const suggestedName of suggestedNames) {
                if (typeof suggestedName !== 'string') continue;
                
                const normalizedSuggested = suggestedName.toLowerCase().trim();
                
                // Try exact match first
                const exactMatch = (existingCategories as any[]).find((c: any) => 
                    c.name.toLowerCase().trim() === normalizedSuggested ||
                    c.slug.toLowerCase().trim() === normalizedSuggested
                );

                if (exactMatch) {
                    matchedNames.push(exactMatch.name);
                } else {
                    // Try partial match
                    const partialMatch = (existingCategories as any[]).find((c: any) => 
                        normalizedSuggested.includes(c.name.toLowerCase().trim()) ||
                        c.name.toLowerCase().trim().includes(normalizedSuggested)
                    );
                    
                    if (partialMatch) {
                        matchedNames.push(partialMatch.name);
                    }
                }
            }

            // Remove duplicates
            return [...new Set(matchedNames)];
        } catch (error) {
            this.logger.error(`Error matching suggested categories: ${error}`);
            return [];
        }
    }

    /**
     * Process an AI job asynchronously
     * @param jobId The ID of the job to process
     */
    private async processAIJob(jobId: string): Promise<void> {
        const job = this.aiJobs.get(jobId);
        if (!job) {
            this.logger.error(`Job ${jobId} not found`);
            return;
        }

        const jobStartTime = Date.now();
        
        try {
            job.status = 'processing';
            this.aiJobs.set(jobId, job);

            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            const raw = await Repository.findOne(FeedRawEntity, { id: job.rawId });

            if (!raw) {
                throw new Error(`Raw feed item with ID ${job.rawId} not found`);
            }

            const promptService: any = Application.resolveProvider(PromptsServiceTools);
            const language = Config.get("blog.language");

            const contentToProcess = {
                title: raw.title,
                content: job.customContent || raw.content,
                category: raw.category
            };

            const customPrompt = await promptService.getDefaultPrompt(job.promptId);

            const prompt = `
            You are a professional content generator for a news aggregation platform.
            
            Your task is to transform the provided content following these strictly hierarchical rules:
            
            1. LANGUAGE:
               - Translate all content to: ${language}
            
            2. INSTRUCTIONS / STYLE:
               ${customPrompt}
            
            3. FORMATTING RULES (TipTap compatible HTML):
               - Use <h2> for section headers
               - Use <p> for paragraphs
               - Use <ul>/<li> for lists
               - DO NOT write any conclusion or summary paragraph. The article should feel unfinished and open-ended.
               - DO NOT wrap up the discussion or provide closing thoughts.
               - MEDIA PRESERVATION: You are ALLOWED to keep <img>, <video>, and <iframe> tags from the original content.
               - EXACT MATCH: You MUST NOT invent, guess, or modify any media URLs. If you use an image, copy its exact HTML tag.
               - NO RELATIVE PATHS: If the original image had a relative URL (e.g. /wp-content/pic.jpg), ignore it and do NOT include it. Only keep absolute http/https URLs.
               - SEO & E-E-A-T: Ensure the content is structured with logical hierarchy (use <h2> and <h3>, do not generate an <h1>). 
               - Incorporate original insights if context allows, write clearly for readability, and avoid keyword stuffing to signal Expertise and Trustworthiness.
            
            4. INPUT DATA:
               Title: ${contentToProcess.title}
               Category: ${contentToProcess.category || 'General'}
               Content: ${contentToProcess.content}
            
            5. RETURN FORMAT:
               Return ONLY a JSON object with this exact structure. Ensure all special characters in strings are properly escaped for JSON.parse(), especially double quotes and newlines:
               {
                 "title": "translated and rewritten title (max 100 chars)",
                 "content": "HTML-formatted content",
                 "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
                 "suggestedCategories": ["categoryName1", "categoryName2"]
               }`;

            // Validate AI prompt for security issues (permissive approach - only warnings)
            const promptValidationResult = this.securityService.validateAiPrompt(prompt);
            if (promptValidationResult.warnings.length > 0) {
                this.securityService.logWarnings(promptValidationResult.warnings);
            }

            this.logger.log(`Processing AI job ${jobId} for raw ${job.rawId} using model ${job.model || 'default'}`);
            
            this.logger.log(`Calling AI service generateContent for job ${jobId}...`);
            const generatedText = await this.aiContentService.generateContent(prompt, job.model);
            const aiServiceTime = Date.now() - jobStartTime;
            this.logger.log(`AI service returned response for job ${jobId} after ${aiServiceTime}ms`);

            if (!generatedText) {
                this.logger.error(`AI service returned empty response for job ${jobId}`);
                throw new Error('No content generated by AI');
            }

            this.logger.log(`AI response received for job ${jobId}, length: ${generatedText.length} characters`);

            try {
                let parsedContent: any = null;
                
                try {
                    parsedContent = this.parseAIResponse(generatedText);
                    this.logger.log(`Successfully parsed AI response for job ${jobId}`);
                } catch (parseErr) {
                    this.logger.error(`Critical parsing error for job ${jobId}: ${parseErr}`);
                    throw parseErr;
                }

                if (parsedContent.title && parsedContent.title.length > 100) {
                    parsedContent.title = parsedContent.title.substring(0, 97) + '...';
                    this.logger.log(`Title was truncated to 100 characters for raw feed item ${job.rawId}`);
                }

                this.logger.log(`Generating continuation text for raw feed item ${job.rawId}`);

                const customPromptContinuation = await promptService.getDefaultPrompt(job.promptId);

                const continuationPrompt = `
                You are a professional content generator for a news aggregation platform.
                
                I have already generated the first part of an article. I need you to continue it naturally, maintaining the same style and flow.
                
                RULES:
                1. LANGUAGE: Keep using ${language}
                2. STYLE INSTRUCTIONS: ${customPromptContinuation}
                3. FORMATTING: Use TipTap compatible HTML (<h2>, <p>, <ul>).
                4. NO CONCLUSIONS: DO NOT write any conclusion, summary, or closing thoughts.
                5. MEDIA PRESERVATION: You may keep original <img> and <video> tags exactly as they were. Do NOT generate new ones. Do NOT use relative URLs.
                6. FLOW: Continue directly from where the current text ends without breaking logical flow.
                7. SEO & E-E-A-T: Ensure proper heading structures (<h2>, <h3>). Add depth and original insight without writing a conclusion. Avoid keyword stuffing.
                
                METADATA:
                Original Title: ${contentToProcess.title}
                Category: ${contentToProcess.category || 'General'}
                
                CURRENT CONTENT (STAY IN THIS STYLE):
                ${parsedContent.content}
                
                Return ONLY a JSON object with this field. Ensure all special characters in strings are properly escaped for JSON.parse():
                {
                  "continuation": "The continuation HTML content"
                }`;

                const continuationText = await this.aiContentService.generateContent(continuationPrompt, job.model);

                if (!continuationText) {
                    this.logger.error(`No continuation text generated for raw feed item ${job.rawId}, using only the original text`);
                } else {
                    try {
                        let continuationJsonContent: string | null = null;
                        
                        // Try multiple strategies to extract JSON
                        try {
                            JSON.parse(continuationText.trim());
                            continuationJsonContent = continuationText.trim();
                        } catch {
                            const jsonMatch = continuationText.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                continuationJsonContent = jsonMatch[0];
                            } else {
                                const codeBlockMatch = continuationText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                                if (codeBlockMatch) {
                                    continuationJsonContent = codeBlockMatch[1];
                                } else {
                                    const firstBrace = continuationText.indexOf('{');
                                    const lastBrace = continuationText.lastIndexOf('}');
                                    if (firstBrace >= 0 && lastBrace > firstBrace) {
                                        continuationJsonContent = continuationText.substring(firstBrace, lastBrace + 1);
                                    }
                                }
                            }
                        }

                        if (continuationJsonContent) {
                            const parsedContinuation = this.parseAIResponse(continuationJsonContent);

                            if (parsedContinuation.continuation) {
                                const lastClosingTagMatch = parsedContent.content.match(/<\/[^>]+>$/);

                                if (lastClosingTagMatch) {
                                    const insertPosition = parsedContent.content.lastIndexOf(lastClosingTagMatch[0]);
                                    parsedContent.content =
                                        parsedContent.content.substring(0, insertPosition) +
                                        parsedContinuation.continuation +
                                        parsedContent.content.substring(insertPosition);
                                } else {
                                    parsedContent.content += parsedContinuation.continuation;
                                }

                                this.logger.log(`Successfully combined original content with continuation for raw feed item ${job.rawId}`);
                            }
                        }
                    } catch (continuationError) {
                        this.logger.error(`Failed to parse continuation text: ${continuationError}`);
                        this.logger.error(`Using only the original text for raw feed item ${job.rawId}`);
                    }
                }

                // Sanitize: remove invalid links, invalid videos and duplicate images
                let aiValidationStats = null;
                try {
                    this.logger.log(`[Job ${jobId}] Sanitizing content for raw ${job.rawId}...`);
                    const sanitizeResult = await this.contentSanitizer.sanitize(
                        parsedContent.content,
                        raw.featureImage
                    );
                    parsedContent.content = sanitizeResult.html;

                    const { removedLinks, removedVideos, removedImages } = sanitizeResult.stats;
                    
                    if (removedLinks.length > 0 || removedVideos.length > 0 || removedImages.length > 0) {
                        aiValidationStats = JSON.stringify({
                            removedLinks, removedVideos, removedImages
                        });
                    }

                    if (removedLinks.length > 0)
                        this.logger.log(`[Job ${jobId}] Removed ${removedLinks.length} invalid link(s): ${removedLinks.join(', ')}`);
                    if (removedVideos.length > 0)
                        this.logger.log(`[Job ${jobId}] Removed ${removedVideos.length} invalid video/embed(s)`);
                    if (removedImages.length > 0)
                        this.logger.log(`[Job ${jobId}] Removed ${removedImages.length} duplicate image(s)`);
                } catch (sanitizeError) {
                    this.logger.error(`[Job ${jobId}] Content sanitization failed (continuing with unsanitized content): ${sanitizeError}`);
                }

                const result = {
                    ...raw,
                    originalTitle: raw.title,
                    originalContent: raw.content,
                    title: parsedContent.title,
                    content: parsedContent.content,
                    suggestedTags: parsedContent.suggestedTags || [],
                    suggestedCategories: parsedContent.suggestedCategories || [],
                    aiProcessed: true,
                    aiValidation: aiValidationStats,
                    processedAt: new Date()
                };

                job.result = result;
                job.status = 'completed';
                this.aiJobs.set(jobId, job);

                // Save to database
                await Repository.updateOne(FeedRawEntity, { id: job.rawId }, {
                    aiTitle: parsedContent.title,
                    aiContent: parsedContent.content,
                    aiTags: JSON.stringify(parsedContent.suggestedTags || []),
                    aiCategories: JSON.stringify(parsedContent.suggestedCategories || []),
                    aiModel: job.model || Config.get("blog.aiService", "gemini"),
                    aiPromptId: job.promptId,
                    aiFeatureImage: raw.featureImage,
                    aiValidation: aiValidationStats,
                    aiStatus: 'completed'
                });

                this.logger.log(`AI job ${jobId} completed successfully and saved to DB`);

                // Automatically match and select categories if found
                if (parsedContent.suggestedCategories && parsedContent.suggestedCategories.length > 0) {
                    const matchedCategories = await this.matchSuggestedCategories(parsedContent.suggestedCategories);
                    if (matchedCategories.length > 0) {
                        await Repository.updateOne(FeedRawEntity, { id: job.rawId }, {
                            category: matchedCategories[0], // Use the first best match as the primary category
                            aiCategories: JSON.stringify(matchedCategories)
                        });
                        this.logger.log(`Automatically matched and assigned categories for job ${jobId}: ${matchedCategories.join(', ')}`);
                    }
                }
            } catch (parseError) {
                const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
                this.logger.error(`Failed to parse AI generated content for job ${jobId}: ${errorMessage}`);
                this.logger.error(`AI response preview (first 1000 chars): ${generatedText.substring(0, 1000)}`);
                this.logger.error(`AI response preview (last 500 chars): ${generatedText.substring(Math.max(0, generatedText.length - 500))}`);
                job.status = 'error';
                job.error = `Failed to parse AI generated content: ${errorMessage}`;
                this.aiJobs.set(jobId, job);
            }
        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorName = error instanceof Error ? error.name : 'Unknown';
            const errorStack = error instanceof Error ? error.stack : undefined;
            const jobElapsedTime = Date.now() - jobStartTime;
            
            this.logger.error(`Error processing AI job ${jobId} after ${jobElapsedTime}ms: ${errorMessage} (name: ${errorName})`);
            this.logger.error(`Job state: status=${job.status}, queueSize=${this.aiJobs.size}`);
            if (errorStack) {
                this.logger.error(`Error stack: ${errorStack.substring(0, 500)}`);
            }
            
            // Check if it's a timeout/abort error - be more specific
            const errorMessageLower = errorMessage.toLowerCase().trim();
            const isTimeoutError = error instanceof Error && (
                error.name === 'AbortError' ||
                errorMessageLower === 'terminated' ||
                (errorMessageLower.includes('timeout') && errorMessageLower.includes('160 seconds')) ||
                (errorMessageLower.includes('timeout') && errorMessageLower.includes('longer than')) ||
                (errorMessageLower.includes('timeout') && errorMessageLower.includes('including queue wait')) ||
                errorMessageLower === 'the operation was aborted' ||
                (errorMessageLower.includes('aborted') && errorMessageLower.includes('signal'))
            );
            
            if (isTimeoutError) {
                this.logger.error(`Timeout detected for job ${jobId} after ${jobElapsedTime}ms: ${errorMessage}`);
                this.logger.error(`This indicates the AI service took too long. Check: 1) Queue wait time, 2) API response time, 3) Network issues`);
                job.error = 'Request timeout: The AI service took longer than 160 seconds to respond';
            } else {
                // Log the actual error for debugging
                this.logger.error(`Non-timeout error for job ${jobId} after ${jobElapsedTime}ms: ${errorMessage}`);
                job.error = errorMessage;
            }
            
            job.status = 'error';
            this.aiJobs.set(jobId, job);

            // Save error status to database
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            await Repository.updateOne(FeedRawEntity, { id: job.rawId }, {
                aiStatus: 'error'
            });
        }
    }

    /**
     * Start a batch of AI content generation jobs
     * @param ids The IDs of the raw feed items
     * @param model Optional AI model to use
     * @param promptId Optional prompt ID to use for the AI jobs
     * @returns Array of job IDs
     */
    async startBatchAIJob(ids: string[], model?: string, promptId?: string): Promise<string[]> {
        const jobIds: string[] = [];
        
        for (const id of ids) {
            const jobId = await this.startAIJob(id, undefined, promptId, model);
            jobIds.push(jobId);
        }
        
        return jobIds;
    }

    /**
     * Get the status and result of an AI job
     * @param jobId The ID of the job to check
     * @returns The current status and result (if available) of the job
     */
    async getAIJobStatus(jobId: string) {
        this.logger.log(`Checking status for job: ${jobId}`);
        this.logger.log(`Total jobs in memory: ${this.aiJobs.size}`);
        
        const job = this.aiJobs.get(jobId);

        if (!job) {
            this.logger.error(`Job ${jobId} not found. Available jobs: ${Array.from(this.aiJobs.keys()).join(', ')}`);
            throw new Error(`Job ${jobId} not found`);
        }

        this.logger.log(`Job ${jobId} found with status: ${job.status}`);
        this.cleanupOldJobs();

        if (job.status === 'completed') {
            return {
                status: job.status,
                result: job.result
            };
        } else if (job.status === 'error') {
            return {
                status: job.status,
                error: job.error
            };
        } else {
            return {
                status: job.status
            };
        }
    }

    /**
     * Clean up old completed/error jobs to prevent memory leaks
     */
    private cleanupOldJobs() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        for (const [jobId, job] of this.aiJobs.entries()) {
            if ((job.status === 'completed' || job.status === 'error') && job.startTime < oneHourAgo) {
                this.aiJobs.delete(jobId);
            }
        }
    }

    /**
     * Get AI processed raw feed item (DEPRECATED - use startAIJob and getAIJobStatus instead)
     * This method is kept for backward compatibility
     * @param id The ID of the raw feed item
     * @param customContent Optional custom content to process instead of the original
     * @returns The AI processed raw feed item
     */
    async getAIRaw(id: string, customContent?: string, promptId?: string, model?: string) {
        try {
            const promptService:any = Application.resolveProvider(PromptsServiceTools);
            const language = Config.get("blog.language");
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            const raw = await Repository.findOne(FeedRawEntity, {
                id: id
            });

            if (!raw)
                throw new Error(`Raw feed item with ID ${id} not found`);

            const contentToProcess = {
                title: raw.title,
                content: customContent || raw.content,
                category: raw.category
            };

            const prompt = `
            You are a content generator for a news aggregation platform that uses the TipTap editor.

            Please transform the following content by:
            1. Translating it to ${language}
            ${await promptService.getDefaultPrompt(promptId)}

            IMPORTANT: DO NOT write any conclusion or summary paragraph. The article should feel unfinished and open-ended.
            It should not wrap up the discussion or provide closing thoughts. Avoid phrases like "In conclusion," "To summarize,"
            "Finally," or any language that suggests the article is ending.

            - ONLY use images that exist in the original post - DO NOT create or generate new images that don't exist

            Here is the content to transform:

            Title: ${contentToProcess.title}

            Category: ${contentToProcess.category || 'General'}

            Content: ${contentToProcess.content}

            Return the transformed content in JSON format with the following fields:
            {
              "title": "translated and rewritten title",
              "content": "HTML-formatted content with proper tags",
              "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
              "suggestedCategories": ["categoryName1", "categoryName2"]
            }`;

            // Validate AI prompt for security issues (permissive approach - only warnings)
            const promptValidationResult = this.securityService.validateAiPrompt(prompt);
            if (promptValidationResult.warnings.length > 0) {
                this.securityService.logWarnings(promptValidationResult.warnings);
            }

            const generatedText = await this.aiContentService.generateContent(prompt);

            if (!generatedText)
                throw new Error('No content generated by AI');

            let parsedContent: any = null;
            
            try {
                parsedContent = this.parseAIResponse(generatedText);
                this.logger.log(`Successfully parsed AI response for feed item ${id}`);
            } catch (parseErr) {
                this.logger.error(`Critical parsing error for feed item ${id}: ${parseErr}`);
                throw parseErr;
            }

            if (parsedContent.title && parsedContent.title.length > 100) {
                parsedContent.title = parsedContent.title.substring(0, 97) + '...';
                this.logger.log(`Title was truncated to 100 characters for raw feed item ${id}`);
            }

            // Generate continuation text
            this.logger.log(`Generating continuation text for raw feed item ${id}`);

            const continuationPrompt = `
            You are a content generator for a news aggregation platform that uses the TipTap editor.

            I've already generated part of the content below, but I need you to continue this article with more details, examples, or insights. Keep the same style and flow as the existing content.

            1. Translating it to ${language}

            Original prompt:
            ${await promptService.getDefaultPrompt(promptId)}

            Original Title: ${contentToProcess.title}
            Category: ${contentToProcess.category || 'General'}

            Here's the content already generated:
            ${parsedContent.content}

            Please continue from where this left off, adding depth, details, and value. Make it feel like a natural extension.
            Your continuation should be at least as long as the original text.

            IMPORTANT: DO NOT write any conclusion or summary paragraph. The article should feel unfinished and open-ended.
            It should not wrap up the discussion or provide closing thoughts. Avoid phrases like "In conclusion," "To summarize,"
            "Finally," or any language that suggests the article is ending.

            Return only the continuation in JSON format with the following field:
            {
              "continuation": "HTML-formatted content with proper tags that continues the existing text"
            }
            `;

            const continuationText = await this.aiContentService.generateContent(continuationPrompt, model);

            if (!continuationText) {
                this.logger.error(`No continuation text generated for raw feed item ${id}, using only the original text`);
            } else {
                try {
                    let continuationJsonContent: string | null = null;
                    
                    // Try multiple strategies to extract JSON
                    try {
                        JSON.parse(continuationText.trim());
                        continuationJsonContent = continuationText.trim();
                    } catch {
                        const continuationJsonMatch = continuationText.match(/\{[\s\S]*\}/);
                        if (continuationJsonMatch) {
                            continuationJsonContent = continuationJsonMatch[0];
                        } else {
                            const firstContBrace = continuationText.indexOf('{');
                            const lastContBrace = continuationText.lastIndexOf('}');
                            if (firstContBrace >= 0 && lastContBrace > firstContBrace) {
                                continuationJsonContent = continuationText.substring(firstContBrace, lastContBrace + 1);
                            }
                        }
                    }

                    if (continuationJsonContent) {
                        const parsedContinuation = this.parseAIResponse(continuationJsonContent);

                        if (parsedContinuation.continuation) {
                            const lastClosingTagMatch = parsedContent.content.match(/<\/[^>]+>$/);

                            if (lastClosingTagMatch) {
                                const insertPosition = parsedContent.content.lastIndexOf(lastClosingTagMatch[0]);
                                parsedContent.content =
                                    parsedContent.content.substring(0, insertPosition) +
                                    parsedContinuation.continuation +
                                    parsedContent.content.substring(insertPosition);
                            } else {
                                parsedContent.content += parsedContinuation.continuation;
                            }

                            this.logger.log(`Successfully combined original content with continuation for feed item ${id}`);
                        }
                    }
                } catch (continuationError) {
                    this.logger.error(`Failed to parse continuation text for feed item ${id}: ${continuationError}`);
                    this.logger.error(`Using only the original text for raw feed item ${id}`);
                }
            }

                return {
                    ...raw,
                    originalTitle: raw.title,
                    originalContent: raw.content,
                    title: parsedContent.title,
                    content: parsedContent.content,
                    suggestedTags: parsedContent.suggestedTags || [],
                    suggestedCategories: parsedContent.suggestedCategories || [],
                    aiProcessed: true,
                    processedAt: new Date()
                };


        } catch (error: unknown) {
            this.logger.error(`Error in getAIRaw: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Update a raw feed item
     * @param id The ID of the raw feed item
     * @param data The data to update the raw feed item with
     * @returns The updated raw feed item
     */
    async updateRaw(id: string, data: any) {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");
        const raw = await Repository.findOne(FeedRawEntity, {
            id: id
        });
        let updatedRaw = null;
        let updateData: any = {};

        if(data.postRef)
            updateData.postRef = data.postRef;

        if(data.rejected)
            updateData.rejected = data.rejected;

        if(data.featureImage)
            updateData.featureImage = data.featureImage;

        if (!raw)
            throw new Error(`Raw feed item with ID ${id} not found`);

        updatedRaw = await Repository.updateOne(FeedRawEntity, {
            id: id
        }, updateData);

        return {
            message: "Raw feed item updated successfully"
        };
    }

    /**
     * Reject a raw feed item
     * @param id The ID of the raw feed item
     * @returns The rejected raw feed item
     */
    async rejectRaw(id: string) {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");
        const raw = await Repository.findOne(FeedRawEntity, {
            id: id
        });

        if (!raw)
            throw new Error(`Raw feed item with ID ${id} not found`);

        await Repository.updateOne(FeedRawEntity, Repository.queryBuilder({
            id: id
        }), { rejected: true });

        return {
            message: "Raw feed item rejected successfully"
        };
    }

    /**
     * Proxy image
     * @param imageUrl The URL of the image to proxy
     * @param res The response object
     * @returns The image
     */
    async proxyImage(imageUrl: string, res: any): Promise<any> {
        try {
            if (!imageUrl || typeof imageUrl !== 'string') {
                res.status(400).json({ error: 'URL inválida' });
                return;
            }

            const response = await fetch(imageUrl, {
                method: 'get',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (!response.ok)
                throw new Error(`Error fetching image: ${response.status} ${response.statusText}`);

            const contentType = response.headers.get('content-type');
            res.setHeader('Content-Type', contentType || 'image/jpeg');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=86400');

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            res.send(buffer);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar imagem' });
        }
    }

    /**
     * Proxy audio files
     * @param audioUrl The URL of the audio to proxy
     * @param res The response object
     * @returns The audio
     */
    async proxyAudio(audioUrl: string, res: any): Promise<any> {
        try {
            this.logger.log(`Proxying audio request for: ${audioUrl}`);

            if (!audioUrl || typeof audioUrl !== 'string') {
                this.logger.error('Invalid audioUrl provided');
                res.status(400).json({ error: 'URL inválida' });
                return;
            }

            this.logger.log(`Fetching audio from: ${audioUrl}`);

            const response = await fetch(audioUrl, {
                method: 'get',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'audio/*,*/*;q=0.9',
                    'Accept-Encoding': 'identity',
                    'Range': 'bytes=0-'
                }
            });

            this.logger.log(`Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                this.logger.error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
                throw new Error(`Error fetching audio: ${response.status} ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');

            this.logger.log(`Content-Type: ${contentType}, Content-Length: ${contentLength}`);

            // Detectar tipo de áudio se não especificado
            let audioContentType = contentType;
            if (!audioContentType || !audioContentType.includes('audio')) {
                if (audioUrl.includes('.mp3')) audioContentType = 'audio/mpeg';
                else if (audioUrl.includes('.wav')) audioContentType = 'audio/wav';
                else if (audioUrl.includes('.ogg')) audioContentType = 'audio/ogg';
                else if (audioUrl.includes('.m4a')) audioContentType = 'audio/mp4';
                else audioContentType = 'audio/mpeg'; // fallback

                this.logger.log(`Auto-detected content type: ${audioContentType}`);
            }

            // Headers para streaming de áudio
            res.setHeader('Content-Type', audioContentType);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Range, Content-Length');
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'public, max-age=3600');

            if (contentLength) {
                res.setHeader('Content-Length', contentLength);
            }

            this.logger.log('Successfully fetched audio, sending response');

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            res.send(buffer);

            this.logger.log(`Audio proxy completed successfully. Buffer size: ${buffer.length} bytes`);
        } catch (error) {
            this.logger.error(`Error proxying audio: ${error}`);
            if (error instanceof Error) {
                this.logger.error(`Error details: ${error.message}`);
                this.logger.error(`Error stack: ${error.stack}`);
            }
            res.status(500).json({ error: 'Erro ao buscar áudio', details: error instanceof Error ? error.message : String(error) });
        }
    }

    /**
     * Clean all raw feed items that are older than a specified period
     * @returns Information about the cleaning operation
     */
    async cleanAllRaws(): Promise<any> {
        try {
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            const deleteResult = await Repository.delete(FeedRawEntity, {});

            return {
                success: true,
                message: `Successfully cleaned raw feed items`,
                deletedCount: deleteResult || 0
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error cleaning raw feed items: ${errorMessage}`);
            throw new Error(`Failed to clean raw feed items: ${errorMessage}`);
        }
    }

    /**
     * Clean raw feed items for a specific channel that are older than a specified period
     * @param channelId The ID of the channel to clean raw items for
     * @returns Information about the cleaning operation
     */
    async cleanChannelRaws(channelId: string): Promise<any> {
        try {
            if (!channelId) {
                throw new Error("Channel ID is required");
            }

            const FeedRawEntity = Repository.getEntity("FeedRawEntity");

            const deleteResult = await Repository.delete(
                FeedRawEntity,
                Repository.queryBuilder({
                    channel: channelId
                })
            );

            return {
                success: true,
                message: `Successfully cleaned raw feed items for channel ${channelId}`,
                channelId: channelId,
                deletedCount: deleteResult || 0
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to clean raw feed items for channel: ${errorMessage}`);
        }
    }

    /**
     * Reprocess a raw feed item using the parser
     * @param id The ID of the raw feed item to reprocess
     * @returns A success message or an error
     */
    async reprocessRaw(id: string): Promise<any> {
        try {
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            const FeedChannelsEntity = Repository.getEntity("FeedChannelsEntity");

            const raw = await Repository.findOne(FeedRawEntity, {
                id: id
            });

            if (!raw)
                throw new Error(`Raw feed item with ID ${id} not found`);

            const channel = await Repository.findOne(FeedChannelsEntity, {
                id: raw.channel
            });

            if (!channel)
                throw new Error(`Channel with ID ${raw.channel} not found`);

            if (!raw.link)
                throw new Error(`Raw feed item with ID ${id} has no link`);

            try {
                const parseResult = await this.parserService.parseContent(null, raw.link);

                if (!parseResult || !parseResult.success || !parseResult.data) {
                    throw new Error(`Failed to parse content from ${raw.link}`);
                }

                const data = parseResult.data;

                const updateData: any = {
                    updatedAt: new Date()
                };

                if (data.title) updateData.title = data.title;
                if (data.content) updateData.content = data.content;
                if (data.featureImage) updateData.featureImage = data.featureImage;

                await Repository.updateOne(FeedRawEntity, Repository.queryBuilder({ id: id }), updateData);

                return {
                    success: true,
                    message: "Raw feed item reprocessed successfully"
                };
            } catch (parseError) {
                this.logger.error(`Error parsing content from ${raw.link}: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
                throw new Error(`Failed to parse content: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
            }
        } catch (error: unknown) {
            this.logger.error(`Error reprocessing raw feed item: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Automatically classify raw feed items based on game development relevance using AI
     * @returns Information about the classification operation
     */
    async classifyRawsWithAI() {
        try {
            const classifyPrompt = Config.get("blog.classifyPrompt");
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            this.logger.log("Starting AI classification of raw feed items...");

            const rawItemsResponse = await Repository.findAll(FeedRawEntity, {
                rejected: false,
                relevance: 0,
                postRef: IsNull(),
                limit: 20,
                sortBy: "pubDate",
                sort: "DESC"
            });

            if (!rawItemsResponse || rawItemsResponse.data.length === 0) {
                this.logger.log("No unclassified raw items found for AI classification");
                return;
            }
            else{
                this.logger.log(`Found ${rawItemsResponse.data.length} unclassified raw items for AI classification`);
            }

            const rawItems = rawItemsResponse.data;

            const itemsForAI = rawItems.map((item: any) => ({
                id: item.id,
                title: item.title
            }));

            const prompt = `
            You are a content classification system for a news aggregation blog.

            I'll provide you with a list of article titles, descriptions, and categories from various sources.

            Your task is to classify each article based on its relevance to:

            IMPORTANT: You must return ONLY a valid JSON array with no additional text or explanation.
            Each item in the array should contain:
            - id: the original ID
            - relevance: a score from 1-100 indicating relevance to game development (higher = more relevant)
            - rejected: true if completely unrelated to gaming or game development, false otherwise

            ${classifyPrompt}

            Here are the items to classify:
            ${JSON.stringify(itemsForAI)}
            `;

            this.logger.log("Sending classification request to AI service");
            const aiResponse = await this.aiContentService.generateContent(prompt);

            if (!aiResponse)
                throw new Error("No response received from AI classification service");

            let classificationResults;

            try {
                try {
                    classificationResults = JSON.parse(aiResponse.trim());
                } catch (directParseError) {
                    const jsonMatch = aiResponse.match(/\[\s*\{.*\}\s*\]/s);

                    if (!jsonMatch)
                        throw new Error("No valid JSON array found in AI response");

                    classificationResults = JSON.parse(jsonMatch[0]);
                }

                if (!Array.isArray(classificationResults))
                    throw new Error("AI response is not an array");

                classificationResults.forEach((result, index) => {
                    if (!result.id)
                        throw new Error(`Result at index ${index} is missing id field`);

                    if (typeof result.relevance !== 'number')
                        throw new Error(`Result at index ${index} has invalid relevance value`);

                    if (typeof result.rejected !== 'boolean')
                        throw new Error(`Result at index ${index} has invalid rejected value`);
                });

                this.logger.log(`Successfully parsed ${classificationResults.length} classification results`);
            } catch (parseError) {
                this.logger.error(`Failed to parse AI classification response: ${parseError}`);
                this.logger.error(`AI response was: ${aiResponse.substring(0, 500)}...`);
                throw new Error(`Failed to parse AI classification response: ${parseError}`);
            }

            let rejectedCount = 0;
            let classifiedCount = 0;
            let errorCount = 0;

            for (const result of classificationResults) {
                try {
                    const id = result.id;
                    const relevance = result.relevance;
                    const rejected = result.rejected;

                    // Validate item exists in database
                    const rawItem = await Repository.findOne(FeedRawEntity, { id });
                    if (!rawItem) {
                        this.logger.log(`Raw item with ID ${id} not found, skipping`);
                        errorCount++;
                        continue;
                    }

                    // Update the raw feed item
                    const updateData: any = {
                        relevance: relevance
                    };

                    if (rejected) {
                        updateData.rejected = true;
                        rejectedCount++;
                    } else {
                        classifiedCount++;
                    }

                    await Repository.updateOne(FeedRawEntity, Repository.queryBuilder({ id }), updateData);
                    this.logger.log(`Updated raw item ${result.id} with relevance ${result.relevance} and rejected=${result.rejected}`);
                } catch (updateError) {
                    this.logger.error(`Error updating raw item ${result.id}: ${updateError}`);
                    errorCount++;
                }
            }

            return {
                success: true,
                message: "Raw feed items classified successfully",
                total: rawItems.length,
                classified: classifiedCount,
                rejected: rejectedCount,
                errors: errorCount
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error classifying raw feed items: ${errorMessage}`);
            throw new Error(`Failed to classify raw feed items: ${errorMessage}`);
        }
    }

    /**
     * Get raw feed items sorted by relevance
     * @param queries The queries to filter the raw feed items
     * @returns The raw feed items sorted by relevance
     */
    async getRelevantRaws(queries: any) {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");

        queries.rejected = false;
        queries.postRef = IsNull();

        const raw = await Repository.findAll(FeedRawEntity, queries, [], {
            order: {
                relevance: "DESC",
                pubDate: "DESC"
            }
        });

        return raw;
    }
}
