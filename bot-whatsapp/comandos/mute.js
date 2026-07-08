const { muteUser } = require('../utils/mutedStore');

module.exports = async ({ message, sock }) => {
    try {
        const groupId = message.key.remoteJid;

        const participant =
            message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!participant) {
            return "❌ Marca a pessoa. Exemplo: ,mute @usuario";
        }

        muteUser(groupId, participant);

        return "🔇 Utilizador mutado. As mensagens dele(a) serão apagadas.";
    } catch (error) {
        console.error(error);
        return "❌ Erro ao mutar utilizador.";
    }
};