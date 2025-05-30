import { Module } from '@cmmv/core';

import { AuthorProfileContract } from "../../contracts";
import { BlogProfileController } from './profile.controller';
import { BlogProfileService } from "./profile.service";

export const ProfileModule = new Module('blog_profile', {
    controllers: [BlogProfileController],
    providers: [BlogProfileService],
    contracts: [AuthorProfileContract]
});
