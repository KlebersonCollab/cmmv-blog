import { Module } from '@cmmv/core';

import {
    ParserService
} from "./parser.service";

import {
    ParserController
} from "./parser.controller";

import {
    SecurityService
} from "../security/security.service";

export const RSSParserModule = new Module('rss-parser', {
    providers: [ParserService, SecurityService],
    controllers: [ParserController]
});
