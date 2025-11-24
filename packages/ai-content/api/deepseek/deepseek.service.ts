import { Service, Config, Logger } from "@cmmv/core";

interface RequestQueueItem {
    resolve: (value: string) => void;
    reject: (error: Error) => void;
    prompt: string;
    retries: number;
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

        if (!deepseekApiKey) {
            throw new Error('DeepSeek API key not configured');
        }

        return new Promise<string>((resolve, reject) => {
            this.requestQueue.push({
                resolve,
                reject,
                prompt,
                retries: 0
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
            } catch (error: any) {
                const isRateLimitError = error.status === 429 || 
                                        (error.message && error.message.includes('429')) ||
                                        (error.message && error.message.includes('rate limit'));

                if (isRateLimitError && attempt < maxRetries) {
                    // Exponential backoff with jitter
                    const backoffDelay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
                    const retryAfter = error.retryAfter ? parseInt(error.retryAfter) * 1000 : backoffDelay;
                    
                    this.logger.warn(
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
                    this.logger.error(`Failed to generate content after ${maxRetries + 1} attempts: ${error.message}`);
                    item.reject(error);
                    return;
                }

                // For non-rate-limit errors, retry with exponential backoff
                const backoffDelay = baseDelay * Math.pow(2, attempt);
                this.logger.warn(`Request failed. Retrying in ${Math.ceil(backoffDelay / 1000)} seconds... (Attempt ${attempt + 1}/${maxRetries + 1})`);
                await this.delay(backoffDelay);
            }
        }
    }

    private async makeApiRequest(prompt: string): Promise<string> {
        const deepseekApiKey = Config.get("blog.deepseekApiKey");

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
            })
        });

        // Handle rate limiting (429)
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const error: any = new Error(`Rate limit exceeded (429). Too many requests to DeepSeek API.`);
            error.status = 429;
            error.retryAfter = retryAfter;
            throw error;
        }

        // Handle other errors
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Failed to generate AI content: ${response.status} ${response.statusText}`;
            
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error?.message || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            const error: any = new Error(errorMessage);
            error.status = response.status;
            throw error;
        }

        const deepseekResponse = await response.json();
        const generatedText = deepseekResponse.choices?.[0]?.message?.content;

        if (!generatedText) {
            throw new Error('No content generated by DeepSeek');
        }

        return generatedText;
    }

    private cleanOldTimestamps(): void {
        const oneMinuteAgo = Date.now() - 60000;
        this.requestTimestamps = this.requestTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
