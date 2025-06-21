<template>
    <article class="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
        <a :href="`/post/${post.slug}`" class="block">
            <div class="relative h-48 bg-gray-200">
                <OptimizedImage
                    v-if="post.image"
                    :src="post.image"
                    :alt="post.title"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    icon-size="lg"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div v-if="post.categories && post.categories.length > 0" class="absolute top-3 left-3">
                    <span class="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                        {{ post.categories[0].name }}
                    </span>
                </div>
            </div>
        </a>
        <div class="p-4 flex flex-col flex-grow">
            <p class="text-gray-500 text-xs mb-2">{{ formatDate(post.publishedAt || post.updatedAt, true) }}</p>
            <h3 class="text-lg font-bold text-gray-800 mb-2 flex-grow">
                <a :href="`/post/${post.slug}`" class="hover:text-[#ed1c24] transition-colors">
                    {{ post.title }}
                </a>
            </h3>
            <div class="text-sm text-gray-600 mb-4 line-clamp-3" v-if="post.summary || post.content">
                {{ post.summary || stripHtml(post.content || '').substring(0, 100) + '...' }}
            </div>
            <div class="mt-auto">
                <a :href="`/post/${post.slug}`" class="text-[#ed1c24] font-semibold text-sm hover:underline">
                    Ler mais &rarr;
                </a>
            </div>
        </div>
    </article>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { formatDate, stripHtml } from '../../composables/useUtils';
import OptimizedImage from '../../components/OptimizedImage.vue';

defineProps({
    post: {
        type: Object,
        required: true,
    },
});
</script> 