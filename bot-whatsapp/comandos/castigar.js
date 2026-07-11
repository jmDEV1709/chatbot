const { castigar } = require('../utils/castigoStore');

function getMentionedUser(message) {
    const msg = message?.message;

    const mentionedJids =
        msg?.extendedTextMessage?.contextInfo?.mentionedJid ||
        msg?.imageMessage?.contextInfo?.mentionedJid ||
        msg?.videoMessage?.contextInfo?.mentionedJid ||
        [];

    return mentionedJids[0] || null;
}

module.exports = async ({ message }) => {
    const groupId = message?.key?.remoteJid;
    const mentionedUser = getMentionedUser(message);

    if (!groupId || !mentionedUser) {
        return '❌ Marque a pessoa que deseja castigar.\n\nExemplo: ,castigar @pessoa';
    }

    castigar(groupId, mentionedUser);

    // Sem retorno: o bot não envia mensagem quando o castigo é aplicado.
    return null;
};