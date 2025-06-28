<template>
    <section v-if="posts.length > 0" class="mb-8 md:block hidden">
        <!-- Full Layout (default) -->
        <div v-if="coverSettings.layoutType === 'full' || !coverSettings.layoutType" class="bg-white rounded-lg overflow-hidden shadow-md">
            <a v-if="coverPosts.full" :href="`/post/${coverPosts.full.slug}`" class="block">
                <div class="relative h-[400px]">
                    <OptimizedImage
                        :src="coverPosts.full?.featureImage"
                        :alt="coverPosts.full?.title"
                        :title="coverPosts.full?.title"
                        aria-label="Cover Image"
                        width="890"
                        height="606"
                        priority="high"
                        icon-size="lg"
                    />
                    <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                        <div v-if="coverPosts.full && coverPosts.full.categories && coverPosts.full.categories.length > 0" class="mb-2">
                            <span class="bg-[#ed1c24] text-white px-3 py-1 rounded-md text-sm font-medium">
                                {{ coverPosts.full.categories[0].name }}
                            </span>
                        </div>
                        <h2 v-if="coverPosts.full" class="text-2xl md:text-3xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ coverPosts.full.title }}</h2>
                        <p v-if="coverPosts.full" class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                            {{ coverPosts.full.excerpt || stripHtml(coverPosts.full.content).substring(0, 150) + '...' }}
                        </p>
                        <span class="inline-block bg-[#ed1c24] hover:bg-[#c5131a] text-white px-4 py-2 rounded-md transition-colors">
                            Continuar lendo
                        </span>
                    </div>
                </div>
            </a>
        </div>

        <!-- Carousel Layout -->
        <div v-else-if="coverSettings.layoutType === 'carousel'" class="bg-white rounded-lg overflow-hidden shadow-md">
            <div class="relative h-[400px]">
                <div v-for="(post, index) in coverPosts.carousel" :key="post.id"
                     class="absolute w-full h-full transition-opacity duration-500 ease-in-out"
                     :class="{ 'opacity-100': currentCarouselIndex === index, 'opacity-0': currentCarouselIndex !== index }">
                    <a :href="`/post/${post.slug}`" class="block h-full">
                        <OptimizedImage
                            :src="post.featureImage"
                            :alt="post.title"
                            :title="post.title"
                            aria-label="Cover Image"
                            width="890"
                            height="606"
                            priority="high"
                            icon-size="lg"
                        />
                        <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                            <div v-if="post.categories && post.categories.length > 0" class="mb-2">
                                <span class="bg-[#ed1c24] text-white px-3 py-1 rounded-md text-sm font-medium">
                                    {{ post.categories[0].name }}
                                </span>
                            </div>
                            <h2 class="text-2xl md:text-3xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ post.title }}</h2>
                            <p class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                                {{ post.excerpt || stripHtml(post.content).substring(0, 150) + '...' }}
                            </p>
                            <span class="inline-block bg-[#ed1c24] hover:bg-[#c5131a] text-white px-4 py-2 rounded-md transition-colors">
                                Continuar lendo
                            </span>
                        </div>
                    </a>
                </div>

                <!-- Carousel Controls -->
                <div class="absolute top-0 bottom-0 left-0 flex items-center">
                    <button @click="prevCarouselSlide" class="bg-black/30 hover:bg-black/50 text-white p-2 rounded-r-md focus:outline-none z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>
                <div class="absolute top-0 bottom-0 right-0 flex items-center">
                    <button @click="nextCarouselSlide" class="bg-black/30 hover:bg-black/50 text-white p-2 rounded-l-md focus:outline-none z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <!-- Carousel Indicators -->
                <div class="absolute bottom-3 left-0 right-0 flex justify-center space-x-2 z-10">
                    <button
                        v-for="(_, index) in coverPosts.carousel"
                        :key="index"
                        @click="currentCarouselIndex = index"
                        class="w-3 h-3 rounded-full bg-white/50 focus:outline-none"
                        :class="{ 'bg-white': currentCarouselIndex === index }"
                    ></button>
                </div>
            </div>
        </div>

        <!-- Split Layout (1 large, 2 small) -->
        <div v-else-if="coverSettings.layoutType === 'split'" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="md:col-span-2 bg-white rounded-lg overflow-hidden shadow-md">
                <a v-if="coverPosts.splitMain" :href="`/post/${coverPosts.splitMain.slug}`" class="block h-full">
                    <div class="relative h-full">
                        <OptimizedImage
                            :src="coverPosts.splitMain?.featureImage"
                            :alt="coverPosts.splitMain?.title"
                            :title="coverPosts.splitMain?.title"
                            aria-label="Cover Image"
                            width="890"
                            height="606"
                            priority="high"
                            icon-size="lg"
                        />
                        <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                            <div v-if="coverPosts.splitMain && coverPosts.splitMain.categories && coverPosts.splitMain.categories.length > 0" class="mb-2">
                                <span class="bg-[#ed1c24] text-white px-3 py-1 rounded-md text-sm font-medium">
                                    {{ coverPosts.splitMain.categories[0].name }}
                                </span>
                            </div>
                            <h2 v-if="coverPosts.splitMain" class="text-xl md:text-2xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ coverPosts.splitMain.title }}</h2>
                            <p v-if="coverPosts.splitMain" class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                                {{ coverPosts.splitMain.excerpt || stripHtml(coverPosts.splitMain.content).substring(0, 150) + '...' }}
                            </p>
                            <span class="inline-block bg-[#ed1c24] hover:bg-[#c5131a] text-white px-4 py-2 rounded-md transition-colors">
                                Continuar lendo
                            </span>
                        </div>
                    </div>
                </a>
            </div>
            <div class="md:col-span-1 flex flex-col gap-4">
                <div v-for="(post, index) in coverPosts.splitSide" :key="post.id" class="flex-1 bg-white rounded-lg overflow-hidden shadow-md">
                    <a :href="`/post/${post.slug}`" class="block h-full">
                        <div class="relative h-full">
                            <OptimizedImage
                                :src="post.featureImage"
                                :alt="post.title"
                                loading="lazy"
                                icon-size="md"
                            />
                            <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                <div v-if="post.categories && post.categories.length > 0" class="mb-2">
                                    <span class="bg-[#ed1c24] text-white px-2 py-1 rounded-md text-xs font-medium">
                                        {{ post.categories[0].name }}
                                    </span>
                                </div>
                                <h3 class="text-base font-bold mb-2 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ post.title }}</h3>
                                <span class="text-sm text-white hover:text-[#ed1c24] transition-colors drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 px-2 py-1 rounded inline-block">
                                    Continuar lendo &rarr;
                                </span>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        </div>

        <!-- Dual Layout (2 equal columns) -->
        <div v-else-if="coverSettings.layoutType === 'dual'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="post in coverPosts.dual" :key="post.id" class="bg-white rounded-lg overflow-hidden shadow-md">
                <a :href="`/post/${post.slug}`" class="block">
                    <div class="relative h-[350px]">
                        <OptimizedImage
                            :src="post.featureImage"
                            :alt="post.title"
                            :title="post.title"
                            aria-label="Cover Image"
                            width="890"
                            height="606"
                            priority="high"
                            icon-size="lg"
                        />
                        <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                            <div v-if="post.categories && post.categories.length > 0" class="mb-2">
                                <span class="bg-[#ed1c24] text-white px-3 py-1 rounded-md text-sm font-medium">
                                    {{ post.categories[0].name }}
                                </span>
                            </div>
                            <h2 class="text-xl md:text-2xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ post.title }}</h2>
                            <p class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                                {{ post.excerpt || stripHtml(post.content).substring(0, 120) + '...' }}
                            </p>
                            <span class="inline-block bg-[#ed1c24] hover:bg-[#c5131a] text-white px-4 py-2 rounded-md transition-colors">
                                Continuar lendo
                            </span>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { stripHtml } from '../../composables/useUtils';
