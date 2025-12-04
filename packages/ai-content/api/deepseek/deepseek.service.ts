import { Service, Config, Logger } from "@cmmv/core";

interface RequestQueueItem {
    resolve: (value: string) => void;
    reject: (error: Error) => void;
    prompt: string;
}

interface ApiError extends Error {
    status?: number;
    retryAfter?: string;
}

@Service()
export class DeepSeekService {
    private readonly logger = new Logger("DeepSeekService");
    
    // Rate limiting configuration
    private readonly maxRequestsPerMinute = 20; // Conservative limit for DeepSeek API
    private readonly maxConcurrentRequests = 3; // Limit concurrent requests
    private readonly minDelayBetweenRequests = 3000; // 3 seconds minimum between requests
    
    // Rate limiting state
    private requestQueue: RequestQueueItem[] = [];
    private requestTimestamps: number[] = [];
    private activeRequests = 0;
    private lastRequestTime = 0;
    private processingQueue = false;

    async generateContent(prompt: string): Promise<string> {
        const deepseekApiKey = Config.get("blog.deepseekApiKey");
        const queueStartTime = Date.now();

        if (!deepseekApiKey) {
            throw new Error('DeepSeek API key not configured');
        }

        this.logger.log(`Adding request to queue. Queue size: ${this.requestQueue.length}, Active requests: ${this.activeRequests}`);

        return new Promise<string>((resolve, reject) => {
            let timeoutCleared = false;
            
            // Add timeout for the entire operation (queue wait + request)
            const totalTimeout = setTimeout(() => {
                if (!timeoutCleared) {
                    const elapsed = Date.now() - queueStartTime;
                    this.logger.error(`Total operation timeout after ${elapsed}ms (queue + request exceeded 160 seconds)`);
                    this.logger.error(`Queue state: size=${this.requestQueue.length}, active=${this.activeRequests}, processing=${this.processingQueue}`);
                    reject(new Error('Request timeout: The AI service took longer than 160 seconds to respond (including queue wait time)'));
                }
            }, 160000);

            const wrappedResolve = (value: string) => {
                if (!timeoutCleared) {
                    timeoutCleared = true;
                    clearTimeout(totalTimeout);
                    const totalTime = Date.now() - queueStartTime;
                    this.logger.log(`Request completed successfully in ${totalTime}ms (including queue wait)`);
                    resolve(value);
                }
            };

            const wrappedReject = (error: Error) => {
                if (!timeoutCleared) {
                    timeoutCleared = true;
                    clearTimeout(totalTimeout);
                    const totalTime = Date.now() - queueStartTime;
                    this.logger.error(`Request failed after ${totalTime}ms (including queue wait): ${error.message}`);
                    reject(error);
                }
            };

            this.requestQueue.push({
                resolve: wrappedResolve,
                reject: wrappedReject,
                prompt
            });

            this.processQueue();
        });
    }

    private async processQueue(): Promise<void> {
        // Prevent multiple queue processors
        if (this.processingQueue) {
            return;
        }

        this.processingQueue = true;

        try {
            while (this.requestQueue.length > 0 || this.activeRequests > 0) {
                // Wait if we've hit the concurrent request limit
                while (this.activeRequests >= this.maxConcurrentRequests) {
                    await this.delay(500);
                }

                // If queue is empty but there are active requests, wait for them
                if (this.requestQueue.length === 0) {
                    if (this.activeRequests > 0) {
                        await this.delay(500);
                        continue;
                    } else {
                        break;
                    }
                }

                // Check rate limit (requests per minute)
                this.cleanOldTimestamps();
                if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
                    const oldestTimestamp = this.requestTimestamps[0];
                    const waitTime = 60000 - (Date.now() - oldestTimestamp);
                    if (waitTime > 0) {
                        this.logger.log(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
                        await this.delay(waitTime);
                    }
                }

                // Ensure minimum delay between requests
                const timeSinceLastRequest = Date.now() - this.lastRequestTime;
                if (timeSinceLastRequest < this.minDelayBetweenRequests) {
                    const waitTime = this.minDelayBetweenRequests - timeSinceLastRequest;
                    await this.delay(waitTime);
                }

                const item = this.requestQueue.shift();
                if (!item) {
                    continue;
                }

                this.activeRequests++;
                this.lastRequestTime = Date.now();
                this.requestTimestamps.push(Date.now());

                // Process request asynchronously
                this.executeRequest(item).finally(() => {
                    this.activeRequests--;
                });
            }
        } finally {
            this.processingQueue = false;
        }
    }

