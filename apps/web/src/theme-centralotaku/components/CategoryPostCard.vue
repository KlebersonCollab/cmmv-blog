<template>
    <div class="bg-white rounded-xl shadow-lg overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl flex flex-col h-full">
        <a :href="`/post/${post.slug}`" class="block group">
            <div class="relative aspect-video">
                <OptimizedImage
                    :src="post.featureImage"
                    :alt="post.featureImageAlt || post.title"
                    class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    width="400"
                    height="225"
                    icon-size="md"
                />
                <div class="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
            </div>
        </a>
        <div class="p-5 flex flex-col flex-grow">
            <h3 class="text-lg font-bold text-gray-900 mb-2 leading-tight flex-grow">
                <a :href="`/post/${post.slug}`" class="hover:text-[#ed1c24] transition-colors">
                    {{ post.title }}
                </a>
            </h3>
            <p class="text-gray-600 text-sm mb-4 line-clamp-3">
                {{ post.excerpt || stripHtml(post.content).substring(0, 120) + '...' }}
            </p>

            <!-- Tags -->
            <div v-if="post.tags && post.tags.length > 0" class="mb-4 flex flex-wrap gap-2">
                <a v-for="tag in post.tags" :key="tag.id" :href="`/tag/${tag.slug}`"
                   class="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full hover:bg-gray-200 transition-colors">
                    #{{ tag.name }}
                </a>
            </div>

            <div class="flex items-center text-xs text-gray-500 mt-auto pt-4 border-t border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{{ formatDate(post.publishedAt || post.updatedAt, 'relative') }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import OptimizedImage from '../../components/OptimizedImage.vue';
import { formatDate, stripHtml } from '../../composables/useUtils';

defineProps({
  post: {
    type: Object as () => any,
    required: true
  }
});
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 