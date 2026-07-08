const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

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

        const buffer = await downloadMediaMessage(
            targetMessage,
            'buffer',
            {},
            { logger: undefined, reuploadRequest: sock.updateMediaMessage }
        );

        const sticker = new Sticker(buffer, {
            pack: 'Meu Bot',
            author: 'Bot WhatsApp',
            type: StickerTypes.FULL,
            quality: 70,
        });

        const stickerBuffer = await sticker.toBuffer();

        await sock.sendMessage(message.key.remoteJid, { sticker: stickerBuffer }, { quoted: message });

        return null;
    } catch (error) {
        console.error(error);
        return "❌ Erro ao criar a figurinha. Marca ou responde uma imagem/vídeo.";
    }
};