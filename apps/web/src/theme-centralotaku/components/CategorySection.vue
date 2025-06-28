<template>
    <div class="mt-8">
        <div class="flex items-center justify-between mb-6 border-b-2 border-gray-200 pb-2">
            <h2 class="text-xl font-bold text-[#ed1c24]">{{ title }}</h2>
            <router-link
                v-if="categorySlug"
                :to="`/category/${categorySlug}`"
                class="text-sm font-semibold text-white bg-[#ed1c24] px-3 py-1 rounded-md hover:bg-[#c5131a] transition-colors"
            >
                Ver Todos
            </router-link>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            <HorizontalPostCard v-for="post in posts" :key="post.id" :post="post" />
        </div>
    </div>
</template>

<script setup lang="ts">
import HorizontalPostCard from './HorizontalPostCard.vue';

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    posts: {
        type: Array as () => any[],
        default: () => []
    },
    categorySlug: {
        type: String,
        default: null
    }
});
</script>
