import { Module } from '@cmmv/core';

import {
    ChannelsService
} from "./channels.service";

import {
    ChannelsController
} from "./channels.controller";

import {
    SecurityService
} from "../security/security.service";

export const RSSChannelsModule = new Module('rss-channels', {
    providers: [ChannelsService, SecurityService],
    controllers: [ChannelsController]
});
