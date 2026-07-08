const fs = require('fs');
const path = require('path');

module.exports = async ({ sock, message, isAdmin, isBotAdmin }) => {
  try {
    if (!isAdmin) {
      return '❌ Apenas administradores podem usar este comando.';
    }

    if (!isBotAdmin) {
      return '❌ Preciso ser administrador.';
    }

    const mentioned =
      message.message?.extendedTextMessage?.contextInfo?.mentionedJid;

    if (!mentioned || !mentioned[0]) {
      return '✅ Marque alguém.\nExemplo:\n,punir @usuario';
    }

    const alvo = mentioned[0];

    const dbPath = path.join(__dirname, '../database/punidos.json');

    let punidos = {};

    if (fs.existsSync(dbPath)) {
      punidos = JSON.parse(fs.readFileSync(dbPath));
    }

    if (!punidos[alvo]) {
      punidos[alvo] = 0;
    }

    punidos[alvo]++;

    const totalPunicoes = punidos[alvo];

    fs.writeFileSync(dbPath, JSON.stringify(punidos, null, 2));

    if (totalPunicoes >= 3) {

      await sock.groupParticipantsUpdate(
        message.key.remoteJid,
        [alvo],
        'remove'
      );

      delete punidos[alvo];

      fs.writeFileSync(
        dbPath,
        JSON.stringify(punidos, null, 2)
      );

      return `🚫 Usuário atingiu 3 punições e foi banido.`;
    }

    return `⚠️ Usuário punido.\nPunições: ${totalPunicoes}/3`;

  } catch (err) {
    console.log(err);
    return '❌ Erro ao aplicar punição.';
  }
};