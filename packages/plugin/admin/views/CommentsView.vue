<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Comments</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <!-- Add search button with dropdown -->
                <div class="relative">
                    <button @click="toggleSearchDropdown" data-search-toggle
                        class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center relative">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                        <!-- Indicator dot for active search -->
                        <span
                            v-if="filters.search.trim()"
                            class="absolute -top-1 -right-1 h-2.5 w-2.5 bg-blue-500 rounded-full"
                            title="Search filter active">
                        </span>
                    </button>
                    <!-- Search dropdown -->
                    <div v-if="showSearchDropdown" class="absolute right-0 mt-2 w-64 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
                        <div class="p-3 space-y-2">
                            <div class="relative">
                                <input
                                    v-model="filters.search"
                                    type="text"
                                    placeholder="Search comments..."
                                    class="bg-neutral-700 h-9 border border-neutral-600 text-white pl-3 pr-8 py-2 rounded-md w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    @keydown.esc="showSearchDropdown = false"
                                    ref="searchInput"
                                >
                                <!-- Clear button -->
                                <button
                                    v-if="filters.search.trim()"
                                    @click="clearSearch"
                                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white"
                                    title="Clear search">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div>
                                <label class="block text-xs text-neutral-400 mb-1">Search in field:</label>
                                <select
                                    v-model="filters.searchField"
                                    class="bg-neutral-700 w-full h-8 border border-neutral-600 text-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="content">Content</option>
                                    <option value="author">Author</option>
                                    <option value="email">Email</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>
        </div>

        <!-- Status Tabs -->
        <div class="flex flex-wrap gap-2 mb-4">
            <button
                @click="setStatusFilter('')"
                class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                :class="filters.status === '' ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'"
            >
                All
            </button>
            <button
                @click="setStatusFilter('pending')"
                class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                :class="filters.status === 'pending' ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'"
            >
                Pending
            </button>
            <button
                @click="setStatusFilter('published')"
                class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                :class="filters.status === 'published' ? 'bg-green-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'"
            >
                Published
            </button>
            <button
                @click="setStatusFilter('rejected')"
                class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                :class="filters.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'"
            >
                Rejected
            </button>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading comments...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load comments</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="comments.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p class="text-neutral-300 mb-2">No comments found</p>
            <p class="text-neutral-400 text-sm mb-4">Try adjusting your search or filters</p>
        </div>

        <!-- Comments table -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider w-16">
                                ID
                            </th>
                            <th
                                @click="toggleSort('content')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Content
                                <span v-if="filters.sortBy === 'content'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th
                                @click="toggleSort('author')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Author
                                <span v-if="filters.sortBy === 'author'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th
                                @click="toggleSort('post')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Post
                                <span v-if="filters.sortBy === 'post'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th
                                @click="toggleSort('createdAt')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Date
                                <span v-if="filters.sortBy === 'createdAt'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th
                                @click="toggleSort('status')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Status
                                <span v-if="filters.sortBy === 'status'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider w-24">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="comment in comments" :key="comment.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="comment.id">
                                {{ comment.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 text-sm text-white">
                                <div class="max-h-16 overflow-hidden relative">
                                    <div class="line-clamp-2">{{ comment.content }}</div>
                                    <div
                                        v-if="comment.content.length > 120"
                                        class="absolute bottom-0 right-0 bg-gradient-to-l from-neutral-800 to-transparent px-2 cursor-pointer hover:underline text-blue-400"
                                        @click="viewCommentDetail(comment)"
                                    >
                                        Show more
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <div v-if="comment.memberInfo">
                                    <div class="font-medium text-white">{{ comment.memberInfo.name }}</div>
                                    <div class="text-neutral-400">{{ comment.memberInfo.email }}</div>
                                </div>
                                <div v-else class="text-neutral-400">
                                    Anonymous
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                <a v-if="comment.postInfo" :href="`${blogUrl}/post/${comment.postInfo.slug}#comment-${comment.id}`" target="_blank" class="text-blue-400 hover:text-blue-300 hover:underline">
                                    {{ truncateText(comment.postInfo.title, 30) }}
                                </a>
                                <span v-else>Unknown post</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                {{ formatDate(comment.createdAt) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span
                                    class="px-2 py-1 text-xs font-medium rounded-full"
                                    :class="getStatusClass(comment.status)"
                                >
                                    {{ getStatusLabel(comment.status) }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        v-if="comment.status !== 'published'"
                                        @click="changeStatus(comment, 'published')"
                                        title="Approve"
                                        class="text-neutral-400 hover:text-green-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>
                                    <button
                                        v-if="comment.status !== 'rejected'"
                                        @click="changeStatus(comment, 'rejected')"
                                        title="Reject"
                                        class="text-neutral-400 hover:text-yellow-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="confirmDelete(comment)"
                                        title="Delete"
                                        class="text-neutral-400 hover:text-red-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Pagination -->
        <Pagination
            :pagination="pagination"
            itemName="comments"
            @pageChange="handlePageChange"
        />

        <!-- Delete Confirmation Dialog -->
        <DeleteDialog
            :show="showDeleteDialog"
            :loading="deleteLoading"
            message="Are you sure you want to delete this comment?"
            warning-text="This action cannot be undone."
            loading-text="Deleting..."
            @confirm="deleteComment"
            @cancel="closeDeleteDialog"
        >
            <template #content>
                <div class="bg-neutral-700 p-3 rounded mb-4 text-sm text-neutral-300">
                    {{ commentToDelete?.content }}
                </div>
            </template>
        </DeleteDialog>

        <!-- View Comment Detail Dialog -->
        <div v-if="showDetailDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-2xl mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Comment Details</h3>
                    <button @click="closeDetailDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <div v-if="selectedComment">
                        <div class="mb-4">
                            <div class="flex items-start mb-4">
                                <div class="h-10 w-10 rounded-full bg-neutral-700 flex items-center justify-center text-white mr-3">
                                    <span v-if="!selectedComment.memberInfo?.avatar">{{ getInitials(selectedComment.memberInfo?.name || 'Anonymous') }}</span>
                                    <img v-else :src="selectedComment.memberInfo.avatar" :alt="selectedComment.memberInfo.name" class="h-10 w-10 rounded-full object-cover">
                                </div>
                                <div>
                                    <div class="font-medium text-white">{{ selectedComment.memberInfo?.name || 'Anonymous' }}</div>
                                    <div class="text-neutral-400 text-sm">{{ formatDate(selectedComment.createdAt) }}</div>
                                </div>
                                <div class="ml-auto">
                                    <span
                                        class="px-2 py-1 text-xs font-medium rounded-full"
                                        :class="getStatusClass(selectedComment.status)"
                                    >
                                        {{ getStatusLabel(selectedComment.status) }}
                                    </span>
                                </div>
                            </div>

                            <div class="bg-neutral-700 rounded p-4 mb-4">
                                <p class="text-white whitespace-pre-wrap">{{ selectedComment.content }}</p>
                            </div>

                            <div v-if="selectedComment.postInfo" class="bg-neutral-900 rounded p-4 mb-4">
                                <div class="text-sm text-neutral-400 mb-1">Posted on:</div>
                                <div class="text-white font-medium">{{ selectedComment.postInfo.title }}</div>
                                <a :href="`${blogUrl}/${selectedComment.postInfo.slug}#comment-${selectedComment.id}`" target="_blank" class="text-blue-400 hover:text-blue-300 text-sm mt-1 inline-block">
                                    View on site
                                </a>
                            </div>

                            <div v-if="selectedComment.parentId" class="bg-neutral-900 rounded p-4 mb-4">
                                <div class="text-sm text-neutral-400 mb-1">Reply to comment:</div>
                                <div class="text-white">{{ selectedComment.parentComment?.content || 'Parent comment not found' }}</div>
                            </div>
                        </div>

                        <div class="flex justify-end space-x-3 mt-4">
                            <button
                                v-if="selectedComment.status !== 'published'"
                                @click="changeStatus(selectedComment, 'published')"
                                class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Approve
                            </button>
                            <button
                                v-if="selectedComment.status !== 'rejected'"
                                @click="changeStatus(selectedComment, 'rejected')"
                                class="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm transition-colors flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                Reject
                            </button>
                            <button
                                @click="confirmDelete(selectedComment)"
                                class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Replace the toast notification with the new component -->
        <ToastNotification
            :show="notification.show"
            :message="notification.message"
            :type="notification.type"
            :duration="notification.duration"
            @close="notification.show = false"
        />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAdminClient } from '@cmmv/blog/admin/client'
import ToastNotification from '../components/ToastNotification.vue'
import Pagination from '../components/Pagination.vue'
import DeleteDialog from '../components/DeleteDialog.vue'

const adminClient = useAdminClient()

const comments = ref([])
const loading = ref(true)
const error = ref(null)

const showDeleteDialog = ref(false)
const commentToDelete = ref(null)
const deleteLoading = ref(false)

const showDetailDialog = ref(false)
const selectedComment = ref(null)

const notification = ref({
    show: false,
    type: 'success',
    message: '',
    duration: 3000
})

const pagination = ref({
    current: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
    from: 1,
    to: 10
})

const filters = ref({
    search: '',
    searchField: 'content',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1
})

const blogUrl = ref('');

const showSearchDropdown = ref(false)
const searchInput = ref(null)

function toggleSearchDropdown() {
    showSearchDropdown.value = !showSearchDropdown.value

    if (showSearchDropdown.value) {
        nextTick(() => {
            searchInput.value?.focus()
        })
    }
}

function clearSearch() {
    filters.value.search = ''
    filters.value.page = 1  // Reset to first page when clearing search
    loadComments()
    // Optional: Close dropdown after clearing
    showSearchDropdown.value = false
}

const loadBlogUrl = async () => {
    try {
        const settings = await adminClient.settings.getRoot();
        const urlSetting = settings.find(s => s.key === 'blog.url');

        if (urlSetting)
            blogUrl.value = urlSetting.value.replace(/\/$/, '');
    } catch (err) {
        console.error('Failed to load blog URL:', err);
        blogUrl.value = '';
    }
};

const paginationPages = computed(() => {
    const totalPages = pagination.value.lastPage

    if (totalPages <= 5)
        return Array.from({ length: totalPages }, (_, i) => i + 1)

    const current = pagination.value.current
    const pages = [1]

    if (current > 2) pages.push('...')

    if (current > 1 && current < totalPages) pages.push(current)

    if (current < totalPages - 1) pages.push('...')

    if (totalPages > 1) pages.push(totalPages)

    return pages
})

const loadComments = async () => {
    try {
        loading.value = true
        error.value = null

        const apiFilters = {
            limit: pagination.value.perPage,
            offset: (filters.value.page - 1) * pagination.value.perPage,
            sortBy: filters.value.sortBy,
            sort: filters.value.sortOrder,
        }

        if (filters.value.search) {
            apiFilters.search = filters.value.search
            apiFilters.searchField = filters.value.searchField
        }

        if (filters.value.status) {
            apiFilters.status = filters.value.status
        }

        const response = await adminClient.comments.getWithDetails(apiFilters)

        if (response && response.data) {
            comments.value = response.data || []

            const paginationData = response.pagination || {}
            const totalCount = response.count || 0
            const currentOffset = paginationData.offset || 0
            const currentLimit = paginationData.limit || 10

            // Calculate current page from offset and limit
            const currentPage = Math.floor(currentOffset / currentLimit) + 1
            const lastPage = Math.ceil(totalCount / currentLimit)

            pagination.value = {
                current: currentPage,
                lastPage: lastPage,
                perPage: currentLimit,
                total: totalCount,
                from: totalCount === 0 ? 0 : currentOffset + 1,
                to: Math.min(currentOffset + currentLimit, totalCount)
            }
        } else {
            comments.value = []
            // Reset pagination if data format is unexpected
            pagination.value = {
                current: 1,
                lastPage: 1,
                perPage: 10,
                total: 0,
                from: 0,
                to: 0
            }
        }

        loading.value = false
    } catch (err) {
        console.error('Failed to load comments:', err)
        loading.value = false
        error.value = err.message || 'Failed to load comments'
        showNotification('error', 'Failed to load comments')
    }
}

// Refresh data
const refreshData = () => {
    loadComments()
}

// Pagination methods
const handlePageChange = (newPage) => {
    filters.value.page = newPage;
}

// Watch for filter changes
watch(filters, () => {
    loadComments()
}, { deep: true })

// Confirm delete dialog
const confirmDelete = (comment) => {
    commentToDelete.value = comment
    showDeleteDialog.value = true
    // Close detail dialog if open
    if (showDetailDialog.value) {
        showDetailDialog.value = false
    }
}

const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    commentToDelete.value = null
}

// Delete comment
const deleteComment = async () => {
    if (!commentToDelete.value) return

    try {
        deleteLoading.value = true
        await adminClient.comments.delete(commentToDelete.value.id)
        deleteLoading.value = false
        closeDeleteDialog()
        showNotification('success', 'Comment deleted successfully')
        refreshData()
    } catch (err) {
        deleteLoading.value = false
        console.error('Failed to delete comment:', err)
        showNotification('error', err.message || 'Failed to delete comment')
    }
}

// View comment detail
const viewCommentDetail = (comment) => {
    selectedComment.value = comment
    showDetailDialog.value = true
}

const closeDetailDialog = () => {
    showDetailDialog.value = false
    selectedComment.value = null
}

// Change comment status
const changeStatus = async (comment, status) => {
    try {
        // Close detail dialog if open
        if (showDetailDialog.value) {
            showDetailDialog.value = false
        }

        const data = { status }
        await adminClient.comments.update(comment.id, data)

        // Update local state to reflect the change without reloading
        comment.status = status

        showNotification('success', `Comment ${status === 'published' ? 'approved' : 'rejected'} successfully`)
    } catch (err) {
        console.error('Failed to update comment status:', err)
        showNotification('error', err.message || 'Failed to update comment status')
    }
}

// Helper functions
const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'

    try {
        const date = new Date(timestamp)
        if (isNaN(date.getTime())) return 'N/A'
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch (err) {
        console.error('Date formatting error:', err, timestamp)
        return 'N/A'
    }
}

const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

const getStatusClass = (status) => {
    switch (status) {
        case 'published':
            return 'bg-green-900 text-green-200'
        case 'pending':
            return 'bg-blue-900 text-blue-200'
        case 'rejected':
            return 'bg-red-900 text-red-200'
        default:
            return 'bg-neutral-700 text-neutral-300'
    }
}

const getStatusLabel = (status) => {
    switch (status) {
        case 'published':
            return 'Published'
        case 'pending':
            return 'Pending'
        case 'rejected':
            return 'Rejected'
        default:
            return status
    }
}

const getInitials = (name) => {
    if (!name) return '?';
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

const toggleSort = (column) => {
    if (filters.value.sortBy === column) {
        filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
        filters.value.sortBy = column
        filters.value.sortOrder = 'desc'
    }
}

const showNotification = (type, message) => {
    notification.value = {
        show: true,
        type,
        message,
        duration: 3000
    }

    setTimeout(() => {
        notification.value.show = false
    }, notification.value.duration)
}

const setStatusFilter = (status) => {
    filters.value.status = status
    filters.value.page = 1  // Reset to first page when changing status filter
    loadComments()
}

onMounted(() => {
    loadComments()
    loadBlogUrl()

    // Close search dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (showSearchDropdown.value && !e.target.closest('.relative')
            && e.target !== document.querySelector('button[data-search-toggle]')) {
            showSearchDropdown.value = false
        }
    })
})
</script>
