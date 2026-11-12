module.exports = async ({ message, sock }) => {
    try {
        const groupId = message.key.remoteJid;
        if (!groupId?.endsWith('@g.us')) {
            return '❌ Esse comando só funciona em grupos.';
        }

        const code = await sock.groupInviteCode(groupId);
        return `🔗 https://chat.whatsapp.com/${code}`;
    } catch (error) {
        console.error('Erro no comando linkgrupo:', error);
        return '❌ Preciso ser administrador do grupo para obter o link.';
    }
};
