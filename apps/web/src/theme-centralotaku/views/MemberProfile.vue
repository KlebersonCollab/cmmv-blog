<template>
    <div class="lg:ml-64 w-full relative">
        <div class="container mx-auto max-w-4xl px-4 py-4">
            <div v-if="!isAuthenticated" class="bg-white rounded-lg shadow-lg p-8 text-center border border-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h2 class="text-xl font-bold text-neutral-900 mb-2 italic uppercase tracking-tighter">Autenticação Necessária</h2>
                <p class="text-neutral-600 mb-6">Você precisa estar logado para ver esta página.</p>
                <div class="flex justify-center space-x-4">
                    <a href="/member/login" class="px-6 py-2 bg-[#ed1c24] hover:bg-black text-white rounded-md font-bold uppercase tracking-widest text-xs transition-all shadow-md">
                        Entrar
                    </a>
                    <a href="/member/register" class="px-6 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-md font-bold uppercase tracking-widest text-xs transition-all">
                        Cadastrar
                    </a>
                </div>
            </div>

            <div v-else-if="isLoading" class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ed1c24]"></div>
                <span class="ml-3 text-neutral-600 font-medium">Carregando perfil...</span>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Profile Sidebar -->
                <div class="bg-white rounded-lg shadow-lg overflow-hidden p-6 border border-slate-100">
                    <div class="flex flex-col items-center text-center">
                        <div class="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-black text-[#ed1c24] mb-4 border-4 border-white shadow-inner">
                            {{ memberInitials }}
                        </div>
                        <h1 class="text-xl font-black text-neutral-900 mb-1 italic uppercase tracking-tighter">{{ memberProfile.name }}</h1>
                        <p class="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-4">{{ memberProfile.email }}</p>

                        <div class="w-full border-t border-slate-50 pt-4 mt-2">
                            <p class="text-[10px] text-neutral-400 uppercase font-black tracking-widest mb-1 flex justify-between">
                                <span>Membro desde:</span>
                                <span class="text-neutral-900">{{ formatDate(memberProfile.createdAt) }}</span>
                            </p>
                            <p class="text-[10px] text-neutral-400 uppercase font-black tracking-widest mb-1 flex justify-between">
                                <span>Notificações:</span>
                                <span :class="memberProfile.emailDisabled ? 'text-red-500' : 'text-green-500'">
                                    {{ memberProfile.emailDisabled ? 'Desativado' : 'Ativado' }}
                                </span>
                            </p>
                        </div>

                        <button @click="logout" class="mt-6 w-full px-4 py-3 bg-black hover:bg-[#ed1c24] text-white rounded-lg transition-all duration-300 text-xs font-black uppercase tracking-widest shadow-md active:scale-95">
                            Sair da Conta
                        </button>
                    </div>
                </div>

                <!-- Profile Content -->
                <div class="md:col-span-2 space-y-6">
                    <!-- Profile Edit Form -->
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden p-6 border border-slate-100">
                        <h2 class="text-sm font-black text-neutral-900 uppercase tracking-widest mb-6 pb-2 border-b-2 border-[#ed1c24] inline-block">
                            Editar Perfil
                        </h2>

                        <div v-if="updateMessage" class="mb-6 p-4 rounded-lg text-sm font-bold shadow-sm" :class="updateSuccess ? 'bg-green-50 border border-green-100 text-green-600' : 'bg-red-50 border border-red-100 text-red-600'">
                            {{ updateMessage }}
                        </div>

                        <form @submit.prevent="updateProfile" class="space-y-4">
                            <div>
                                <label for="name" class="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">
                                    Nome completo
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    v-model="profileForm.name"
                                    autocomplete="name"
                                    class="bg-white border border-slate-200 text-neutral-900 text-sm rounded-lg block w-full p-2.5 focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                    placeholder="Seu nome"
                                />
                            </div>

                            <div>
                                <label class="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">
                                    E-mail
                                </label>
                                <input
                                    type="email"
                                    disabled
                                    :value="memberProfile.email"
                                    class="bg-slate-50 border border-slate-100 text-neutral-400 text-sm rounded-lg block w-full p-2.5 cursor-not-allowed"
                                    placeholder="seu@email.com"
                                />
                                <p class="mt-1.5 text-[10px] text-neutral-400 italic">
                                    O endereço de e-mail não pode ser alterado por segurança.
                                </p>
                            </div>

                            <div>
                                <label for="note" class="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">
                                    Bio / Nota
                                </label>
                                <textarea
                                    id="note"
                                    name="note"
                                    v-model="profileForm.note"
                                    rows="3"
                                    class="bg-white border border-slate-200 text-neutral-900 text-sm rounded-lg block w-full p-2.5 focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                    placeholder="Conte um pouco sobre você..."
                                ></textarea>
                            </div>

                            <div class="pt-2">
                                <div class="flex items-center">
                                    <input
                                        id="emailDisabled"
                                        name="emailDisabled"
                                        type="checkbox"
                                        v-model="profileForm.emailDisabled"
                                        class="h-4 w-4 text-[#ed1c24] focus:ring-[#ed1c24] border-slate-300 rounded cursor-pointer"
                                    />
                                    <label for="emailDisabled" class="ml-2 block text-xs font-bold text-neutral-600 uppercase tracking-widest cursor-pointer">
                                        Desativar notificações por e-mail
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-black uppercase tracking-widest text-white bg-[#ed1c24] hover:bg-black focus:outline-none transition-all duration-300 active:scale-95"
                                :disabled="isUpdating"
                            >
                                <span v-if="isUpdating" class="flex items-center">
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Salvando...
                                </span>
                                <span v-else>Salvar Alterações</span>
                            </button>
                        </form>
                    </div>

                    <!-- Password Change Form -->
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden p-6 border border-slate-100">
                        <h2 class="text-sm font-black text-neutral-900 uppercase tracking-widest mb-6 pb-2 border-b-2 border-[#ed1c24] inline-block">
                            Alterar Senha
                        </h2>

                        <div v-if="passwordMessage" class="mb-6 p-4 rounded-lg text-sm font-bold shadow-sm" :class="passwordSuccess ? 'bg-green-50 border border-green-100 text-green-600' : 'bg-red-50 border border-red-100 text-red-600'">
                            {{ passwordMessage }}
                        </div>

                        <form @submit.prevent="changePassword" class="space-y-4">
                            <div>
                                <label for="currentPassword" class="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">
                                    Senha Atual
                                </label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    name="current-password"
                                    v-model="passwordForm.currentPassword"
                                    autocomplete="current-password"
                                    required
                                    class="bg-white border border-slate-200 text-neutral-900 text-sm rounded-lg block w-full p-2.5 focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label for="newPassword" class="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">
                                    Nova Senha
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    name="new-password"
                                    v-model="passwordForm.newPassword"
                                    autocomplete="new-password"
                                    required
                                    class="bg-white border border-slate-200 text-neutral-900 text-sm rounded-lg block w-full p-2.5 focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label for="confirmPassword" class="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">
                                    Confirmar Nova Senha
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirm-password"
                                    v-model="passwordForm.confirmPassword"
                                    autocomplete="new-password"
                                    required
                                    class="bg-white border border-slate-200 text-neutral-900 text-sm rounded-lg block w-full p-2.5 focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-black uppercase tracking-widest text-white bg-black hover:bg-[#ed1c24] focus:outline-none transition-all duration-300 active:scale-95"
                                :disabled="isChangingPassword"
                            >
                                <span v-if="isChangingPassword" class="flex items-center">
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Alterando...
                                </span>
                                <span v-else>Alterar Senha</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { vue3 } from '@cmmv/blog/client'
import { useRouter } from 'vue-router'
import useMemberAuth from '../../composables/useMemberAuth'

const router = useRouter()
const blogAPI = vue3.useBlog()
const auth = useMemberAuth()

const isAuthenticated = computed(() => auth.isLoggedIn.value)
const memberProfile = ref<any>({})
const isLoading = ref(true)
const isUpdating = ref(false)
const isChangingPassword = ref(false)
const updateMessage = ref('')
const updateSuccess = ref(false)
const passwordMessage = ref('')
const passwordSuccess = ref(false)

const profileForm = ref({
    name: '',
    note: '',
    emailDisabled: false
})

const passwordForm = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

const memberInitials = computed(() => {
    if (!memberProfile.value?.name) return '';
    return memberProfile.value.name
        .split(' ')
        .map((part: string) => part[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
})

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    return new Intl.DateTimeFormat('pt-BR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date)
}

const loadProfile = async () => {
    isLoading.value = true;

    try {
        if (!auth.isLoggedIn.value) {
            isLoading.value = false;
            return;
        }

        const authData = auth.getAuthMember();

        if (!authData) {
            isLoading.value = false;
            return;
        }

        const profile = await blogAPI.members.getMyProfile();

        if (profile) {
            memberProfile.value = profile;

            profileForm.value = {
                name: profile.name || '',
                note: profile.note || '',
                emailDisabled: profile.emailDisabled || false
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error)
    } finally {
        isLoading.value = false
    }
}

const updateProfile = async () => {
    updateMessage.value = '';
    isUpdating.value = true;

    try {
        if (!isAuthenticated.value) {
            router.push('/member/login')
            return
        }

        const response = await blogAPI.members.updateProfile(memberProfile.value.id, profileForm.value)

        if (response) {
            memberProfile.value = {
                ...memberProfile.value,
                ...profileForm.value
            }

            auth.updateMemberData(profileForm.value)

            updateSuccess.value = true
            updateMessage.value = 'Perfil atualizado com sucesso'
        } else {
            updateSuccess.value = false
            updateMessage.value = 'Falha ao atualizar perfil'
        }
    } catch (error: any) {
        console.error('Update error:', error)
        updateSuccess.value = false
        updateMessage.value = error.message || 'Falha ao atualizar perfil'
    } finally {
        isUpdating.value = false
    }
}

const changePassword = async () => {
    passwordMessage.value = ''
    isChangingPassword.value = true

    try {
        if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
            passwordSuccess.value = false
            passwordMessage.value = 'As novas senhas não coincidem'
            isChangingPassword.value = false
            return
        }

        if (passwordForm.value.newPassword.length < 8) {
            passwordSuccess.value = false
            passwordMessage.value = 'A senha deve ter pelo menos 8 caracteres'
            isChangingPassword.value = false
            return
        }

        if (!isAuthenticated.value) {
            router.push('/member/login')
            return
        }

        const authData = auth.getAuthMember()
        if (!authData) {
            router.push('/member/login')
            return
        }

        const response = await fetch('/api/members/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.token}`
            },
            body: JSON.stringify({
                currentPassword: passwordForm.value.currentPassword,
                newPassword: passwordForm.value.newPassword
            })
        })

        if (response.ok) {
            passwordSuccess.value = true
            passwordMessage.value = 'Senha alterada com sucesso'

            passwordForm.value = {
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }
        } else {
            const data = await response.json()
            passwordSuccess.value = false
            passwordMessage.value = data.message || 'Falha ao alterar senha'
        }
    } catch (error: any) {
        console.error('Password change error:', error)
        passwordSuccess.value = false
        passwordMessage.value = error.message || 'Falha ao alterar senha'
    } finally {
        isChangingPassword.value = false
    }
}

const logout = () => {
    auth.logout()
    memberProfile.value = {}
    router.push('/')
}

onMounted(() => loadProfile())
</script>
