<template>
    <div class="w-full relative bg-neutral-100">
        <div class="lg:max-w-4xl md:max-w-3xl mx-auto">
            <div v-if="!tag && !loading" class="bg-white rounded-lg p-6">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-neutral-800 mb-4">Tag não encontrada</h1>
                    <p class="text-neutral-600">A tag que você está procurando não existe ou está indisponível.</p>
                </div>
            </div>

            <div v-else-if="tag" class="bg-white rounded-lg p-6 article-container overflow-hidden">
                <header class="border-b border-neutral-200 pb-4 mb-6 pr-4 pt-4">
                    <h1 class="text-3xl font-bold text-neutral-900 mb-3">Tag: {{ tag.name }}</h1>
                    <p v-if="tag.description" class="text-neutral-600 mb-4">{{ tag.description }}</p>
                    <div class="text-sm text-neutral-500">{{ totalPosts }} posts com esta tag</div>
                </header>

                <!-- Initial loading state -->
                <div v-if="loading && posts.length === 0" class="flex justify-center items-center py-20">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ed1c24]"></div>
                </div>

                <!-- Posts List -->
                <div v-else-if="posts.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <TagPostCard v-for="post in posts" :key="post.id" :post="post" />
                </div>

                <!-- No posts state -->
                <div v-else-if="!loading && posts.length === 0" class="text-center py-16">
                    <h2 class="text-2xl font-bold mb-2 text-neutral-800">Nenhum post encontrado com esta tag</h2>
                    <p class="text-neutral-600">Volte mais tarde para novos conteúdos!</p>
                </div>

                <!-- Load More Button -->
                <div v-if="hasMorePosts" class="mt-8 text-center">
                    <button
                        @click="loadMorePosts"
                        :disabled="loadingMore"
                        class="bg-[#ed1c24] text-white font-bold py-3 px-8 rounded-lg hover:bg-[#c4131a] transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <span v-if="loadingMore">Carregando...</span>
                        <span v-else>Carregar Mais</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';
import { vue3 } from '@cmmv/blog/client';
import { useSettingsStore } from '../../store/settings';
import TagPostCard from '../components/TagPostCard.vue';

const settingsStore = useSettingsStore();
const blogAPI = vue3.useBlog();
const route = useRoute();

const tag = ref<any>(null);
const posts = ref<any[]>([]);
const totalPosts = ref(0);
const settings = ref<any>(settingsStore.getSettings);
const loading = ref(true);
const loadingMore = ref(false);
const hasMorePosts = ref(false);

const pageUrl = computed(() => {
    // @ts-ignore
    return `${import.meta.env.VITE_WEBSITE_URL}/tag/${tag.value?.slug || ''}`
})

const headData = computed(() => {
    if (!tag.value) return {};
    return {
        title: tag.value.name + ' - ' + settings.value['blog.title'],
        meta: [
            { name: 'description', content: tag.value.description || settings.value['blog.description'] },
            { name: 'keywords', content: settings.value['blog.keywords'] },
            { property: 'og:type', content: 'website' },
            { property: 'og:title', content: tag.value.name + ' - ' + settings.value['blog.title'] },
            { property: 'og:description', content: tag.value.description || settings.value['blog.description'] },
            { property: 'og:image', content: settings.value['blog.logo'] },
            { property: 'og:url', content: pageUrl.value }
        ],
        link: [
            { rel: 'canonical', href: pageUrl.value }
        ]
    }
});

useHead(headData);

const loadMorePosts = async () => {
    if (loadingMore.value || !hasMorePosts.value || loading.value) return;

    try {
        loadingMore.value = true;
        const response = await blogAPI.tags.getPostsBySlug(
            route.params.slug as string,
            posts.value.length
        );

        if (response && response.posts && response.posts.data && response.posts.data.length > 0) {
            posts.value = [...posts.value, ...response.posts.data];
            hasMorePosts.value = posts.value.length < totalPosts.value;
        } else {
            hasMorePosts.value = false;
        }
    } catch (err) {
        console.error('Failed to load more posts:', err);
    } finally {
        loadingMore.value = false;
    }
};

onMounted(async () => {
    loading.value = true;
    try {
        const response = await blogAPI.tags.getPostsBySlug(route.params.slug as string, 0);
        if (response) {
            tag.value = response.tag;
            posts.value = response.posts?.data || [];
            totalPosts.value = response.posts?.count || 0;
            hasMorePosts.value = posts.value.length < totalPosts.value;
        }
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
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
