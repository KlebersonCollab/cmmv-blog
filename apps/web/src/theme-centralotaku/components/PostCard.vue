<template>
  <article class="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
    <a :href="`/post/${post.slug}`" class="block">
      <div class="h-48 overflow-hidden">
        <OptimizedImage
          :src="post.featureImage"
          :alt="post.title"
          width="360"
          height="192"
          loading="lazy"
          priority="high"
          :hover="true"
          icon-size="md"
          class="w-full h-full object-cover"
        />
      </div>
    </a>
    <div class="p-5 flex flex-col flex-grow">
      <div class="flex items-center text-xs text-gray-500 mb-3">
        <a v-if="post.categories && post.categories.length > 0"
           :href="`/category/${post.categories[0].slug}`"
           class="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium hover:bg-blue-200 transition-colors">
          {{ post.categories[0].name }}
        </a>
        <span class="ml-3">{{ formatDate(post.publishedAt, true) }}</span>
      </div>
      <a :href="`/post/${post.slug}`" class="block flex-grow">
        <h3 class="text-lg font-bold text-gray-900 mb-2 hover:text-[#ed1c24] transition-colors line-clamp-2">
          {{ post.title }}
        </h3>
        <p class="text-gray-600 text-sm mb-4 line-clamp-3">
          {{ post.excerpt || stripHtml(post.content).substring(0, 120) + '...' }}
        </p>
      </a>
      <div class="mt-auto">
        <a :href="`/post/${post.slug}`" class="text-sm font-semibold text-[#ed1c24] hover:text-[#d13a5b] transition-colors">
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

<style scoped>
.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style> 