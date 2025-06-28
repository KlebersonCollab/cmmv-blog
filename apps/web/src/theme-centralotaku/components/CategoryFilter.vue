<template>
    <div class="flex flex-wrap gap-2 mb-6">
        <button @click="selectCategory(null)" :class="[
            'px-4 py-2 text-sm font-medium rounded-full transition-colors',
            !modelValue ? 'bg-[#ed1c24] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]">
            Todas
        </button>
        <button v-for="category in categories" :key="category.id" @click="selectCategory(category.id)" :class="[
            'px-4 py-2 text-sm font-medium rounded-full transition-colors',
            modelValue === category.id ? 'bg-[#ed1c24] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]">
            {{ category.name }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    categories: {
        type: Array as () => any[],
        required: true,
    },
    modelValue: {
        type: String as () => string | null,
        required: false,
        default: null,
    },
});

const emit = defineEmits(['update:modelValue']);

const selectCategory = (categoryId: string | null) => {
    emit('update:modelValue', categoryId);
};
</script> 