<template>
    <div class="w-full max-w-[1200px] mx-auto px-4">
        <div v-if="error" class="text-center py-16 bg-white rounded-lg shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="text-2xl font-bold mb-2 text-gray-800">Erro ao carregar posts</h2>
            <p class="text-gray-600 mb-4">Não foi possível carregar os posts. Por favor, tente novamente.</p>
            <button @click="loadPosts" class="px-4 py-2 bg-[#ed1c24] text-white rounded-md hover:bg-[#c5131a] transition-colors">
                Tentar novamente
            </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="posts.length === 0" class="text-center py-16 bg-white rounded-lg shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="text-2xl font-bold mb-2 text-gray-800">Nenhum post encontrado</h2>
            <p class="text-gray-600">Volte mais tarde para novos conteúdos!</p>
        </div>

        <div v-else>
            <!-- Cover Section -->
            <CoverSection :posts="posts" :settings="settings" />

            <!-- Top AdSense Banner -->
            <div v-if="adSettings.enableAds && adSettings.homePageHeader" class="w-full bg-gray-100 rounded-lg mb-8 overflow-hidden flex justify-center">
                <div class="ad-container ad-banner-top py-2 px-4" v-if="getAdHtml('header')">
                    <div v-html="getAdHtml('header')"></div>
                </div>
                <div class="ad-container ad-banner-top py-2 px-4" v-else>
                    <div class="ad-placeholder h-[90px] w-full max-w-[728px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                        <span>Anúncio</span>
                    </div>
                </div>
            </div>

            <!-- Main Content Layout -->
            <div class="flex flex-col lg:flex-row gap-8">
                <div class="flex-grow">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div class="lg:col-span-2">
                            <!-- Seção Estática de Últimas Notícias -->
                            <div class="flex flex-wrap items-center justify-between mb-6 border-b-2 border-gray-200 pb-2">
                                <h2 class="text-xl font-bold text-[#ed1c24]">
                                    Últimas Notícias
                                </h2>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 mb-8">
                                <PostCard v-for="post in latestPostsToDisplay" :key="post.id" :post="post" />
                            </div>

                           

                            <!-- Conteúdo Filtrado ou Seções de Categoria -->
                            <div v-if="selectedCategory">
                                <PostFeed
                                    :selected-category="selectedCategory"
                                    :posts="posts"
                                    :ad-settings="adSettings"
                                    :get-ad-html="getAdHtml"
                                />
                            </div>
                            <div v-else>
                                <CategorySection v-if="reviewPosts.length > 0" title="Análises em Destaque" :posts="reviewPosts" />
                                <template v-for="category in mainNavRootCategories" :key="category.id">
                                    <CategorySection
                                        v-if="postsByMainCategory[category.id] && postsByMainCategory[category.id].length > 0"
                                        :title="category.name"
                                        :posts="postsByMainCategory[category.id]"
                                        :category-slug="category.slug"
                                        class="mt-8"
                                    />
                                </template>
                            </div>

                            <div v-if="adSettings.enableAds && adSettings.homePageAfterPosts" class="w-full bg-gray-100 rounded-lg mt-8 mb-4 overflow-hidden flex justify-center">
                                <div class="ad-container ad-banner-bottom py-2 px-4" v-if="getAdHtml('belowContent')">
                                    <div v-html="getAdHtml('belowContent')"></div>
                                </div>
                                <div class="ad-container ad-banner-bottom py-2 px-4" v-else>
                                    <div class="ad-placeholder h-[90px] w-full max-w-[728px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                        <span>Anúncio</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="loadingMore" class="mt-8 flex justify-center items-center py-6">
                                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ed1c24]"></div>
                                <span class="ml-3 text-gray-600">Carregando mais posts...</span>
                            </div>

                            <div ref="observerTarget" class="h-4 w-full"></div>
                        </div>

                        <!-- Right Column (Widgets + Ads) -->
                        <div class="lg:col-span-1 min-w-[300px]">
                            <!-- AdSense Rectangle (Top) -->
                            <div v-if="adSettings.enableAds && adSettings.homePageSidebarTop" class="bg-gray-100 rounded-lg p-2 mb-6 flex justify-center h-[400px]">
                                <div class="ad-container ad-sidebar-top" v-if="getAdHtml('sidebarTop')">
                                    <div v-html="getAdHtml('sidebarTop')"></div>
                                </div>
                                <div class="ad-container ad-sidebar-top" v-else>
                                    <div class="ad-placeholder h-[250px] w-[300px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                        <span>Anúncio</span>
                                    </div>
                                </div>
                            </div>

                            <!-- <CategoryWidget :categories="categories" /> -->

                            <!-- AdSense Rectangle (Middle) -->
                            <div class="bg-gray-100 rounded-lg p-2 mb-6 flex justify-center h-[400px]">
                                <div class="ad-container ad-sidebar-mid" v-if="getAdHtml('sidebarMid')">
                                    <div v-html="getAdHtml('sidebarMid')"></div>
                                </div>
                                <div class="ad-container ad-sidebar-mid" v-else>
                                    <div class="ad-placeholder h-[250px] w-[300px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                        <span>Anúncio</span>
                                    </div>
                                </div>
                            </div>

                            <!-- AdSense Rectangle (Bottom) -->
                            <div v-if="adSettings.enableAds && adSettings.homePageSidebarBottom" class="bg-gray-100 rounded-lg p-2 mb-6 flex justify-center h-[400px]">
                                <div class="ad-container ad-sidebar-bottom" v-if="getAdHtml('sidebarBottom')">
                                    <div v-html="getAdHtml('sidebarBottom')"></div>
                                </div>
                                <div class="ad-container ad-sidebar-bottom" v-else>
                                    <div class="ad-placeholder h-[250px] w-[300px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                        <span>Anúncio</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    ref, computed, onMounted,
    onUnmounted, watch, nextTick, provide
} from 'vue';
import { useHead } from '@unhead/vue';
import { vue3 } from '@cmmv/blog/client';
import { useSettingsStore } from '../../store/settings';
import { useCategoriesStore } from '../../store/categories';
import { usePostsStore } from '../../store/posts';
import { useMostAccessedPostsStore } from '../../store/mostaccessed';
import { formatDate, stripHtml } from '../../composables/useUtils';
import { useAds } from '../../composables/useAds';
import PostCard from '../components/PostCard.vue';
import CategoryWidget from '../components/CategoryWidget.vue';
import PopularPostCard from '../components/PopularPostCard.vue';
import CoverSection from '../components/CoverSection.vue';
import CategorySection from '../components/CategorySection.vue';
import PostFeed from '../components/PostFeed.vue';

