module.exports = async ({ message, sock }) => {
    try {
        const groupId = message.key.remoteJid;

        if (!groupId?.endsWith('@g.us')) {
            return '❌ Esse comando só funciona em grupos.';
        }

        const contextInfo =
            message.message?.extendedTextMessage?.contextInfo ||
            message.message?.imageMessage?.contextInfo ||
            message.message?.videoMessage?.contextInfo;

        const target =
            contextInfo?.mentionedJid?.[0] ||
            contextInfo?.participant ||
            message.key.participant ||
            message.participant;

        if (!target) {
            return '❌ Marque alguém ou responda a uma mensagem.';
        }

        const metadata = await sock.groupMetadata(groupId);
        const participant = metadata.participants.find((item) =>
            [item.id, item.jid, item.lid, item.phoneNumber].includes(target)
        );
        const role = participant?.admin ? 'Administrador' : 'Membro';
        const number = target.split('@')[0];

        let profileImage;
        try {
            profileImage = await sock.profilePictureUrl(target, 'image');
        } catch {
            profileImage = null;
        }

        const caption =
            `👤 *Nome:* @${number}\n` +
            `🎖️ *Cargo:* ${role}\n\n` +
            `🌚 *Programa:* R$ ${(Math.random() * 5000 + 1000).toFixed(2)}\n` +
            `🐮 *Gado:* ${Math.floor(Math.random() * 100) + 1}%\n` +
            `🎱 *Passiva:* ${Math.floor(Math.random() * 100) + 1}%\n` +
            `✨ *Beleza:* ${Math.floor(Math.random() * 100) + 1}%`;

        const content = profileImage
            ? { image: { url: profileImage }, caption }
            : { text: caption };

        await sock.sendMessage(groupId, {
            ...content,
            mentions: [target]
        }, { quoted: message });

        return null;
    } catch (error) {
        console.error('Erro no comando perfil:', error);
        return '❌ Ocorreu um erro ao verificar o perfil.';
    }
};