import OptimizedImage from '../../components/OptimizedImage.vue';

const props = defineProps({
    posts: {
        type: Array,
        required: true,
        default: () => []
    },
    settings: {
        type: Object,
        required: true,
        default: () => ({})
    }
});

const currentCarouselIndex = ref(0);
const carouselInterval = ref<number | null>(null);

const coverSettings = computed(() => {
    try {
        const config = props.settings.cover;
        return config ? JSON.parse(config) : { layoutType: 'full' };
    } catch (err) {
        console.error('Error parsing cover settings:', err);
        return { layoutType: 'full' };
    }
});

const hasCoverConfig = computed(() => {
    return !!props.settings.cover && Object.keys(coverSettings.value).length > 0;
});

const coverPosts = computed(() => {
    if (!props.posts.length) return {};

    const result: any = {
        full: props.posts[0],
        carousel: props.posts.slice(0, 3),
        splitMain: props.posts[0],
        splitSide: props.posts.slice(1, 3),
        dual: props.posts.slice(0, 2)
    };

    if (hasCoverConfig.value) {
        const config = coverSettings.value;
        const shouldRespectSelectedPosts = config.respectSelectedPosts !== false;

        if (shouldRespectSelectedPosts) {
            if (config.layoutType === 'full' && config.fullCover?.postId) {
                const configPost = props.posts.find((p:any) => p.id === config.fullCover.postId);
                if (configPost) result.full = configPost;
            }

            if (config.layoutType === 'carousel' && Array.isArray(config.carousel)) {
                const carouselPostIds = config.carousel
                    .filter((item:any) => item && item.postId)
                    .map((item:any) => item.postId);

                if (carouselPostIds.length) {
                    const configPosts = carouselPostIds
                        .map((id: string) => props.posts.find((p:any) => p.id === id))
                        .filter(Boolean);

                    if (configPosts.length) result.carousel = configPosts;
                }
            }

            if (config.layoutType === 'split') {
                if (config.split?.main?.postId) {
                    const mainPost = props.posts.find((p:any) => p.id === config.split.main.postId);
                    if (mainPost) result.splitMain = mainPost;
                }

                if (Array.isArray(config.split?.secondary)) {
                    const secondaryPostIds = config.split.secondary
                        .filter((item:any) => item && item.postId)
                        .map((item:any) => item.postId);

                    if (secondaryPostIds.length) {
                        const secondaryPosts = secondaryPostIds
                            .map((id: string) => props.posts.find((p:any) => p.id === id))
                            .filter(Boolean);

                        if (secondaryPosts.length) result.splitSide = secondaryPosts;
                    }
                }
            }

            if (config.layoutType === 'dual' && Array.isArray(config.dual)) {
                const dualPostIds = config.dual
                    .filter((item:any) => item && item.postId)
                    .map((item:any) => item.postId);

                if (dualPostIds.length) {
                    const configPosts = dualPostIds
                        .map((id: string) => props.posts.find((p:any) => p.id === id))
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

onMounted(() => {
    startCarouselInterval();
});

onUnmounted(() => {
    stopCarouselInterval();
});

watch(() => props.settings, () => {
    stopCarouselInterval();
    startCarouselInterval();
}, { deep: true });
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
