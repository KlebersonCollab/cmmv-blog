import { Module } from '@cmmv/core';

import {
    FeedChannelsContract,
    FeedRawContract,
    FeedParserContract
} from '../contracts';

import {
    RSSChannelsModule
} from "./channels/channels.module";

import {
    RSSRawModule
} from "./raw/raw.module";

import {
    RSSParserModule
} from "./parser/parser.module";

import {
    SecurityService
} from "./security/security.service";

export const RSSAggregationModule = new Module('rss-aggregation', {
    contracts: [
        FeedChannelsContract,
        FeedRawContract,
        FeedParserContract
    ],
    providers: [SecurityService],
    submodules: [
        RSSChannelsModule,
        RSSRawModule,
        RSSParserModule
    ]
});
