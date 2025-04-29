import {
    Contract, AbstractContract,
    ContractField, ContractMessage,
    ContractService
} from "@cmmv/core";

@Contract({
    namespace: 'Blog',
    controllerName: 'Categories',
    protoPackage: 'blog',
    subPath: '/blog',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "blog_categories",
        databaseTimestamps: true
    }
})
export class CategoriesContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true
    })
    name!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true
    })
    slug!: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true
    })
    parentCategory!: string;

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true
    })
    active!: boolean;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    navigationLabel!: string;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    description?: string;

    @ContractField({
        protoType: 'int32',
        nullable: true,
        defaultValue: 0,
        index: true
    })
    postCount!: number;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true
    })
    mainNavGroup!: string;

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: false,
        index: true
    })
    mainNav!: boolean;

    @ContractField({
        protoType: 'int32',
        nullable: true,
        defaultValue: 0,
        index: true
    })
    mainNavIndex!: number;

    @ContractMessage({
        name: "PublicCategoriesListResponse",
        properties: {
            name: {
                type: "string",
                required: true
            },
            slug: {
                type: "string",
                required: true
            },
            parentCategory: {
                type: "string",
                required: false
            },
            active: {
                type: "bool",
                required: true
            },
            navigationLabel: {
                type: "string",
                required: false
            }
        }
    })
    PublicCategoriesListResponse!: {};

    @ContractService({
        name: "PublicCategoriesList",
        path: "api/categories",
        method: "GET",
        auth: false,
        functionName: "getAll",
        createBoilerplate: false,
        response: "PublicCategoriesListResponse"
    })
    PublicCategoriesList!: Function;
}