declare global {
    interface Window {
        adsbygoogle: any[];
        workbox: any;
        imgix: any;
    }
}

const settingsStore = useSettingsStore();
const categoriesStore = useCategoriesStore();
const postsStore = usePostsStore();
const mostAccessedStore = useMostAccessedPostsStore();
const blogAPI = vue3.useBlog();

const rawSettings = computed(() => settingsStore.getSettings);
const settings = computed<Record<string, any>>(() => {
    const settingsObj = rawSettings.value || {};
    const blogSettings: Record<string, any> = {};
    Object.keys(settingsObj).forEach(key => {
        if (key.startsWith('blog.')) {
            const shortKey = key.replace('blog.', '');
            blogSettings[shortKey] = settingsObj[key];
        }
    });
    return blogSettings;
});
const categories = ref<any[]>(categoriesStore.getCategories || []);
const posts = ref<any[]>(postsStore.getPosts || []);
const popularPosts = ref<any[]>(mostAccessedStore.getMostAccessedPosts || []);
const reviewPosts = ref<any[]>([]);
const postsByMainCategory = ref<Record<string, any[]>>({});
const loading = ref(true);
const loadingMore = ref(false);
const error = ref(null);
const currentPage = ref(0);
const hasMorePosts = ref(true);
const observerTarget = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);
const currentCarouselIndex = ref(0);
const carouselInterval = ref<number | null>(null);
const sidebarLeftAdContainer = ref<HTMLElement | null>(null);
const hydrated = ref(false);

