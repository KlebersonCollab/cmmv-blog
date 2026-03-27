<template>
    <a :href="`/post/${post.slug}`" class="group flex bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 hover:-translate-y-1 relative">
        <div class="w-1/3 overflow-hidden">
            <div v-if="post.categories && post.categories.length > 0" class="absolute top-2 left-2 z-10">
                <span class="bg-[#c5131a]/90 backdrop-blur-sm text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">
                    {{ post.categories[0].name }}
                </span>
            </div>
            <OptimizedImage
                :src="post.featureImage"
                :alt="post.title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                icon-size="sm"
            />
        </div>
        <div class="w-2/3 p-4 flex flex-col justify-between">
            <div>
                <h3 class="text-sm font-bold text-slate-800 group-hover:text-[#c5131a] transition-colors duration-300 line-clamp-2 mb-2 leading-snug">
                    {{ post.title }}
                </h3>
                <p class="text-xs text-slate-600 line-clamp-2 hidden sm:block leading-relaxed">
                    {{ post.excerpt || stripHtml(post.content).substring(0, 80) + '...' }}
                </p>
            </div>
            <div class="text-[10px] font-medium text-slate-500 mt-2 uppercase tracking-tight">
                <span>{{ formatDate(post.publishedAt) }}</span>
            </div>
        </div>
    </a>
</template>

<script setup lang="ts">
import OptimizedImage from '../../components/OptimizedImage.vue';
import { formatDate, stripHtml } from '../../composables/useUtils';

defineProps({
    post: {
        type: Object,
        required: true,
    },
});
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
