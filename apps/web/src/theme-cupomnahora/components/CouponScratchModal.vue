<template>
    <div v-if="visible" class="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out" :class="visible ? 'opacity-100' : 'opacity-0 pointer-events-none'">
        <div class="bg-white rounded-lg shadow-xl p-6 md:p-8 w-full max-w-md relative transform transition-all duration-300 ease-in-out" :class="visible ? 'scale-100' : 'scale-95'">
            <button @click="closeModal" class="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors z-30">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div v-if="coupon" class="text-center">
                <div class="w-24 h-24 mx-auto mb-4 flex items-center justify-center border border-gray-200 rounded-md p-2">
                    <img v-if="coupon && coupon.campaignLogo"
                         :src="coupon.campaignLogo"
                         :alt="coupon.campaignName || 'Logo da loja'"
                         class="max-w-full max-h-full object-contain"
                         @error="handleImageError"
                         ref="logoImg">
                    <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center rounded-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                </div>
                <h2 class="text-xl font-semibold text-gray-800 mb-2">{{ coupon.campaignName || 'Loja' }}</h2>
                <p class="text-lg font-bold text-indigo-600 mb-4">{{ coupon.title }}</p>

                <div v-if="coupon.code" class="bg-yellow-300 p-4 rounded-md mb-4">
                    <p class="text-2xl font-bold text-gray-800 tracking-widest">{{ coupon.code }}</p>
                </div>
                <p v-else class="text-gray-600 mb-4">Este cupom não possui código.</p>

                <div class="flex flex-col gap-3">
                    <button
                        v-if="coupon.code"
                        @click="copyCode"
                        class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">
                        {{ copyButtonText }}
                    </button>
                    <!--
                    <button
                        v-if="coupon.deeplink"
                        @click="visitStore"
                        class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 focus:outline-none">
                        Ir para a loja
                    </button>
                    -->
                    <button
                        @click="closeModal"
                        class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-300 focus:outline-none mt-2">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
    visible: Boolean,
    coupon: Object as () => any | null
});

const emit = defineEmits(['close']);
const copyButtonText = ref('Copiar Código');
const router = useRouter();
const logoImg = ref<HTMLImageElement | null>(null);

const closeModal = () => {
    emit('close');

    // Se o modal foi aberto via parâmetro URL, remover o parâmetro ao fechar
    if (router.currentRoute.value.query.display) {
        router.replace({
            query: { ...router.currentRoute.value.query, display: undefined }
        });
    }
};

const copyCode = async () => {
    if (!props.coupon || !props.coupon.code) return;
    try {
        await navigator.clipboard.writeText(props.coupon.code);
        copyButtonText.value = 'Copiado!';
        setTimeout(() => {
            copyButtonText.value = 'Copiar Código';
        }, 2000);
    } catch (err) {
        copyButtonText.value = 'Falhou!';
        setTimeout(() => {
            copyButtonText.value = 'Copiar Código';
        }, 2000);
    }
};

const visitStore = () => {
    if (props.coupon && props.coupon.deeplink) {
        window.open(props.coupon.deeplink, '_blank');
    }
};

const handleImageError = (event: Event) => {
    if (props.coupon) {
        props.coupon.campaignLogo = null;
    }
};

watch(() => props.visible, (isVisible) => {
    if (isVisible && props.coupon) {
    }
});

onMounted(() => {
    if (props.visible && props.coupon) {
    }
});
</script>

<style scoped>
</style>