require('dotenv').config();

process.on('unhandledRejection', (reason) => {
    console.error('Erro não tratado (unhandledRejection):', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Erro não tratado (uncaughtException):', error);
});

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const { prefix } = require('./config');
const { isMuted } = require('./utils/mutedStore');
const { saveMessage, getMessage } = require('./utils/messageStore');
const { isAntideleteOn } = require('./utils/antideleteStore');
const menu = require('./comandos/menu');
const sticker = require('./comandos/sticker');
const ia = require('./comandos/ia');
const imagem = require('./comandos/imagem');
const piada = require('./comandos/piada');
const curiosidade = require('./comandos/curiosidade');
const euNunca = require('./comandos/eununca');
const ban = require('./comandos/ban');
const promover = require('./comandos/promover');
const rebaixar = require('./comandos/rebaixar');
const abrirgrupo = require('./comandos/abrirgrupo');
const fechargrupo = require('./comandos/fechargrupo');
const mute = require('./comandos/mute');
const desmutar = require('./comandos/desmutar');
const adivinha = require('./comandos/adivinha');
const gay = require('./comandos/gay');
const pecados = require('./comandos/pecados');
const punir = require('./comandos/punir');
const listarpunidos = require('./comandos/listarpunidos');
const despunir = require('./comandos/despunir');
const antidelete = require('./comandos/antidelete');
const jogos = require('./comandos/jogos');
const tabela = require('./comandos/tabela');
const campeonatos = require('./comandos/campeonatos');
const artilharia = require('./comandos/artilharia');
const rodadas = require('./comandos/rodadas');
const statusapi = require('./comandos/statusapi');
const usoapi = require('./comandos/usoapi');
const quiz = require('./comandos/quiz');
const responder = require('./comandos/responder');
const blackjack = require('./comandos/blackjack');
const hit = require('./comandos/hit');
const stand = require('./comandos/stand');
const ship = require('./comandos/ship');
const verdade = require('./comandos/verdade');
const desafio = require('./comandos/desafio');
const vdd = require('./comandos/vdd');
const cep = require('./comandos/cep');
const ddd = require('./comandos/ddd');
const feriados = require('./comandos/feriados');
const banco = require('./comandos/banco');
const play = require('./comandos/play');
const { coop, eu1, eu2 } = require('./comandos/coop');



const commands = {
    menu,
    sticker,
    ia,
    imagem,
    piada,
    curiosidade,
    eununca: euNunca,
    brincadeira: euNunca,
    ban,
    upadm: promover,
    downadm: rebaixar,
    open: abrirgrupo,
    close: fechargrupo,
    mute,
    unmute: desmutar,
    adivinha,
    gay,
    pecados,
    punir,
    listarpunidos,
    despunir,
    antidelete,
    jogos,
    tabela,
    campeonatos,
    artilharia,
    rodadas,
    rodada: rodadas,
    statusapi,
    usoapi,
    quiz,
    responder,
    blackjack,
    hit,
    stand,
    compatibilidade: ship,
    ship,
    verdade,
    desafio,
    vdd,
    cep,
    ddd,
    feriados,
    banco,
    play,
    coop,
    eu1,
    eu2
};

// Comandos que SÓ admin pode usar
const adminOnly = [
    'ban',
    'upadm',
    'downadm',
    'open',
    'close',
    'mute',
    'unmute',
    'punir',
    'despunir',
    'listarpunidos',
    'antidelete'

];

let sock;
let isStarting = false;
let reconnectTimer;
let processLockAcquired = false;
const lockFilePath = './database/bot.lock';

function acquireProcessLock() {
    if (processLockAcquired) {
        return;
    }
    fs.mkdirSync('./database', { recursive: true });
    if (fs.existsSync(lockFilePath)) {
        const lockData = fs.readFileSync(lockFilePath, 'utf8');
        const lockPid = Number(lockData.trim());
        if (Number.isFinite(lockPid)) {
            try {
                process.kill(lockPid, 0);
                throw new Error(`Já existe outra instância do bot em execução. Feche o processo anterior antes de iniciar outra vez. (lock: ${lockPid})`);
            } catch (error) {
                if (error.code !== 'ESRCH') {
                    throw new Error(`Já existe outra instância do bot em execução. Feche o processo anterior antes de iniciar outra vez. (lock: ${lockPid})`);
                }
                fs.unlinkSync(lockFilePath);
            }
        } else {
            fs.unlinkSync(lockFilePath);
        }
    }
    fs.writeFileSync(lockFilePath, `${process.pid}\n`, 'utf8');
    processLockAcquired = true;
    const releaseLock = () => {
        try {
            if (fs.existsSync(lockFilePath)) {
                fs.unlinkSync(lockFilePath);
            }
        } catch (error) {
            console.error('Não foi possível remover o lock do bot:', error);
        }
    };
    process.on('exit', releaseLock);
    process.on('SIGINT', () => {
        releaseLock();
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        releaseLock();
        process.exit(0);
    });
}

function shouldReconnectConnection(lastDisconnect) {
    const statusCode = lastDisconnect?.error?.output?.statusCode;
    const errorMessage = `${lastDisconnect?.error?.message || ''} ${lastDisconnect?.error?.output?.payload?.message || ''}`.toLowerCase();
    if (errorMessage.includes('conflict') || errorMessage.includes('replaced')) {
        return false;
    }
    return statusCode !== DisconnectReason.loggedOut;
}

function getMessageText(message) {
    return (
        message?.conversation ||
        message?.extendedTextMessage?.text ||
        message?.imageMessage?.caption ||
        message?.videoMessage?.caption ||
        ''
    );
}

// ===== Helpers para lidar com formatos de ID (@s.whatsapp.net e @lid) =====
function idCandidates(...ids) {
    const set = new Set();
    for (const id of ids) {
        if (!id) continue;
        const base = String(id).split(':')[0];
        set.add(base);
        set.add(base.split('@')[0]);
    }
    return set;
}

function participantMatches(participant, senderSet) {
    const pSet = idCandidates(participant?.id, participant?.jid, participant?.lid);
    for (const value of pSet) {
        if (senderSet.has(value)) return true;
    }
    return false;
}

function getIsAdmin(participant) {
    return participant?.admin === 'admin' || participant?.admin === 'superadmin';
}
// =========================================================================

async function startBot() {
    if (isStarting) {
        return;
    }
    isStarting = true;
    if (process.argv.includes('--reset-auth')) {
        fs.rmSync('./database/auth', { recursive: true, force: true });
        console.log('Sessão antiga removida. O bot vai gerar um QR novo.');
    }
    const { state, saveCreds } = await useMultiFileAuthState('./database/auth');
    sock = makeWASocket({
        auth: state,
        browser: ['Bot WhatsApp', 'Chrome', '1.0.0'],
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('Escaneie o QR Code abaixo para conectar o bot:');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'open') {
            console.log('Conectado ao WhatsApp');
            isStarting = false;
            return;
        }
        if (connection === 'close') {
            isStarting = false;
            const shouldReconnect = shouldReconnectConnection(lastDisconnect);
            console.log('Conexão encerrada. Reconectando?', shouldReconnect);
            if (!shouldReconnect) {
                console.error('A sessão foi encerrada por conflito/replaced. Feche outras sessões do WhatsApp Web/Desktop no mesmo número e inicie o bot de novo.');
                return;
            }
            if (shouldReconnect) {
                clearTimeout(reconnectTimer);
                reconnectTimer = setTimeout(() => {
                    startBot().catch((error) => {
                        console.error('Erro ao reconectar o bot:', error);
                    });
                }, 3000);
            }
        }
    });
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages?.[0];
        if (!message?.message) {
            return;
        }
        const remoteJid = message.key.remoteJid;
        const isGroup = remoteJid?.endsWith('@g.us');
        // ===== ANTI-DELETE: detecta mensagem apagada e revela =====
        const protocolMsg = message.message?.protocolMessage;
        if (protocolMsg && (protocolMsg.type === 'REVOKE' || protocolMsg.type === 0)) {
            const deletedId = protocolMsg.key?.id;
            const original = getMessage(deletedId);
            if (original && isGroup && isAntideleteOn(remoteJid)) {
                try {
                    const autor = original.participant?.split('@')[0] || 'alguém';
                    const textoApagado = original.text || '';
                    let aviso = `🕵️ *Anti-delete*\n\n`;
                    aviso += `@${autor} apagou uma mensagem:\n\n`;
                    aviso += textoApagado ? `💬 ${textoApagado}` : `📎 (mídia ou mensagem sem texto)`;
                    await sock.sendMessage(remoteJid, {
                        text: aviso,
                        mentions: original.participant ? [original.participant] : []
                    });
                    if (original.mediaMessage) {
                        await sock.sendMessage(remoteJid, original.mediaMessage);
                    }
                } catch (error) {
                    console.error('Erro no anti-delete:', error);
                }
            }
            return;
        }
        // ==========================================================
        // Salva a mensagem no cache (para o anti-delete)
        if (!message.key.fromMe) {
            const texto = getMessageText(message.message);
            const registro = {
                participant: message.key.participant || remoteJid,
                text: texto
            };
            const m = message.message;
            if (m.imageMessage) {
                registro.mediaMessage = { image: m.imageMessage, caption: m.imageMessage.caption || '' };
            } else if (m.videoMessage) {
                registro.mediaMessage = { video: m.videoMessage, caption: m.videoMessage.caption || '' };
            } else if (m.stickerMessage) {
                registro.mediaMessage = { sticker: m.stickerMessage };
            } else if (m.audioMessage) {
                registro.mediaMessage = { audio: m.audioMessage, mimetype: m.audioMessage.mimetype };
            }
            saveMessage(message.key.id, registro);
        }
        if (message.key.fromMe) {
            return;
        }
        if (!isGroup) {
            return;
        }
        if (isMuted(remoteJid, message.key.participant)) {
            try {
                await sock.sendMessage(remoteJid, { delete: message.key });
            } catch (error) {
                console.error('Erro ao apagar mensagem de utilizador mutado:', error);
            }
            return;
        }
        const text = getMessageText(message.message).trim();
        if (!text.startsWith(prefix)) {
            return;
        }
        const [rawCommand, ...args] = text.slice(prefix.length).trim().split(/\s+/);
        const command = rawCommand?.toLowerCase();
        if (!command) {
            return;
        }
        const handler = commands[command];
        if (!handler) {
            await sock.sendMessage(remoteJid, { text: 'Comando não encontrado. Digite ,menu para ver os comandos.' }, { quoted: message });
            return;
        }
        // ===== Verificação de admin (usuário e bot), tolerante a LID =====
        let isAdmin = false;
        let isBotAdmin = false;
        try {
            const metadata = await sock.groupMetadata(remoteJid);
            const senderSet = idCandidates(
                message.key.participant,
                message.key.participantAlt,
                message.participant
            );
            const botSet = idCandidates(
                sock.user?.id,
                sock.user?.lid
            );
            const senderParticipant = metadata.participants.find(p => participantMatches(p, senderSet));
            const botParticipant = metadata.participants.find(p => participantMatches(p, botSet));
            isAdmin = getIsAdmin(senderParticipant);
            isBotAdmin = getIsAdmin(botParticipant);
        } catch (error) {
            console.error('Erro ao obter metadata do grupo:', error);
        }
        // ================================================================
        // Bloqueia comandos exclusivos de admin
        if (adminOnly.includes(command) && !isAdmin) {
            await sock.sendMessage(
                remoteJid,
                { text: '❌ Apenas administradores podem usar este comando.' },
                { quoted: message }
            );
            return;
        }
        const response = await handler({
            text,
            args,
            message,
            sock,
            isAdmin,
            isBotAdmin
        });
        if (response) {
            await sock.sendMessage(remoteJid, { text: response }, { quoted: message });
        }
    });
}

acquireProcessLock();
startBot().catch((error) => {
    isStarting = false;
    console.error('Erro ao iniciar o bot:', error);
});