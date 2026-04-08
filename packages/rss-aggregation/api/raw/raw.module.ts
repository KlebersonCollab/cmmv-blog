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

export const RSSRawModule = new Module('rss-raw', {
    providers: [RawService, ContentSanitizer],
    controllers: [RawController]
});
