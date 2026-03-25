<template>
  <div class="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 mb-8 border border-slate-100 dark:border-slate-800">
    <div class="flex items-center justify-between mb-6 pb-2 relative">
        <h2 class="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
            Categorias
        </h2>
        <div class="absolute bottom-0 left-0 w-12 h-1 bg-[#ed1c24] rounded-full"></div>
    </div>
    <div class="max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
        <ul class="space-y-2">
            <li v-for="category in categories" :key="category.id">
                <a :href="`/category/${category.slug}`"
                   class="group flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-[#ed1c24] transition-all duration-300 border border-transparent hover:border-red-400/30 shadow-sm hover:shadow-md hover:-translate-x-1">
                    <span class="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-white transition-colors">
                        {{ category.name }}
                    </span>
                    <span class="bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-white/20 group-hover:text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-inner transition-all">
                        {{ category.postCount }}
                    </span>
                </a>
            </li>
        </ul>
    </div>
  </div>
</template>

<script setup lang="ts">

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