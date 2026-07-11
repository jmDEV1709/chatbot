const fs = require('fs');
const path = require('path');

const databaseDir = path.join(__dirname, '..', 'database');
const castigosFile = path.join(databaseDir, 'castigos.json');

function ensureDatabase() {
    if (!fs.existsSync(databaseDir)) {
        fs.mkdirSync(databaseDir, { recursive: true });
    }

    if (!fs.existsSync(castigosFile)) {
        fs.writeFileSync(castigosFile, '{}', 'utf8');
    }
}

function loadCastigos() {
    ensureDatabase();

    try {
        const data = fs.readFileSync(castigosFile, 'utf8');
        const castigos = JSON.parse(data);

        return castigos && typeof castigos === 'object'
            ? castigos
            : {};
    } catch (error) {
        console.error('Erro ao carregar castigos:', error);

        fs.writeFileSync(castigosFile, '{}', 'utf8');

        return {};
    }
}

function saveCastigos(castigos) {
    ensureDatabase();

    try {
        fs.writeFileSync(
            castigosFile,
            JSON.stringify(castigos, null, 2),
            'utf8'
        );
    } catch (error) {
        console.error('Erro ao salvar castigos:', error);
    }
}

function normalizeId(jid) {
    if (!jid) {
        return null;
    }

    return String(jid)
        .split(':')[0]
        .split('@')[0]
        .replace(/\D/g, '');
}

function castigar(groupId, userId) {
    const normalizedGroup = String(groupId);
    const normalizedUser = normalizeId(userId);

    if (!normalizedUser) {
        return false;
    }

    const castigos = loadCastigos();

    if (!Array.isArray(castigos[normalizedGroup])) {
        castigos[normalizedGroup] = [];
    }

    if (!castigos[normalizedGroup].includes(normalizedUser)) {
        castigos[normalizedGroup].push(normalizedUser);
        saveCastigos(castigos);
    }

    return true;
}

function descastigar(groupId, userId) {
    const normalizedGroup = String(groupId);
    const normalizedUser = normalizeId(userId);

    if (!normalizedUser) {
        return false;
    }

    const castigos = loadCastigos();

    if (!Array.isArray(castigos[normalizedGroup])) {
        return false;
    }

    castigos[normalizedGroup] = castigos[normalizedGroup].filter(
        id => id !== normalizedUser
    );

    if (castigos[normalizedGroup].length === 0) {
        delete castigos[normalizedGroup];
    }

    saveCastigos(castigos);

    return true;
}

function isCastigado(groupId, userId) {
    const normalizedGroup = String(groupId);
    const normalizedUser = normalizeId(userId);

    if (!normalizedUser) {
        return false;
    }

    const castigos = loadCastigos();
    const castigadosDoGrupo = castigos[normalizedGroup];

    if (!Array.isArray(castigadosDoGrupo)) {
        return false;
    }

    return castigadosDoGrupo.includes(normalizedUser);
}

module.exports = {
    castigar,
    descastigar,
    isCastigado,
    normalizeId
};