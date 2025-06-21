<template>
    <div class="w-full relative bg-neutral-100">
        <div class="lg:max-w-4xl md:max-w-3xl mx-auto">
            <div v-if="!category" class="bg-white rounded-lg p-6">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-neutral-800 mb-4">Categoria não encontrada</h1>
                    <p class="text-neutral-600">A categoria que você está procurando não existe ou está indisponível.</p>
                </div>
            </div>

            <div v-else class="bg-white rounded-lg p-6 article-container overflow-hidden">
                <header class="border-b border-neutral-200 pb-4 mb-6 pr-4 pt-4">
                    <h1 class="text-3xl font-bold text-neutral-900 mb-3">{{ category.name }}</h1>
                    <p v-if="category.description" class="text-neutral-600 mb-4">{{ category.description }}</p>
                    <div class="text-sm text-neutral-500">{{ category.postCount }} posts nesta categoria</div>
                </header>

                <!-- Initial loading state -->
                <div v-if="loading && posts.length === 0" class="flex justify-center items-center py-20">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ed1c24]"></div>
                </div>

                <!-- Posts List -->
                <div v-else-if="posts.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <CategoryPostCard
                        v-for="post in posts"
                        :key="post.id"
                        :post="post"
                    />
                </div>

                <!-- No posts state -->
                <div v-else-if="!loading && posts.length === 0" class="text-center py-16">
                    <h2 class="text-2xl font-bold mb-2 text-neutral-800">Nenhum post encontrado nesta categoria</h2>
                    <p class="text-neutral-600">Volte mais tarde para novos conteúdos!</p>
                </div>

                <!-- Loading more indicator -->
                <div v-if="loadingMore" class="mt-8 flex justify-center items-center py-6">
                    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ed1c24]"></div>
                </div>

                <!-- No more posts indicator -->
                <div v-if="!hasMorePosts && posts.length > 0 && !loadingMore" class="mt-8 text-center py-4 text-neutral-500">

                </div>

                <!-- Intersection observer target -->
                <div ref="observerTarget" class="h-4 w-full"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
//@ts-nocheck
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useHead } from '@unhead/vue'
import { vue3 } from '@cmmv/blog/client';
import { useSettingsStore } from '../../store/settings';
import OptimizedImage from '../../components/OptimizedImage.vue';
import CategoryPostCard from '../components/CategoryPostCard.vue';

import {
    formatDate, stripHtml
} from '../../composables/useUtils';

const settingsStore = useSettingsStore();
const blogAPI = vue3.useBlog();
const route = useRoute();

const isSSR = import.meta.env.SSR
const posts = ref<any[]>([]);
const settings = ref<any>(settingsStore.getSettings);
const category = ref<any>(null);
const pagination = ref<any>(null);
const loading = ref(true);
const loadingMore = ref(false);
const hasMorePosts = ref(true);
const currentPage = ref(0);
const observerTarget = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

loading.value = true;

const data = ref<any>(route.params.id ?
    await blogAPI.categories.getById(route.params.id as string) :
    await blogAPI.categories.getBySlug(route.params.slug as string));

category.value = data.value.category;
posts.value = data.value.posts?.data || [];
pagination.value = data.value.posts?.pagination;

hasMorePosts.value = posts.value.length < (data.value.posts?.count || 0);

const pageUrl = computed(() => {
    return `${import.meta.env.VITE_WEBSITE_URL}/category/${category.value?.slug || ''}`
})

const headData = ref({
    title: category.value.name + ' - ' + settings.value['blog.title'],
    meta: [
        { name: 'description', content: category.value.description },
        { name: 'keywords', content: settings.value['blog.keywords'] },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: category.value.name + ' - ' + settings.value['blog.title'] },
        { property: 'og:description', content: category.value.description },
        { property: 'og:image', content: settings.value['blog.logo'] },
        { property: 'og:url', content: pageUrl.value }
    ],
    link: [
        { rel: 'canonical', href: pageUrl.value }
    ]
})

useHead(headData);

const loadMorePosts = async () => {
    if (loadingMore.value || !hasMorePosts.value) return;

    try {
        loadingMore.value = true;
        currentPage.value++;

        const response = route.params.id ?
            await blogAPI.categories.getById(route.params.id as string, posts.value.length) :
            await blogAPI.categories.getBySlug(route.params.slug as string, posts.value.length);

        if (response && response.posts && response.posts.data && response.posts.data.length > 0) {
            posts.value = [...posts.value, ...response.posts.data];
            hasMorePosts.value = posts.value.length < (response.posts.count || 0);
        } else {
            hasMorePosts.value = false;
        }
    } catch (err) {
        console.error('Failed to load more posts:', err);
    } finally {
        loadingMore.value = false;
    }
};

const setupIntersectionObserver = () => {
    observer.value = new IntersectionObserver(
        (entries) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasMorePosts.value && !loadingMore.value) {
                loadMorePosts();
            }
        },
        { threshold: 0.1 }
    );

    if (observerTarget.value) {
        observer.value.observe(observerTarget.value);
    }
};

onMounted(async () => {
    loading.value = false;
    setupIntersectionObserver();
});

onUnmounted(() => {
    if (observer.value && observerTarget.value) {
        observer.value.unobserve(observerTarget.value);
        observer.value.disconnect();
    }
});
</script>
