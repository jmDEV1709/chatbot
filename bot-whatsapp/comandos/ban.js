module.exports = async ({ message, sock }) => {
    try {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        const groupMetadata = await sock.groupMetadata(groupId);
        const senderInfo = groupMetadata.participants.find((p) => p.id === sender);
        const isSenderAdmin = senderInfo?.admin === 'admin' || senderInfo?.admin === 'superadmin';

        if (!isSenderAdmin) {
            await sock.groupParticipantsUpdate(groupId, [sender], "remove");
            return "🚫 Você não é admin e tentou usar um comando de admin. Foi removido do grupo.";
        }

        const participant =
            message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!participant) {
            return "❌ Marca a pessoa. Exemplo: ,ban @usuario";
        }

        await sock.groupParticipantsUpdate(
            groupId,
            [participant],
            "remove"
        );

        return "✅ Utilizador removido do grupo.";
    } catch (error) {
        console.error(error);
        return "❌ Erro ao remover utilizador.";
    }
};