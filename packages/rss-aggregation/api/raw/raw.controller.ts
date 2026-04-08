import {
    Controller, Get, Param,
    Put, Body, Queries, Response, Query, Post,
    HttpException, HttpStatus
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    RawService
} from "./raw.service";

import {
    SecurityService
} from "../security/security.service";

@Controller("feed/raw")
export class RawController {
    constructor(
        private readonly rawService: RawService,
        private readonly securityService: SecurityService
    ){}

    @Get("getRaws", {exclude: true })
    @Auth("feedraw:get")
    async getRaws(@Queries() queries: any) {
        // Validate query parameters for security issues (permissive approach - only warnings)
        const validationResult = this.securityService.validateJson(queries, 'getRaws_endpoint');
        if (validationResult.warnings.length > 0) {
            this.securityService.logWarnings(validationResult.warnings);
        }

        return await this.rawService.getRaws(queries);
    }

    @Post("getAIRaw/:id", {exclude: true })
    @Auth("feedraw:get")
    async getAIRaw(@Param("id") id: string, @Body() data?: any) {
        // Validate request body for security issues (permissive approach - only warnings)
        if (data) {
            const validationResult = this.securityService.validateRequestBody(data, 'getAIRaw_endpoint');
            if (validationResult.warnings.length > 0) {
                this.securityService.logWarnings(validationResult.warnings);
            }
        }

        return await this.rawService.getAIRaw(id, data?.content, data?.promptId, data?.model);
    }

    @Post("startAIJob/:id", {exclude: true })
    @Auth("feedraw:get")
    async startAIJob(@Param("id") id: string, @Body() data?: any) {
        // Validate request body for security issues (permissive approach - only warnings)
        if (data) {
            const validationResult = this.securityService.validateRequestBody(data, 'startAIJob_endpoint');
            if (validationResult.warnings.length > 0) {
                this.securityService.logWarnings(validationResult.warnings);
            }
        }

        const jobId = await this.rawService.startAIJob(id, data?.content, data?.promptId, data?.model);
        return { jobId };
    }

    @Get("getAIJobStatus/:jobId", {exclude: true })
    @Auth("feedraw:get")
    async getAIJobStatus(@Param("jobId") jobId: string) {
        // Validate jobId format
        if (!jobId || !jobId.startsWith('ai-job-')) {
            throw new HttpException(`Invalid job ID format: ${jobId}`, HttpStatus.BAD_REQUEST);
        }

        try {
            return await this.rawService.getAIJobStatus(jobId);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('not found')) {
                throw new HttpException(`Job ${jobId} not found. It may have expired or been cleaned up.`, HttpStatus.NOT_FOUND);
            }
            throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Put("updateRaw/:id", {exclude: true })
    @Auth("feedraw:update")
    async updateRaw(@Param("id") id: string, @Body() data: any) {
        // Validate request body for security issues (permissive approach - only warnings)
        if (data) {
            const validationResult = this.securityService.validateRequestBody(data, 'updateRaw_endpoint');
            if (validationResult.warnings.length > 0) {
                this.securityService.logWarnings(validationResult.warnings);
            }
        }

        return await this.rawService.updateRaw(id, data);
    }

    @Put("rejectRaw/:id", {exclude: true })
    @Auth("feedraw:update")
    async rejectRaw(@Param("id") id: string) {
        // Validate ID format for security (permissive approach - only warnings)
        if (id && typeof id === 'string') {
            const validationResult = this.securityService.validateJson({ id }, 'rejectRaw_endpoint');
            if (validationResult.warnings.length > 0) {
                this.securityService.logWarnings(validationResult.warnings);
            }
        }
        return await this.rawService.rejectRaw(id);
    }

    @Get("imageProxy", {exclude: true })
    async imageProxy(@Query("url") url: string, @Response() res: Response) {
        // Validate URL input for security issues (permissive approach - only warnings)
        const validationResult = this.securityService.validateUrl(url, 'imageProxy_endpoint');
        if (validationResult.warnings.length > 0) {
            this.securityService.logWarnings(validationResult.warnings);
        }

        return await this.rawService.proxyImage(url, res);
    }

    @Get("audioProxy", {exclude: true })
    async audioProxy(@Query("url") url: string, @Response() res: Response) {
        // Validate URL input for security issues (permissive approach - only warnings)
        const validationResult = this.securityService.validateUrl(url, 'audioProxy_endpoint');
        if (validationResult.warnings.length > 0) {
            this.securityService.logWarnings(validationResult.warnings);
        }

        return await this.rawService.proxyAudio(url, res);
    }

    @Get("cleanAllRaws", {exclude: true })
    @Auth("feedraw:delete")
    async cleanAllRaws() {
        return await this.rawService.cleanAllRaws();
    }

    @Get("cleanChannelRaws/:channelId", {exclude: true })
    @Auth("feedraw:delete")
    async cleanChannelRaws(
        @Param("channelId") channelId: string
    ) {
        // Validate channelId for security (permissive approach - only warnings)
        if (channelId && typeof channelId === 'string') {
            const validationResult = this.securityService.validateJson({ channelId }, 'cleanChannelRaws_endpoint');
            if (validationResult.warnings.length > 0) {
                this.securityService.logWarnings(validationResult.warnings);
            }
        }
        return await this.rawService.cleanChannelRaws(channelId);
    }

    @Post("reprocess/:id", {exclude: true })
    @Auth("feedraw:update")
    async reprocessRaw(@Param("id") id: string) {
        // Validate ID format for security (permissive approach - only warnings)
        if (id && typeof id === 'string') {
            const validationResult = this.securityService.validateJson({ id }, 'reprocessRaw_endpoint');
            if (validationResult.warnings.length > 0) {
                this.securityService.logWarnings(validationResult.warnings);
            }
        }
        return await this.rawService.reprocessRaw(id);
    }

    @Post("classifyRawsWithAI", {exclude: true })
    @Auth("feedraw:update")
    async classifyRawsWithAI() {
        // Log security context for AI classification batch job
        const validationResult = this.securityService.validateJson(
            { action: 'batch_ai_classification' },
            'classifyRawsWithAI_endpoint'
        );
        if (validationResult.warnings.length > 0) {
            this.securityService.logWarnings(validationResult.warnings);
        }
        return await this.rawService.classifyRawsWithAI();
    }

    @Post("startBatchAIJob", {exclude: true })
    @Auth("feedraw:get")
    async startBatchAIJob(@Body() data: any) {
        // Validate request body for security issues (permissive approach - only warnings)
        if (data) {
            const validationResult = this.securityService.validateRequestBody(data, 'startBatchAIJob_endpoint');
            if (validationResult.warnings.length > 0) {
                this.securityService.logWarnings(validationResult.warnings);
            }
        }

        if (!data?.ids || !Array.isArray(data.ids)) {
            throw new HttpException("IDs array is required", HttpStatus.BAD_REQUEST);
        }
        const jobIds = await this.rawService.startBatchAIJob(data.ids, data?.model, data?.promptId);
        return { jobIds };
    }
}
