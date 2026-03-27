<template>
  <article class="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full border border-slate-100 hover:-translate-y-1">
    <a :href="`/post/${post.slug}`" class="block relative overflow-hidden">
      <div class="h-44 overflow-hidden">
        <OptimizedImage
          v-if="post.image"
          :src="post.image"
          :alt="post.title"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          icon-size="lg"
        />
        <div v-else class="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      <div v-if="post.categories && post.categories.length > 0" class="absolute top-3 left-3">
         <span class="bg-[#c5131a]/90 backdrop-blur-sm text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">
           {{ post.categories[0].name }}
         </span>
      </div>
    </a>
    <div class="p-4 flex flex-col flex-grow">
      <div class="flex items-center text-[10px] font-medium text-slate-500 mb-2 uppercase tracking-tight">
        <span>{{ formatDate(post.publishedAt || post.updatedAt, true) }}</span>
      </div>
      <a :href="`/post/${post.slug}`" class="block flex-grow">
        <h3 class="text-md font-bold text-slate-800 mb-2 group-hover:text-[#c5131a] transition-colors line-clamp-2 leading-snug">
          {{ post.title }}
        </h3>
      </a>
      <div class="mt-auto pt-3 border-t border-slate-50">
        <a :href="`/post/${post.slug}`" class="text-[10px] font-bold text-[#c5131a] hover:text-[#991b1b] transition-colors inline-flex items-center group/link uppercase tracking-wider">
          LER AGORA 
          <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5 ml-1 transition-transform group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
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