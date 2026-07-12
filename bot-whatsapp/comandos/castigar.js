const {
    castigar
} = require('../utils/castigoStore');

function getMentionedIds(message) {
    const content =
        message?.message || {};

    const contextInfo =
        content
            ?.extendedTextMessage
            ?.contextInfo ||
        content
            ?.imageMessage
            ?.contextInfo ||
        content
            ?.videoMessage
            ?.contextInfo ||
        content
            ?.documentMessage
            ?.contextInfo ||
        {};

    const mentioned =
        Array.isArray(
            contextInfo.mentionedJid
        )
            ? contextInfo.mentionedJid
            : [];

    return [
        ...mentioned,

        /*
         * Alguns eventos do WhatsApp fornecem
         * uma versão alternativa do participante.
         */
        contextInfo.participant,
        contextInfo.participantAlt
    ].filter(Boolean);
}

module.exports = async ({
    message
}) => {
    const groupId =
        message?.key?.remoteJid;

    const mentionedIds =
        getMentionedIds(message);

    if (!groupId) {
        return '❌ Não consegui identificar o grupo.';
    }

    if (mentionedIds.length === 0) {
        return (
            '❌ Marque uma pessoa.\n\n' +
            'Exemplo:\n' +
            '`,castigar @pessoa`'
        );
    }

    const success =
        castigar(
            groupId,
            mentionedIds
        );

    if (!success) {
        return (
            '❌ Não consegui identificar ' +
            'a pessoa marcada.'
        );
    }

    /*
     * Sem resposta quando o comando funciona.
     */
    return null;
};