export const formatDate = (dateString: string, relative: boolean = false) => {
    if (!dateString) return '';
    const date = new Date(dateString);

    if (relative) {
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) {
            const years = Math.floor(interval);
            return `${years} ano${years > 1 ? 's' : ''} atrás`;
        }
        interval = seconds / 2592000;
        if (interval > 1) {
            const months = Math.floor(interval);
            return `${months} ${months > 1 ? 'mês' : 'mês'} atrás`;
        }
        interval = seconds / 86400;
        if (interval > 1) {
            const days = Math.floor(interval);
            return `${days} dia${days > 1 ? 's' : ''} atrás`;
        }
        interval = seconds / 3600;
        if (interval > 1) {
            const hours = Math.floor(interval);
            return `${hours}h atrás`;
        }
        interval = seconds / 60;
        if (interval > 1) {
            const minutes = Math.floor(interval);
            return `${minutes}min atrás`;
        }
        return `${Math.floor(seconds)}s atrás`;
    }

    return new Intl.DateTimeFormat('pt-BR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
};

export const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<\/?[^>]+(>|$)/g, " ").replace(/\s+/g, " ").trim();
};