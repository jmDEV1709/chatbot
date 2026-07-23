const {
    games,
    parseCoordinate,
    fireShot,
    allSunk
} = require('../utils/navalStore');

module.exports = async ({ args, message }) => {
    const groupId = message?.key?.remoteJid;
    const sender = message?.key?.participant || message?.key?.remoteJid;

    if (!groupId) {
        return '❌ Esse comando só funciona em grupo.';
    }

    const game = games.get(groupId);

    if (!game || game.status !== 'playing') {
        return '❌ Não tem Batalha Naval rolando. Use `,naval` pra começar.';
    }

    if (!game.players.includes(sender)) {
        return '❌ Você não faz parte dessa partida.';
    }

    const coord = parseCoordinate(args?.[0]);

    if (!coord) {
        return (
            '❌ Coordenada inválida.\n' +
            'Use letra (a-p) + número (1-16), ex: `,shoot a2` ou `,shoot p16`'
        );
    }

    if (game.mode === 'solo') {
        const board = game.boards[sender];
        const result = fireShot(board, coord.row, coord.col);

        if (result.alreadyShot) {
            return `⚠️ Você já atirou em ${coord.label}.`;
        }

        let resposta = result.hit
            ? `💥 Tiro certeiro em ${coord.label}!`
            : `🌊 Água em ${coord.label}.`;

        if (result.hit && result.sunk) {
            resposta += `\n🚢 Você afundou o ${result.ship.name}!`;
        }

        if (allSunk(board)) {
            games.delete(groupId);
            resposta +=
                '\n\n🏆 *Você afundou toda a frota!*\n' +
                'Use `,naval` pra jogar de novo.';
        }

        return resposta;
    }

    // pvp
    if (game.turn !== sender) {
        return '⏳ Não é sua vez. Aguarde o adversário atirar.';
    }

    const opponent = game.players.find(p => p !== sender);
    const board = game.boards[opponent];
    const result = fireShot(board, coord.row, coord.col);

    if (result.alreadyShot) {
        return `⚠️ Você já atirou em ${coord.label} nesse adversário.`;
    }

    if (!result.alreadyShot) {
        game.turn = opponent;
    }

    let resposta = result.hit
        ? `💥 @${sender.split('@')[0]} acertou em ${coord.label}!`
        : `🌊 @${sender.split('@')[0]} atirou em ${coord.label} e caiu na água.`;

    if (result.hit && result.sunk) {
        resposta += `\n🚢 Afundou o ${result.ship.name} de @${opponent.split('@')[0]}!`;
    }

    if (allSunk(board)) {
        games.delete(groupId);
        resposta +=
            `\n\n🏆 *@${sender.split('@')[0]} venceu a Batalha Naval!*\n` +
            'Use `,naval` pra jogar de novo.';
        return resposta;
    }

    game.turn = opponent;
    resposta += `\n\nVez de: @${opponent.split('@')[0]}`;

    return resposta;
};