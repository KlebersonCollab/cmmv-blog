<template>
    <div class="mt-8">
        <div class="flex flex-col mb-8 relative">
            <h2 class="text-3xl md:text-4xl font-black text-black tracking-tighter uppercase italic">
                <span v-for="(word, index) in titleWords" :key="index" :class="{ 'text-[#ed1c24]': index === titleWords.length - 1 }">
                    {{ word }}{{ index < titleWords.length - 1 ? ' ' : '' }}
                </span>
            </h2>
            <div class="mt-2 w-full h-1 bg-[#ed1c24] rounded-full opacity-20 relative">
                <div class="absolute inset-0 w-32 h-full bg-[#ed1c24] rounded-full shadow-[0_0_10px_rgba(237,28,36,0.5)]"></div>
            </div>
            <router-link
                v-if="categorySlug"
                :to="`/category/${categorySlug}`"
                class="absolute right-0 top-1 text-xs font-bold text-[#ed1c24] hover:text-[#c5131a] transition-colors uppercase tracking-widest flex items-center group"
            >
                Ver tudo
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </router-link>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            <HorizontalPostCard v-for="post in posts" :key="post.id" :post="post" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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

const titleWords = computed(() => props.title.split(' '));
</script>