const selectedCategory = ref<string | null>(null);

const mainNavCategories = computed(() => {
    const navCategories = categories.value?.filter((category: any) => category.mainNav) || [];
    navCategories.sort((a: any, b: any) => (a.mainNavIndex ?? 999) - (b.mainNavIndex ?? 999));

    const rootCategories = navCategories.filter((cat: any) => !cat.parentCategory);

    return {
        rootCategories,
    };
});

const allRootCategoriesWithPosts = computed(() => {
    return categories.value?.filter((cat: any) => !cat.parentCategory && cat.postCount > 0) || [];
});

const selectedCategoryName = computed(() => {
    if (!selectedCategory.value) return '';
    const category = categories.value.find(cat => cat.id === selectedCategory.value);
    return category ? category.name : '';
});

const latestPostsToDisplay = computed(() => {
    return posts.value.slice(0, 4);
});

const mainNavRootCategories = computed(() => {
    const navCategories = categories.value?.filter((category: any) => category.mainNav) || [];
    navCategories.sort((a: any, b: any) => (a.mainNavIndex ?? 999) - (b.mainNavIndex ?? 999));

    const reviewCategoryNames = ['review', 'reviews', 'análise', 'análises'];
    // Filtra para não incluir a categoria de review que já tem uma seção dedicada
    return navCategories.filter((cat: any) =>
        !cat.parentCategory && !reviewCategoryNames.includes(cat.name.trim().toLowerCase())
    );
});

const adPluginSettings = computed(() => {
    return settings.value || {};
});

const {
    adSettings, getAdHtml,
    loadAdScripts, loadSidebarLeftAd
} = useAds(adPluginSettings.value, 'home');

const coverSettings = computed(() => {
    try {
        const config = settings.value.cover;
        return config ? JSON.parse(config) : { layoutType: 'full' };
    } catch (err) {
        console.error('Error parsing cover settings:', err);
        return { layoutType: 'full' };
    }
});

const hasCoverConfig = computed(() => {
    return !!settings.value.cover && Object.keys(coverSettings.value).length > 0;
});

const coverPosts = computed(() => {
    if (!posts.value.length) return {};

    const result: any = {
        full: posts.value[0],
        carousel: posts.value.slice(0, 3),
        splitMain: posts.value[0],
        splitSide: posts.value.slice(1, 3),
        dual: posts.value.slice(0, 2)
    };

    if (hasCoverConfig.value) {
        const config = coverSettings.value;
        const shouldRespectSelectedPosts = config.respectSelectedPosts !== false;

        if (shouldRespectSelectedPosts) {
            if (config.layoutType === 'full' && config.fullCover?.postId) {
                const configPost = posts.value.find(p => p.id === config.fullCover.postId);
                if (configPost) result.full = configPost;
            }

            if (config.layoutType === 'carousel' && Array.isArray(config.carousel)) {
                const carouselPostIds = config.carousel
                    .filter(item => item && item.postId)
                    .map(item => item.postId);

                if (carouselPostIds.length) {
                    const configPosts = carouselPostIds
                        .map((id: string) => posts.value.find(p => p.id === id))
                        .filter(Boolean);

                    if (configPosts.length) result.carousel = configPosts;
                }
            }

            if (config.layoutType === 'split') {
                // Main post
                if (config.split?.main?.postId) {
                    const mainPost = posts.value.find(p => p.id === config.split.main.postId);
                    if (mainPost) result.splitMain = mainPost;
                }

                if (Array.isArray(config.split?.secondary)) {
                    const secondaryPostIds = config.split.secondary
                        .filter(item => item && item.postId)
                        .map(item => item.postId);

                    if (secondaryPostIds.length) {
                        const secondaryPosts = secondaryPostIds
                            .map((id: string) => posts.value.find(p => p.id === id))
                            .filter(Boolean);

                        if (secondaryPosts.length) result.splitSide = secondaryPosts;
                    }
                }
            }

            if (config.layoutType === 'dual' && Array.isArray(config.dual)) {
                const dualPostIds = config.dual
                    .filter(item => item && item.postId)
                    .map(item => item.postId);

                if (dualPostIds.length) {
                    const configPosts = dualPostIds
                        .map((id: string) => posts.value.find(p => p.id === id))
                        .filter(Boolean);

                    if (configPosts.length) result.dual = configPosts;
                }
            }
        }
    }

    return result;
});

