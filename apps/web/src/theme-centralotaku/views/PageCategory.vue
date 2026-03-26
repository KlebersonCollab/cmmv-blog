<template>
    <div class="w-full max-w-[1200px] mx-auto px-4">
        <!-- Top AdSense Banner -->
        <div v-if="adSettings.enableAds && adSettings.categoryPageHeader" class="w-full bg-gray-100 rounded-lg mb-8 mt-8 overflow-hidden flex justify-center">
            <div class="ad-container ad-banner-top py-2 px-4" v-if="getAdHtml('header')">
                <div v-html="getAdHtml('header')"></div>
            </div>
            <div class="ad-container ad-banner-top py-2 px-4" v-else>
                <div class="ad-placeholder h-[90px] w-full max-w-[728px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                    <span>Anúncio</span>
                </div>
            </div>
        </div>

        <div v-if="!category && !loading" class="bg-white rounded-xl p-12 shadow-sm border border-slate-100 my-8">
            <div class="text-center">
                <h1 class="text-2xl font-bold text-slate-800 mb-4">Categoria não encontrada</h1>
                <p class="text-slate-600">A categoria que você está procurando não existe ou está indisponível.</p>
                <router-link to="/" class="mt-6 inline-block px-6 py-2 bg-[#ed1c24] text-white rounded-lg font-bold">Voltar para Home</router-link>
            </div>
        </div>

        <div v-else class="py-8">
            <!-- Layout Principal -->
            <div class="flex flex-col lg:flex-row gap-8">
                <!-- Conteúdo Esquerdo (Posts) -->
                <div class="flex-grow">
                    <header class="flex flex-col mb-10 relative">
                        <h1 class="text-3xl md:text-5xl font-black text-black tracking-tighter uppercase italic">
                            Categoria: <span class="text-[#ed1c24]">{{ category?.name }}</span>
                        </h1>
                        <div class="mt-2 w-full h-1 bg-[#ed1c24] rounded-full opacity-20 relative">
                            <div class="absolute inset-0 w-48 h-full bg-[#ed1c24] rounded-full shadow-[0_0_15px_rgba(237,28,36,0.6)]"></div>
                        </div>
                        <p v-if="category?.description" class="mt-4 text-slate-600 max-w-2xl leading-relaxed">{{ category.description }}</p>
                        <div class="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">{{ totalPosts }} posts publicados</div>
                    </header>

                    <!-- Loading State Principal -->
                    <div v-if="loading && posts.length === 0" class="flex justify-center items-center py-20 bg-white rounded-xl border border-slate-100">
                        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ed1c24]"></div>
                    </div>

                    <!-- Lista de Posts -->
                    <div v-else-if="posts.length > 0">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-10">
                            <PostCard v-for="post in posts" :key="post.id" :post="post" />
                        </div>

                        <!-- Load More Button -->
                        <div v-if="hasMorePosts" class="mt-16 text-center">
                            <button
                                @click="loadMorePosts"
                                :disabled="loadingMore"
                                class="group relative px-10 py-4 bg-[#ed1c24] text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-black transition-all duration-300 shadow-lg hover:shadow-red-500/20 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                                <span v-if="loadingMore" class="flex items-center">
                                    <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Carregando...
                                </span>
                                <span v-else>Carregar Mais Posts</span>
                            </button>
                        </div>
                    </div>

                    <!-- No Posts -->
                    <div v-else-if="!loading" class="text-center py-20 bg-white rounded-xl border border-slate-50 shadow-sm">
                        <div class="text-slate-300 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <h2 class="text-2xl font-bold text-slate-800">Nenhum post disponível</h2>
                        <p class="text-slate-500 mt-2">Ainda não publicamos conteúdos nesta categoria.</p>
                    </div>
                </div>

                <!-- Sidebar Direita -->
                <aside class="w-full lg:w-[320px] flex-shrink-0">
                    <!-- Ad Top Sidebar -->
                    <div v-if="adSettings.enableAds && adSettings.categoryPageSidebarTop" class="bg-gray-100 rounded-lg p-2 mb-8 flex justify-center h-[300px] items-center">
                        <div class="ad-container" v-if="getAdHtml('sidebarTop')">
                            <div v-html="getAdHtml('sidebarTop')"></div>
                        </div>
                        <div class="ad-placeholder h-[250px] w-[300px] bg-gray-200 flex items-center justify-center text-gray-400 text-xs text-center" v-else>
                            <span>Publicidade<br>Sidebar Top</span>
                        </div>
                    </div>

                    <!-- Popular Posts -->
                    <div v-if="popularPosts.length > 0" class="mb-10">
                        <div class="flex items-center mb-6">
                            <h2 class="text-xl font-black text-black uppercase italic tracking-tighter">
                                Mais <span class="text-[#ed1c24]">Lidas</span>
                            </h2>
                            <div class="ml-4 flex-grow h-[2px] bg-slate-100"></div>
                        </div>
                        <div class="flex flex-col gap-4">
                            <PopularPostCard v-for="(p, index) in popularPosts.slice(0, 5)" :key="p.id" :post="p" :index="index + 1" />
                        </div>
                    </div>

                    <!-- Category Widget -->
                    <CategoryWidget :categories="allCategories" />

                    <!-- Ad Middle Sidebar -->
                    <div v-if="adSettings.enableAds && adSettings.categoryPageSidebarMid" class="bg-gray-100 rounded-lg p-2 mt-8 mb-8 flex justify-center h-[400px] items-center">
                        <div class="ad-container" v-if="getAdHtml('sidebarMid')">
                            <div v-html="getAdHtml('sidebarMid')"></div>
                        </div>
                        <div class="ad-placeholder h-[300px] w-[250px] bg-gray-200 flex items-center justify-center text-gray-400 text-xs text-center" v-else>
                            <span>Publicidade</span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onServerPrefetch, inject } from 'vue';
import { useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';
import { vue3 } from '@cmmv/blog/client';
import { useSettingsStore } from '../../store/settings';
import { useCategoriesStore } from '../../store/categories';
import { useMostAccessedPostsStore } from '../../store/mostaccessed';
import { useAds } from '../../composables/useAds';
import PostCard from '../components/PostCard.vue';
import PopularPostCard from '../components/PopularPostCard.vue';
import CategoryWidget from '../components/CategoryWidget.vue';

const settingsStore = useSettingsStore();
const categoriesStore = useCategoriesStore();
const mostAccessedStore = useMostAccessedPostsStore();
const blogAPI = vue3.useBlog();
const route = useRoute();

const category = ref<any>(null);
const posts = ref<any[]>([]);
const totalPosts = ref(0);
const loading = ref(true);
const loadingMore = ref(false);
const hasMorePosts = ref(false);

const allCategories = computed(() => categoriesStore.getCategories || []);
const popularPosts = computed(() => mostAccessedStore.getMostAccessedPosts || []);
const settings = computed(() => settingsStore.getSettings || {});

// Configuração de Anúncios com prefixo 'category'
const { adSettings, getAdHtml, loadAdScripts } = useAds(settings.value, 'category');

const pageUrl = computed(() => {
    return `${import.meta.env.VITE_WEBSITE_URL}/category/${category.value?.slug || ''}`
})

const headData = computed(() => {
    if (!category.value) return {};
    return {
        title: `${category.value.name} - ${settings.value['blog.title'] || 'Central Otaku'}`,
        meta: [
            { name: 'description', content: category.value.description || settings.value['blog.description'] },
            { property: 'og:type', content: 'website' },
            { property: 'og:title', content: `${category.value.name} - ${settings.value['blog.title']}` },
            { property: 'og:image', content: settings.value['blog.logo'] },
            { property: 'og:url', content: pageUrl.value }
        ]
    }
});

useHead(headData);

onServerPrefetch(async () => {
    const slug = route.params.slug as string;
    if (!slug) return;

    try {
        const response = await blogAPI.categories.getBySlug(slug);
        if (response) {
            category.value = response.category;
            posts.value = response.posts?.data || [];
            totalPosts.value = response.posts?.count || 0;
            hasMorePosts.value = posts.value.length < totalPosts.value;

            if (globalThis) {
                if (!globalThis.__SSR_DATA__)
                    globalThis.__SSR_DATA__ = {};

                globalThis.__SSR_DATA__[`category_${slug}`] = response;
            }
        }
    } catch (e) {
        console.error('SSR Error loading category data:', e);
    }
});

const loadCategoryData = async () => {
    const slug = route.params.slug as string;
    if (!slug) return;

    loading.value = true;
    try {
        // Try hydration first
        const preloaded = inject<any>('preloaded', {});
        const preloadedData = preloaded[`category_${slug}`] || (window.__CMMV_DATA__ ? window.__CMMV_DATA__[`category_${slug}`] : null);

        if (preloadedData) {
            category.value = preloadedData.category;
            posts.value = preloadedData.posts?.data || [];
            totalPosts.value = preloadedData.posts?.count || 0;
            hasMorePosts.value = posts.value.length < totalPosts.value;
            loading.value = false;
            return;
        }

        const response = await blogAPI.categories.getBySlug(slug);
        if (response) {
            category.value = response.category;
            posts.value = response.posts?.data || [];
            totalPosts.value = response.posts?.count || 0;
            hasMorePosts.value = posts.value.length < totalPosts.value;
        }
    } catch (e) {
        console.error('Error loading category data:', e);
    } finally {
        loading.value = false;
        loadAdScripts();
    }
};

const loadMorePosts = async () => {
    if (loadingMore.value || !hasMorePosts.value) return;

    try {
        loadingMore.value = true;
        const response = await blogAPI.categories.getBySlug(
            route.params.slug as string,
            posts.value.length
        );

        if (response && response.posts && response.posts.data) {
            const newPosts = response.posts.data;
            posts.value = [...posts.value, ...newPosts];
            hasMorePosts.value = posts.value.length < response.posts.count;
        }
    } catch (err) {
        console.error('Failed to load more posts:', err);
    } finally {
        loadingMore.value = false;
    }
};

onMounted(() => {
    loadCategoryData();
});

// Recarregar dados se o slug mudar (ex: navegar entre categorias)
watch(() => route.params.slug, () => {
    loadCategoryData();
});
</script>

<style scoped>
.ad-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed #ccc;
    border-radius: 8px;
}
</style>