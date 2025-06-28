<template>
    <div>
        <!-- Visualização padrão (sem filtro) -->
        <div v-if="!selectedCategory">
            <!-- Latest News -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <PostCard v-for="post in latestPosts" :key="post.id" :post="post" />
            </div>

            <!-- AdSense in-feed -->
            <div v-if="adSettings.enableAds && adSettings.homePageInFeed" class="my-8">
                <div class="ad-container ad-in-feed py-2 px-4 bg-gray-100 rounded-lg flex justify-center" v-if="getAdHtml('inFeed')">
                    <div v-html="getAdHtml('inFeed')"></div>
                </div>
                <div class="ad-container ad-in-feed py-2 px-4 bg-gray-100 rounded-lg flex justify-center" v-else>
                    <div class="ad-placeholder h-[90px] w-full max-w-[728px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                        <span>Anúncio</span>
                    </div>
                </div>
            </div>

            <!-- Review Section -->
            <CategorySection v-if="reviewPosts.length > 0" title="Análises em Destaque" :posts="reviewPosts" />
        </div>

        <!-- Visualização com filtro de categoria -->
        <div v-else>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CategoryPostCard v-for="post in posts" :key="post.id" :post="post" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import PostCard from './PostCard.vue';
import CategoryPostCard from './CategoryPostCard.vue';
import CategorySection from './CategorySection.vue';

const props = defineProps({
    selectedCategory: {
        type: String as () => string | null,
        default: null
    },
    posts: {
        type: Array as () => any[],
        default: () => []
    },
    latestPosts: {
        type: Array as () => any[],
        default: () => []
    },
    reviewPosts: {
        type: Array as () => any[],
        default: () => []
    },
    adSettings: {
        type: Object,
        default: () => ({})
    },
    getAdHtml: {
        type: Function,
        default: () => ''
    }
});
</script> 