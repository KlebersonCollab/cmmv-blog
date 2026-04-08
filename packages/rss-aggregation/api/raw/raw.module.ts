import { Module } from '@cmmv/core';

import {
    RawService
} from "./raw.service";

import {
    RawController
} from "./raw.controller";

import {
    ContentSanitizer
} from "./content-sanitizer";

import {
    SecurityService
} from "../security/security.service";

export const RSSRawModule = new Module('rss-raw', {
    providers: [RawService, ContentSanitizer, SecurityService],
    controllers: [RawController]
});
