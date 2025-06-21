<template>
    <div class="w-full relative bg-neutral-100">
        <div class="lg:max-w-4xl md:max-w-3xl mx-auto">
            <div v-if="!data.tag" class="bg-white rounded-lg p-6">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-neutral-800 mb-4">Tag não encontrada</h1>
                    <p class="text-neutral-600">A tag que você está procurando não existe ou está indisponível.</p>
                </div>
            </div>

            <div v-else class="bg-white rounded-lg p-6 article-container overflow-hidden">
                <header class="border-b border-neutral-200 pb-4 mb-6 pr-4 pt-4">
                    <h1 class="text-3xl font-bold text-neutral-900 mb-3">Tag: {{ data.tag.name }}</h1>
                    <p v-if="data.tag.description" class="text-neutral-600 mb-4">{{ data.tag.description }}</p>
                    <div class="text-sm text-neutral-500">{{ data.tag.postCount }} posts com esta tag</div>
                </header>

                <!-- Initial loading state -->
                <div v-if="loading && posts.length === 0" class="flex justify-center items-center py-20">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ed1c24]"></div>
                </div>

                <!-- Posts List -->
                <div v-else-if="posts.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <CategoryPostCard v-for="post in posts" :key="post.id" :post="post" />
                </div>

                <!-- No posts state -->
                <div v-else-if="!loading && posts.length === 0" class="text-center py-16">
                    <h2 class="text-2xl font-bold mb-2 text-neutral-800">Nenhum post encontrado com esta tag</h2>
                    <p class="text-neutral-600">Volte mais tarde para novos conteúdos!</p>
                </div>

                <!-- Loading more indicator -->
                <div v-if="loadingMore" class="mt-8 flex justify-center items-center py-6">
                    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ed1c24]"></div>
                </div>

                <!-- Intersection observer target -->
                <div ref="observerTarget" class="h-4 w-full"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';
import { vue3 } from '@cmmv/blog/client';
import OptimizedImage from '../../components/OptimizedImage.vue';
import { useSettingsStore } from '../../store/settings';
import CategoryPostCard from '../components/CategoryPostCard.vue';

import {
    formatDate, stripHtml
} from '../../composables/useUtils';

const settingsStore = useSettingsStore();
const blogAPI = vue3.useBlog();
const route = useRoute();

const data = ref<any>(await blogAPI.tags.getPostsBySlug(route.params.slug as string));
const posts = ref<any[]>(data.value.posts || []);
const settings = ref<any>(settingsStore.getSettings);
const loading = ref(false);
const loadingMore = ref(false);
const hasMorePosts = ref(true);
const currentPage = ref(0);
const observerTarget = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

const pageUrl = computed(() => {
    // @ts-ignore
    return `${import.meta.env.VITE_WEBSITE_URL}/tag/${data.value?.tag?.slug || ''}`
})

const headData = ref({
    title: data.value?.tag?.name + ' - ' + settings.value['blog.title'],
    meta: [
        { name: 'description', content: data.value?.tag?.description },
        { name: 'keywords', content: settings.value['blog.keywords'] },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: data.value?.tag?.name + ' - ' + settings.value['blog.title'] },
        { property: 'og:description', content: data.value?.tag?.description },
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

        const response = await blogAPI.tags.getPostsBySlug(route.params.slug as string, posts.value.length);

        if (response && response.posts && response.posts.length > 0) {
            posts.value = [...posts.value, ...response.posts];
            hasMorePosts.value = posts.value.length < (response.total || 0);
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

<style scoped>
.article-container {
    max-width: 48rem;
    margin: 0 auto;
}

.post-content :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 1rem 0;
}

.post-content :deep(iframe) {
    max-width: 100%;
    border-radius: 4px;
    margin: 1rem 0;
}

.post-content :deep(table) {
    max-width: 100%;
    overflow-x: auto;
    display: block;
    border-collapse: collapse;
    margin: 1rem 0;
}

.post-content :deep(table td),
.post-content :deep(table th) {
    border: 1px solid #e5e5e5;
    padding: 0.5rem;
}

.post-content :deep(pre) {
    max-width: 100%;
    overflow-x: auto;
    background-color: #f5f5f5;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
}

.post-content :deep(code) {
    white-space: pre-wrap;
    word-break: break-word;
    background-color: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-size: 0.9em;
}

.post-content :deep(blockquote) {
    border-left: 4px solid #c5131a;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #666;
}

.post-content :deep(h2),
.post-content :deep(h3),
.post-content :deep(h4),
.post-content :deep(h5),
.post-content :deep(h6) {
    margin-top: 2rem;
    margin-bottom: 1rem;
}

.post-content :deep(p) {
    margin-bottom: 1rem;
    line-height: 1.7;
}

.post-content :deep(ul),
.post-content :deep(ol) {
    margin: 1rem 0;
    padding-left: 2rem;
}

.post-content :deep(li) {
    margin-bottom: 0.5rem;
}

.post-content :deep(a) {
    color: #ed1c24;
    text-decoration: underline;
}

.post-content :deep(a:hover) {
    color: #c5131a;
}
</style>