const startCarouselInterval = () => {
    if (coverSettings.value.layoutType === 'carousel' && coverPosts.value.carousel?.length > 1) {
        carouselInterval.value = window.setInterval(() => {
            nextCarouselSlide();
        }, 5000);
    }
};

const stopCarouselInterval = () => {
    if (carouselInterval.value) {
        clearInterval(carouselInterval.value);
        carouselInterval.value = null;
    }
};

const nextCarouselSlide = () => {
    stopCarouselInterval();
    if (coverPosts.value.carousel?.length) {
        currentCarouselIndex.value = (currentCarouselIndex.value + 1) % coverPosts.value.carousel.length;
    }
    startCarouselInterval();
};

const prevCarouselSlide = () => {
    stopCarouselInterval();
    if (coverPosts.value.carousel?.length) {
        currentCarouselIndex.value = (currentCarouselIndex.value - 1 + coverPosts.value.carousel.length) % coverPosts.value.carousel.length;
    }
    startCarouselInterval();
};

const headData = ref({
    title: settings.value.title,
    meta: [
        { name: 'description', content: settings.value.description },
        { name: 'keywords', content: settings.value.keywords },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: settings.value.title },
        { property: 'og:description', content: settings.value.description },
        { property: 'og:image', content: settings.value.logo }
    ],
    link: [
        { rel: 'canonical', href: settings.value.url },
        { rel: 'alternate', href: `${settings.value.url}/feed`, type: 'application/rss+xml', title: settings.value.title }
    ]
});

useHead(headData);

const pagination = ref({
    total: 0,
    limit: 12,
    offset: 0
});

const featuredPost = computed(() => {
    return posts.value.length > 0 ? posts.value[0] : null;
});

const loadPostsForMainCategories = async () => {
    if (mainNavRootCategories.value.length === 0) return;

    try {
        const categoryPromises = mainNavRootCategories.value.map(category => {
            const filters: any = { category: category.id, limit: 4 };
            return blogAPI.posts.getAll(filters)
                .then(response => ({
                    categoryId: category.id,
                    posts: (response.posts || []).slice(0, 4)
                }));
        });

        const results = await Promise.all(categoryPromises);

        const newPostsByCat: Record<string, any[]> = {};
        results.forEach(result => {
            if (result.posts.length > 0) {
                newPostsByCat[result.categoryId] = result.posts;
            }
        });
        postsByMainCategory.value = newPostsByCat;

    } catch (err) {
        console.error('Failed to load posts for main categories:', err);
    }
};

const loadReviewPosts = async () => {
    try {
        const reviewCategoryNames = ['review', 'reviews', 'análise', 'análises'];
    const reviewCategory = categories.value.find(cat =>
            reviewCategoryNames.includes(cat.name.trim().toLowerCase())
        );

    if (reviewCategory) {
            const filters: any = {
                category: reviewCategory.id,
                limit: 2
            };
            const response: any = await blogAPI.posts.getAll(filters);
            if (response && response.posts) {
                reviewPosts.value = response.posts;
                console.log(`[Debug] Posts for category "${reviewCategory.name}" loaded:`, response.posts);
            }
    } else {
             console.log('[Debug] Categoria de Análise não encontrada, a seção não será exibida.');
        }
    } catch (err) {
        console.error('Failed to load review posts:', err);
    }
};

