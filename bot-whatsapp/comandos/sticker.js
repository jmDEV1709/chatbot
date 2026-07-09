const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const MAX_VIDEO_SECONDS = 10; // limite pra evitar travar por vídeo grande

module.exports = async ({ message, sock }) => {
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        const targetMessage = quoted
            ? { message: quoted, key: message.key }
            : message;

        const isImage = targetMessage.message?.imageMessage;
        const isVideo = targetMessage.message?.videoMessage;

        if (!isImage && !isVideo) {
            return "❌ Marca ou responde uma imagem/vídeo com ,sticker";
        }

        // Bloqueia vídeo longo demais ANTES de baixar/converter
        if (isVideo) {
            const seconds = targetMessage.message.videoMessage.seconds || 0;
            if (seconds > MAX_VIDEO_SECONDS) {
                return `❌ Vídeo muito longo pra figurinha (máx ${MAX_VIDEO_SECONDS}s). Manda um trecho menor.`;
            }
        }

        const buffer = await downloadMediaMessage(
            targetMessage,
            'buffer',
            {},
            { logger: undefined, reuploadRequest: sock.updateMediaMessage }
        );

        if (!buffer || buffer.length === 0) {
            return "❌ Não consegui baixar a mídia. Tenta de novo.";
        }

        const sticker = new Sticker(buffer, {
            pack: 'ISAAK DITADOR',
            author: 'JM-DEVELOPER',
            type: StickerTypes.FULL,
            quality: isVideo ? 50 : 100, // vídeo com qualidade menor = menos peso/menos chance de travar
        });

        // Timeout de segurança: se travar na conversão, não deixa o processo pendurado
        const stickerBuffer = await Promise.race([
            sticker.toBuffer(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout na conversão')), 30000)
            )
        ]);

        await sock.sendMessage(message.key.remoteJid, { sticker: stickerBuffer }, { quoted: message });

        return null;
    } catch (error) {
        console.error('Erro ao criar figurinha:', error);
        return "❌ Erro ao criar a figurinha. Se for vídeo, tenta um mais curto.";
    }
};