    private async executeRequest(item: RequestQueueItem): Promise<void> {
        const maxRetries = 5;
        const baseDelay = 1000; // 1 second base delay

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.makeApiRequest(item.prompt);
                item.resolve(result);
                return;
            } catch (error: unknown) {
                const apiError = error as ApiError;
                const errorMessage = error instanceof Error ? error.message : String(error);
                const isRateLimitError = (apiError.status === 429) || 
                                        (errorMessage.includes('429')) ||
                                        (errorMessage.includes('rate limit'));

                if (isRateLimitError && attempt < maxRetries) {
                    // Exponential backoff with jitter
                    const backoffDelay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
                    const retryAfter = apiError.retryAfter ? parseInt(apiError.retryAfter, 10) * 1000 : backoffDelay;
                    
                    this.logger.log(
                        `Rate limit hit (429). Retrying in ${Math.ceil(retryAfter / 1000)} seconds... ` +
                        `(Attempt ${attempt + 1}/${maxRetries + 1})`
                    );

                    // Add extra delay to rate limit timestamps to prevent immediate retry
                    this.requestTimestamps.push(Date.now() + retryAfter);

                    await this.delay(retryAfter);
                    continue;
                }

                // If it's the last attempt or not a rate limit error, reject
                if (attempt === maxRetries) {
                    const finalError = error instanceof Error ? error : new Error(errorMessage);
                    this.logger.error(`Failed to generate content after ${maxRetries + 1} attempts: ${errorMessage}`);
                    item.reject(finalError);
                    return;
                }

                // For non-rate-limit errors, retry with exponential backoff
                const backoffDelay = baseDelay * Math.pow(2, attempt);
                this.logger.log(`Request failed. Retrying in ${Math.ceil(backoffDelay / 1000)} seconds... (Attempt ${attempt + 1}/${maxRetries + 1})`);
                await this.delay(backoffDelay);
            }
        }
    }

    private async makeApiRequest(prompt: string): Promise<string> {
        const deepseekApiKey = Config.get("blog.deepseekApiKey");
        const requestStartTime = Date.now();

        this.logger.log(`Starting DeepSeek API request, prompt length: ${prompt.length} characters`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            const elapsed = Date.now() - requestStartTime;
            this.logger.error(`DeepSeek API request timeout after ${elapsed}ms (160 seconds limit)`);
            controller.abort();
        }, 160000); // 160 seconds timeout

        try {
            this.logger.log(`Making fetch request to DeepSeek API...`);
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${deepseekApiKey || ''}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.1,
                    top_p: 0.9,
                    max_tokens: 8192
                }),
                signal: controller.signal
            });

            const fetchTime = Date.now() - requestStartTime;
            this.logger.log(`DeepSeek API fetch completed in ${fetchTime}ms, status: ${response.status}`);

            // Handle rate limiting (429)
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                clearTimeout(timeoutId);
                const error = new Error(`Rate limit exceeded (429). Too many requests to DeepSeek API.`) as ApiError;
                error.status = 429;
                error.retryAfter = retryAfter || undefined;
                throw error;
            }

            // Handle other errors
            if (!response.ok) {
                const errorText = await response.text();
                clearTimeout(timeoutId);
                let errorMessage = `Failed to generate AI content: ${response.status} ${response.statusText}`;
                
                try {
                    const errorJson = JSON.parse(errorText) as { error?: { message?: string } };
                    errorMessage = errorJson.error?.message || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }

                const error = new Error(errorMessage) as ApiError;
                error.status = response.status;
                throw error;
            }

            const deepseekResponse = await response.json();
            const generatedText = deepseekResponse.choices?.[0]?.message?.content;

            if (!generatedText) {
                clearTimeout(timeoutId);
                throw new Error('No content generated by DeepSeek');
            }

            clearTimeout(timeoutId);
            const totalTime = Date.now() - requestStartTime;
            this.logger.log(`DeepSeek API request completed successfully in ${totalTime}ms`);
            return generatedText;
        } catch (error: unknown) {
            clearTimeout(timeoutId);
            const totalTime = Date.now() - requestStartTime;
            
            if (error instanceof Error) {
                // Check for various abort/timeout error types - be more specific
                const errorMsgLower = error.message?.toLowerCase().trim() || '';
                const isAbortError = error.name === 'AbortError' || 
                    errorMsgLower === 'terminated' ||
                    errorMsgLower.includes('the operation was aborted') ||
                    (errorMsgLower.includes('aborted') && errorMsgLower.includes('signal'));
                
                if (isAbortError) {
                    this.logger.error(`Request aborted/timed out after ${totalTime}ms: ${error.message} (name: ${error.name})`);
                    this.logger.error(`This may indicate: 1) Network timeout, 2) Server-side timeout, 3) Proxy/LB timeout, or 4) Actual 480s timeout`);
                    throw new Error('Request timeout: The AI service took longer than 160 seconds to respond');
                }
                
                // Log other errors for debugging - don't convert to timeout
                this.logger.error(`DeepSeek API request error after ${totalTime}ms: ${error.message}, name: ${error.name}`);
                if (error.stack) {
                    this.logger.error(`Error stack: ${error.stack.substring(0, 500)}`);
                }
            } else {
                this.logger.error(`DeepSeek API unknown error after ${totalTime}ms: ${String(error)}`);
            }
            
            throw error;
        }
    }

    private cleanOldTimestamps(): void {
        const oneMinuteAgo = Date.now() - 60000;
        this.requestTimestamps = this.requestTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
