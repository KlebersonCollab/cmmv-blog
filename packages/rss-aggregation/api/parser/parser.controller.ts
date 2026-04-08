import {
    Controller, Get, Param,
    Query, Post, Body, Put
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    ParserService
} from "./parser.service";

import {
    SecurityService
} from "../security/security.service";

@Controller("feed/parser")
export class ParserController {
    constructor(
        private readonly parserService: ParserService,
        private readonly securityService: SecurityService
    ){}

    @Get("parseURL")
    @Auth("feedparser:get")
    async parseURL(@Query("url") url: string) {
        // Validate URL input for security issues (permissive approach - only warnings)
        const validationResult = this.securityService.validateUrl(url, 'parseURL_endpoint');
        if (validationResult.warnings.length > 0) {
            this.securityService.logWarnings(validationResult.warnings);
        }

        return await this.parserService.parseURL(url);
    }

    @Get("parseContent/:parserId")
    @Auth("feedparser:get")
    async parseContent(@Param("parserId") parserId: string, @Query("url") url: string) {
        // Validate URL input for security issues (permissive approach - only warnings)
        const validationResult = this.securityService.validateUrl(url, 'parseContent_endpoint');
        if (validationResult.warnings.length > 0) {
            this.securityService.logWarnings(validationResult.warnings);
        }

        return await this.parserService.parseContent(parserId, url);
    }

    @Get("parseContentAll")
    @Auth("feedparser:get")
    async parseContentAll(@Query("url") url: string) {
        // Validate URL input for security issues (permissive approach - only warnings)
        const validationResult = this.securityService.validateUrl(url, 'parseContentAll_endpoint');
        if (validationResult.warnings.length > 0) {
            this.securityService.logWarnings(validationResult.warnings);
        }

        return await this.parserService.parseContent(null, url);
    }

    @Get("analyze-all")
    @Auth("feedparser:get")
    async analyzeAllParsers() {
        return await this.parserService.analyzeAllParsers();
    }

    @Post()
    @Auth("feedparser:create")
    async createParser(@Body() body: any) {
        // Validate request body for security issues (permissive approach - only warnings)
        const validationResult = this.securityService.validateRequestBody(body, 'createParser_endpoint');
        if (validationResult.warnings.length > 0) {
            this.securityService.logWarnings(validationResult.warnings);
        }

        return await this.parserService.createParser(body);
    }

    @Put(":id")
    @Auth("feedparser:update")
    async updateParser(@Param("id") id: string, @Body() body: any) {
        // Validate request body for security issues (permissive approach - only warnings)
        const validationResult = this.securityService.validateRequestBody(body, 'updateParser_endpoint');
        if (validationResult.warnings.length > 0) {
            this.securityService.logWarnings(validationResult.warnings);
        }

        return await this.parserService.updateParser(id, body);
    }

    @Post("refine")
    @Auth("feedparser:update")
    async refineParser(@Body() body: { url: string; parser: any }) {
        // Validate request body for security issues (permissive approach - only warnings)
        const validationResult = this.securityService.validateRequestBody(body, 'refineParser_endpoint');
        if (validationResult.warnings.length > 0) {
            this.securityService.logWarnings(validationResult.warnings);
        }

        const { url, parser } = body;
        return await this.parserService.refineWithAI(url, parser);
    }

    @Post("test-custom")
    @Auth("feedparser:get")
    async testCustomParser(@Body() body: { url: string; parserData: any }) {
        // Validate request body for security issues (permissive approach - only warnings)
        const validationResult = this.securityService.validateRequestBody(body, 'testCustomParser_endpoint');
        if (validationResult.warnings.length > 0) {
            this.securityService.logWarnings(validationResult.warnings);
        }

        const { url, parserData } = body;
        return await this.parserService.testCustomParser(url, parserData);
    }
}
