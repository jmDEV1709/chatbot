const {
    downloadMediaMessage
} = require('@whiskeysockets/baileys');

function getQuotedMessage(message) {
    const contextInfo =
        message.message?.extendedTextMessage?.contextInfo ||
        message.message?.imageMessage?.contextInfo ||
        message.message?.videoMessage?.contextInfo;

    if (!contextInfo?.quotedMessage) {
        return null;
    }

    let quotedContent = contextInfo.quotedMessage;
    while (
        quotedContent?.viewOnceMessage?.message ||
        quotedContent?.viewOnceMessageV2?.message ||
        quotedContent?.viewOnceMessageV2Extension?.message ||
        quotedContent?.ephemeralMessage?.message
    ) {
        quotedContent =
            quotedContent.viewOnceMessage?.message ||
            quotedContent.viewOnceMessageV2?.message ||
            quotedContent.viewOnceMessageV2Extension?.message ||
            quotedContent.ephemeralMessage?.message;
    }

    return {
        key: {
            remoteJid: message.key.remoteJid,
            id: contextInfo.stanzaId,
            participant: contextInfo.participant
        },
        message: quotedContent
    };
}

module.exports = async ({ message, sock }) => {
    try {
        const quoted = getQuotedMessage(message);
        const source = quoted || message;
        const content = source.message || {};
        const image = content.imageMessage;
        const video = content.videoMessage;

        if (!image && !video) {
            return '❌ Responda a uma imagem/vídeo ou use ,revelar na legenda da mídia.';
        }

        const media = await downloadMediaMessage(source, 'buffer', {});
        const options = { quoted: message };

        if (image) {
            await sock.sendMessage(
                message.key.remoteJid,
                {
                    image: media,
                    caption: '🖼️ Imagem revelada.'
                },
                options
            );
        } else {
            await sock.sendMessage(
                message.key.remoteJid,
                {
                    video: media,
                    caption: '🎬 Vídeo revelado.'
                },
                options
            );
        }

        return null;
    } catch (error) {
        console.error('Erro no comando revelar:', error);
        return '❌ Não foi possível revelar essa mídia.';
    }
};
