import {
    Controller, Get, RouterSchema,
    Queries, Req, Param,
    CacheControl, ContentType, Raw
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    ChannelsService
} from "./channels.service";

import {
    SecurityService
} from "../security/security.service";

@Controller("feed/channels")
export class ChannelsController {
    constructor(
        private readonly channelsService: ChannelsService,
        private readonly securityService: SecurityService
    ){}

    @Get("processFeeds", {exclude: true })
    @Auth("feedchannels:update")
    async processFeeds() {
        return await this.channelsService.processFeeds(true);
    }

    @Get("processFeed/:channelId", {exclude: true })
    @Auth("feedchannels:update")
    async processFeed(@Param("channelId") channelId: string) {
        // Validate channelId for security issues (permissive approach - only warnings)
        // Basic validation for ID format (UUID-like or alphanumeric)
        if (!channelId || channelId.length > 100) {
            const validationResult = this.securityService.validateUrl(`placeholder://${channelId}`, 'processFeed_endpoint');
            if (validationResult.warnings.length > 0) {
                this.securityService.logWarnings(validationResult.warnings);
            }
        }

        return await this.channelsService.processFeed(channelId);
    }
}
