module.exports = async ({ message, sock, args }) => {
    try {
        const groupId = message.key.remoteJid;
        const name = args.join(' ').trim();

        if (!groupId?.endsWith('@g.us')) {
            return '❌ Esse comando só funciona em grupos.';
        }
        if (name.length < 3 || name.length > 40) {
            return '❌ O nome deve ter entre 3 e 40 caracteres.';
        }

        await sock.groupUpdateSubject(groupId, name);
        return `✅ Nome do grupo alterado para: ${name}`;
    } catch (error) {
        console.error('Erro no comando setname:', error);
        return '❌ Preciso ser administrador para alterar o nome do grupo.';
    }
};