const loadPosts = async () => {
    try {
        loading.value = true;
        error.value = null;

        const response: any = await blogAPI.posts.getAll({ offset: currentPage.value * pagination.value.limit });

        if (response) {
            posts.value = response.posts;

            pagination.value = {
                total: response.meta?.pagination?.total || 0,
                limit: response.meta?.pagination?.limit || 12,
                offset: response.meta?.pagination?.offset || 0
            };

            hasMorePosts.value = posts.value.length < response.count;
        }
    } catch (err: any) {
        console.error('Failed to load posts:', err);
        error.value = err;
    } finally {
        loading.value = false;
    }
};

const loadMorePosts = async () => {
    if (loadingMore.value || !hasMorePosts.value) return;

    try {
        loadingMore.value = true;
        currentPage.value++;

        const filters: any = { offset: posts.value.length };
        if (selectedCategory.value) {
            filters.category = selectedCategory.value;
        }

        const response: any = await blogAPI.posts.getAll(filters);

        if (response && response.posts && response.posts.length > 0) {
            const existingIds = new Set(posts.value.map(p => p.id));
            const newPosts = response.posts.filter((post: any) => !existingIds.has(post.id));

            if (newPosts.length > 0) {
                posts.value = [...posts.value, ...newPosts];
            }

            pagination.value = {
                total: response.meta?.pagination?.total || 0,
                limit: response.meta?.pagination?.limit || 12,
                offset: response.meta?.pagination?.offset || 0
            };

            hasMorePosts.value = posts.value.length < response.count;
        } else {
            hasMorePosts.value = false;
        }
    } catch (err: any) {
        console.error('Failed to load more posts:', err);
    } finally {
        loadingMore.value = false;
    }
};

const setupIntersectionObserver = () => {
    observer.value = new IntersectionObserver(
        (entries) => {
            const [entry] = entries;

            if (entry.isIntersecting && hasMorePosts.value && !loadingMore.value)
                loadMorePosts();
        },
        { threshold: 0.1 }
    );

    if (observerTarget.value) {
        observer.value.observe(observerTarget.value);
    }
};

const getAuthor = (post: any) => {
    if (!post.authors || !post.authors.length) return null;
    return post.authors.find((author: any) => author.id === post.author);
};

// Provide hydrated state to child components
provide('hydrated', hydrated);

onMounted(async () => {
    loading.value = false;
    hydrated.value = true;
    setupIntersectionObserver();
    startCarouselInterval();
    loadAdScripts();
    loadSidebarLeftAd(sidebarLeftAdContainer.value);
    loadReviewPosts();
    loadPostsForMainCategories();

    await nextTick();
});

onUnmounted(() => {
    if (observer.value && observerTarget.value) {
        observer.value.unobserve(observerTarget.value);
        observer.value.disconnect();
    }

    stopCarouselInterval();
});

watch(selectedCategory, async (newCategory) => {
    loading.value = true;
    error.value = null;
    currentPage.value = 0;

    try {
        const filters: any = { offset: 0 };
        if (newCategory) {
            filters.category = newCategory;
        }

        const response: any = await blogAPI.posts.getAll(filters);

        if (response && response.posts) {
            posts.value = response.posts;
            hasMorePosts.value = posts.value.length < response.count;
        } else {
            posts.value = [];
            hasMorePosts.value = false;
        }
    } catch (err: any) {
        console.error('Failed to load filtered posts:', err);
        error.value = err;
    } finally {
        loading.value = false;
    }
});

watch(() => settings.value['blog.cover'], () => {
    stopCarouselInterval();
    startCarouselInterval();
}, { deep: true });

watch(() => posts.value.length, async () => {
    await nextTick();
});
</script>

<style scoped>
@media (max-width: 1280px) {
    .ad-sidebar-left {
        display: none;
    }
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.ad-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed #ccc;
    border-radius: 4px;
}


</style>


