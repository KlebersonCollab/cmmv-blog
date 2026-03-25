<template>
    <div class="mt-8">
        <div class="flex items-center justify-between mb-8 pb-3 relative">
            <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {{ title }}
            </h2>
            <router-link
                v-if="categorySlug"
                :to="`/category/${categorySlug}`"
                class="text-xs font-bold text-[#ed1c24] hover:text-[#c5131a] transition-colors uppercase tracking-widest flex items-center group"
            >
                Ver tudo
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </router-link>
            <div class="absolute bottom-0 left-0 w-20 h-1.5 bg-[#ed1c24] rounded-full"></div>
            <div class="absolute bottom-0 left-0 w-full h-px bg-slate-200 dark:bg-slate-800"></div>
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
