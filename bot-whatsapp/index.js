#!/usr/bin/env node
/**
 * corrigir-index.js
 * Corrige automaticamente o index.js do bot WhatsApp do Jorge.
 *
 * O script faz:
 * 1) Adiciona Browsers no import do Baileys.
 * 2) Troca browser antigo por Browsers.ubuntu('Chrome').
 * 3) Corrige anunciarBanimento para aceitar participant como string ou objeto.
 * 4) Ajusta audio .mpeg/.ogg: .ogg vai como ptt, .mpeg vai como audio normal.
 * 5) Remove duplicacao visual do comentario USUARIO MUTADO.
 *
 * Uso:
 *   node corrigir-index.js
 * ou:
 *   node corrigir-index.js /caminho/para/index.js
 */

const fs = require('fs');
const path = require('path');

const targetPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(process.cwd(), 'index.js');

if (!fs.existsSync(targetPath)) {
    console.error('❌ index.js nao encontrado em:', targetPath);
    console.error('Entre na pasta do bot ou passe o caminho do index.js.');
    process.exit(1);
}

let code = fs.readFileSync(targetPath, 'utf8');
const original = code;

function backupFile() {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = targetPath.replace(/\.js$/, `.backup-${stamp}.js`);
    fs.writeFileSync(backupPath, original, 'utf8');
    console.log('✅ Backup criado:', backupPath);
}

function addBrowsersImport() {
    if (code.includes('Browsers') && code.includes("require('@whiskeysockets/baileys')")) {
        return;
    }

    code = code.replace(
        /const\s*\{([\s\S]*?)\}\s*=\s*require\(['"]@whiskeysockets\/baileys['"]\);/,
        (match, inside) => {
            if (inside.includes('Browsers')) return match;
            const cleanInside = inside.trim().replace(/,\s*$/, '');
            return `const {\n${cleanInside},\n    Browsers\n} = require('@whiskeysockets/baileys');`;
        }
    );
}

function replaceBrowserOption() {
    code = code.replace(
        /sock\s*=\s*makeWASocket\s*\(\s*\{\s*auth:\s*state,\s*browser:\s*\[\s*['"]Bot WhatsApp['"]\s*,\s*['"]Chrome['"]\s*,\s*['"]1\.0\.0['"]\s*\]\s*\}\s*\);/,
        "sock = makeWASocket({\n        auth: state,\n        browser: Browsers.ubuntu('Chrome')\n    });"
    );
}

function replaceBanAnnouncement() {
    const newBlock = `function getParticipantJid(participant) {
    if (!participant) {
        return null;
    }

    if (typeof participant === 'string') {
        return participant;
    }

    return (
        participant.id ||
        participant.jid ||
        participant.lid ||
        participant.phoneNumber ||
        null
    );
}

function getMentionNumber(jid) {
    return String(jid || '')
        .split('@')[0]
        .split(':')[0]
        .replace(/\\D/g, '');
}

async function anunciarBanimento(groupId, participant) {
    try {
        const participantJid = getParticipantJid(participant);

        if (!participantJid) {
            console.log(
                'Participante removido sem JID valido:',
                participant
            );
            return;
        }

        const number = getMentionNumber(participantJid);
        const audioExt = path.extname(AUDIO_BAN_PATH).toLowerCase();

        await sock.sendMessage(groupId, {
            text: \`🚫 @\${number} foi banido do grupo.\`,
            mentions: [participantJid]
        });

        if (fs.existsSync(AUDIO_BAN_PATH)) {
            await sock.sendMessage(groupId, {
                audio: fs.readFileSync(AUDIO_BAN_PATH),
                mimetype: getAudioMimetype(AUDIO_BAN_PATH),
                ptt: audioExt === '.ogg'
            });
        } else {
            console.log(
                'Audio de banimento nao encontrado em:',
                AUDIO_BAN_PATH
            );
        }
    } catch (error) {
        console.error('Erro ao anunciar banimento:', error);
    }
}
`;

    const pattern = /function\s+getMentionNumber\s*\([\s\S]*?async\s+function\s+anunciarBanimento\s*\([\s\S]*?\n\}\s*(?=\nasync\s+function\s+resendDeletedMedia)/;

    if (pattern.test(code)) {
        code = code.replace(pattern, newBlock.trimEnd());
        return;
    }

    const pattern2 = /async\s+function\s+anunciarBanimento\s*\([\s\S]*?\n\}\s*(?=\nasync\s+function\s+resendDeletedMedia)/;
    if (pattern2.test(code)) {
        code = code.replace(pattern2, newBlock.trimEnd());
    } else {
        console.warn('⚠️ Nao achei o bloco anunciarBanimento para trocar automaticamente.');
    }
}

function cleanDuplicatedMuteComment() {
    code = code.replace(
        /(\/\/ ======================================\n\s*\/\/ USUÁRIO MUTADO\n\s*\/\/ ======================================\n\s*){2,}/g,
        '// ======================================\n                    // USUÁRIO MUTADO\n                    // ======================================\n'
    );
}

backupFile();
addBrowsersImport();
replaceBrowserOption();
replaceBanAnnouncement();
cleanDuplicatedMuteComment();

if (code === original) {
    console.log('⚠️ Nenhuma mudanca aplicada. Talvez o index.js ja esteja corrigido ou esteja diferente do esperado.');
} else {
    fs.writeFileSync(targetPath, code, 'utf8');
    console.log('✅ index.js corrigido com sucesso:', targetPath);
    console.log('Agora rode: node -c index.js');
}
