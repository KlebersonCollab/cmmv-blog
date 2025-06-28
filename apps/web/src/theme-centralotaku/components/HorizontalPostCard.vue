<template>
    <a :href="`/post/${post.slug}`" class="group flex bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out">
        <div class="w-1/3">
            <OptimizedImage
                :src="post.featureImage"
                :alt="post.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
                icon-size="sm"
            />
        </div>
        <div class="w-2/3 p-4 flex flex-col justify-between">
            <div>
                <h3 class="text-md font-bold text-gray-800 group-hover:text-[#ed1c24] transition-colors duration-300 line-clamp-2 mb-2">
                    {{ post.title }}
                </h3>
                <p class="text-sm text-gray-600 line-clamp-2 hidden sm:block">
                    {{ post.excerpt || stripHtml(post.content).substring(0, 100) + '...' }}
                </p>
            </div>
            <div class="text-xs text-gray-500 mt-2">
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
