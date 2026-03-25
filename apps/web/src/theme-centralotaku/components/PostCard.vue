<template>
  <article class="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1 border border-gray-100">
    <div class="relative overflow-hidden">
      <a :href="`/post/${post.slug}`" class="block">
        <div class="h-48 overflow-hidden">
          <OptimizedImage
            :src="post.featureImage"
            :alt="post.title"
            width="360"
            height="192"
            loading="lazy"
            priority="auto"
            :hover="true"
            icon-size="md"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </a>
    </div>
    <div class="p-5 flex flex-col flex-grow">
      <div class="flex items-center text-[10px] uppercase font-bold mb-3 tracking-wider">
        <a v-if="post.categories && post.categories.length > 0"
           :href="`/category/${post.categories[0].slug}`"
           class="bg-[#ed1c24] text-white px-2 py-0.5 rounded-md hover:bg-[#c5131a] transition-colors mr-3">
          {{ post.categories[0].name }}
        </a>
        <span class="text-slate-400 font-medium">{{ formatDate(post.publishedAt, true) }}</span>
      </div>
      <a :href="`/post/${post.slug}`" class="block flex-grow">
        <h3 class="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#ed1c24] transition-colors line-clamp-2 leading-snug">
          {{ post.title }}
        </h3>
        <p class="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {{ post.excerpt || stripHtml(post.content).substring(0, 100) + '...' }}
        </p>
      </a>
      <div class="mt-auto pt-4 border-t border-slate-50">
        <a :href="`/post/${post.slug}`" class="text-xs font-bold text-[#ed1c24] hover:text-[#c5131a] transition-colors inline-flex items-center group/link">
          LER MATÉRIA 
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1 transition-transform group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </a>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
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