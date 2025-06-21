<template>
  <div class="bg-white rounded-lg shadow-md p-5 mb-6">
    <h2 class="text-xl font-bold mb-4 pb-2 text-[#ed1c24] border-b-2 border-gray-200">
      Categorias
    </h2>
    <div class="max-h-[400px] overflow-y-auto pr-2">
        <ul class="space-y-2">
            <li v-for="category in categories" :key="category.id">
                <a :href="`/category/${category.slug}`"
                   class="group flex justify-between items-center p-3 bg-gray-100 rounded-lg hover:bg-[#ed1c24] hover:text-white transition-colors duration-200 ease-in-out">
                    <span class="font-medium text-gray-800 group-hover:text-white">
                        {{ category.name }}
                    </span>
                    <span class="bg-gray-200 text-gray-600 group-hover:bg-white/20 group-hover:text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                        {{ category.postCount }}
                    </span>
                </a>
            </li>
        </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps({
  categories: {
    type: Array as () => any[],
    required: true,
    default: () => []
  }
});
</script>

<style scoped>
/* Custom scrollbar for webkit browsers */
.overflow-y-auto::-webkit-scrollbar {
  width: 5px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style> 