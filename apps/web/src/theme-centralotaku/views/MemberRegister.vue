<template>
    <div>
        <div class="container mx-auto max-w-xl px-4 py-10">
            <div class="bg-white rounded-lg shadow-lg overflow-hidden border border-slate-100">
                <div class="p-6">
                    <h1 class="text-2xl font-bold text-neutral-900 mb-6 text-center italic uppercase tracking-tighter">Criar Conta</h1>

                    <div v-if="errorMessage" class="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm font-medium">
                        {{ errorMessage }}
                    </div>

                    <form @submit.prevent="handleRegister">
                        <div class="mb-4">
                            <label for="name" class="block text-xs font-bold text-neutral-700 uppercase tracking-widest mb-1.5">
                                Nome
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                v-model="registerForm.name"
                                autocomplete="name"
                                required
                                class="bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg block w-full p-2.5 focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent outline-none transition-all"
                                placeholder="Seu nome"
                            />
                        </div>

                        <div class="mb-4">
                            <label for="email" class="block text-xs font-bold text-neutral-700 uppercase tracking-widest mb-1.5">
                                E-mail
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                v-model="registerForm.email"
                                autocomplete="email"
                                required
                                class="bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg block w-full p-2.5 focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent outline-none transition-all"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div class="mb-6">
                            <label for="password" class="block text-xs font-bold text-neutral-700 uppercase tracking-widest mb-1.5">
                                Senha
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                v-model="registerForm.password"
                                autocomplete="new-password"
                                required
                                class="bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg block w-full p-2.5 focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                            />
                            <p class="mt-2 text-xs text-neutral-500 italic">
                                A senha deve ter pelo menos 8 caracteres
                            </p>
                        </div>

                        <div class="mb-8">
                            <div class="flex items-start">
                                <input
                                    id="accept-terms"
                                    name="accept-terms"
                                    type="checkbox"
                                    v-model="registerForm.acceptTerms"
                                    required
                                    class="h-4 w-4 mt-0.5 text-[#ed1c24] focus:ring-[#ed1c24] border-neutral-300 rounded cursor-pointer"
                                />
                                <label for="accept-terms" class="ml-2 block text-sm text-neutral-600 leading-snug cursor-pointer">
                                    Eu concordo com os <a href="/terms-of-service" class="font-bold text-[#ed1c24] hover:underline">Termos de Serviço</a> e a <a href="/terms-of-privacy" class="font-bold text-[#ed1c24] hover:underline">Política de Privacidade</a>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-black uppercase tracking-widest text-white bg-[#ed1c24] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ed1c24] transition-all duration-300 active:scale-95"
                            :disabled="isRegistering || !registerForm.acceptTerms"
                        >
                            <span v-if="isRegistering" class="flex items-center">
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Criando conta...
                            </span>
                            <span v-else>Criar Conta</span>
                        </button>

                        <div class="mt-8 text-center pt-6 border-t border-slate-50">
                            <span class="text-sm text-neutral-500 tracking-wide">Já tem uma conta?</span>
                            <a href="/member/login" class="ml-2 text-sm font-bold text-[#ed1c24] hover:underline uppercase tracking-tighter">Entrar</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { vue3 } from '@cmmv/blog/client';
import { useRouter } from 'vue-router';

import {
    saveAuthData, isAuthenticated
} from '../../composables/useMemberAuth';

const router = useRouter()
const blogAPI = vue3.useBlog()

const registerForm = ref({
    name: '',
    email: '',
    password: '',
    acceptTerms: false
})

const isRegistering = ref(false)
const errorMessage = ref('')

const handleRegister = async () => {
    errorMessage.value = ''
    isRegistering.value = true

    try {
        if (registerForm.value.password.length < 8) {
            errorMessage.value = 'A senha deve ter pelo menos 8 caracteres'
            isRegistering.value = false
            return
        }

        const response = await blogAPI.members.create({
            name: registerForm.value.name,
            email: registerForm.value.email,
            password: registerForm.value.password
        })

        if (response && response.data) {
            if (response.data.token) {
                saveAuthData(response.token, response.member, false)
                router.push('/member/profile')
            } else {
                router.push({
                    path: '/member/login',
                    query: { registered: 'success' }
                })
            }
        } else {
            errorMessage.value = 'Falha ao criar conta. Por favor, tente novamente.'
        }
    } catch (error: any) {
        console.error('Registration error:', error)
        errorMessage.value = error.message || 'Falha ao criar conta. Por favor, tente novamente.'
    } finally {
        isRegistering.value = false
    }
}

onMounted(() => {
    if (isAuthenticated())
        router.push('/member/profile')
})
</script>
