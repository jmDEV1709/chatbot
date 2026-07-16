require('dotenv').config();

process.on('unhandledRejection', (reason) => {
    console.error(
        'Erro não tratado (unhandledRejection):',
        reason
    );
});

process.on('uncaughtException', (error) => {
    console.error(
        'Erro não tratado (uncaughtException):',
        error
    );
});

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    downloadMediaMessage
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');

const { prefix } = require('./config');

const {
    isMuted
} = require('./utils/mutedStore');

const {
    saveMessage,
    getMessage
} = require('./utils/messageStore');

const {
    isAntideleteOn
} = require('./utils/antideleteStore');

const {
    isCastigado
} = require('./utils/castigoStore');

const {
    bloquearSecretamente,
    desbloquearSecretamente,
    isBloqueadoSecretamente
} = require('./utils/bloqueioSecretoStore');


const {
    adicionarPunicao,
    removerPunido
} = require('./utils/punicaoStore');


const { isProtectedUser } = require('./utils/protectedUsers');


// ==========================================================
// IMPORTAÇÃO DOS COMANDOS
// ==========================================================
const insta = require('./comandos/insta');
const tk = require('./comandos/tk');
const menu = require('./comandos/menu');
const tarot = require('./comandos/tarot');
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

const {
    coop,
    eu1,
    eu2
} = require('./comandos/coop');

const cantada = require('./comandos/cantada');

const castigar = require('./comandos/castigar');
const descastigar = require('./comandos/descastigar');

const quando = require('./comandos/quando');


// ==========================================================
// REGISTRO DOS COMANDOS
// ==========================================================

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
    eu2,

    cantadas: cantada,
    cantada,

    castigar,
    descastigar,

    quando,
    tarot,
    insta,
    tk
};


// ==========================================================
// COMANDOS EXCLUSIVOS DE ADMINISTRADORES
// ==========================================================

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
    'antidelete',
    'castigar',
    'descastigar'
];


// ==========================================================
// VARIÁVEIS DE CONTROLE
// ==========================================================

let sock;
let isStarting = false;
let reconnectTimer;
let processLockAcquired = false;

const lockFilePath = './database/bot.lock';


// ==========================================================
// TRAVA PARA EVITAR DUAS INSTÂNCIAS DO BOT
// ==========================================================

function acquireProcessLock() {
    if (processLockAcquired) {
        return;
    }

    fs.mkdirSync(
        './database',
        {
            recursive: true
        }
    );

    if (fs.existsSync(lockFilePath)) {
        const lockData = fs.readFileSync(
            lockFilePath,
            'utf8'
        );

        const lockPid = Number(
            lockData.trim()
        );

        if (Number.isFinite(lockPid)) {
            try {
                process.kill(lockPid, 0);

                throw new Error(
                    'Já existe outra instância do bot ' +
                    'em execução. Feche o processo anterior ' +
                    `antes de iniciar outra vez. (lock: ${lockPid})`
                );
            } catch (error) {
                if (error.code !== 'ESRCH') {
                    throw new Error(
                        'Já existe outra instância do bot ' +
                        'em execução. Feche o processo anterior ' +
                        `antes de iniciar outra vez. (lock: ${lockPid})`
                    );
                }

                fs.unlinkSync(lockFilePath);
            }
        } else {
            fs.unlinkSync(lockFilePath);
        }
    }

    fs.writeFileSync(
        lockFilePath,
        `${process.pid}\n`,
        'utf8'
    );

    processLockAcquired = true;

    const releaseLock = () => {
        try {
            if (fs.existsSync(lockFilePath)) {
                fs.unlinkSync(lockFilePath);
            }
        } catch (error) {
            console.error(
                'Não foi possível remover o lock do bot:',
                error
            );
        }
    };

    process.on(
        'exit',
        releaseLock
    );

    process.on(
        'SIGINT',
        () => {
            releaseLock();
            process.exit(0);
        }
    );

    process.on(
        'SIGTERM',
        () => {
            releaseLock();
            process.exit(0);
        }
    );
}


// ==========================================================
// CONTROLE DE RECONEXÃO
// ==========================================================

function shouldReconnectConnection(lastDisconnect) {
    const statusCode =
        lastDisconnect
            ?.error
            ?.output
            ?.statusCode;

    const errorMessage = (
        `${lastDisconnect?.error?.message || ''} ` +
        `${lastDisconnect?.error?.output?.payload?.message || ''}`
    ).toLowerCase();

    if (
        errorMessage.includes('conflict') ||
        errorMessage.includes('replaced')
    ) {
        return false;
    }

    return statusCode !== DisconnectReason.loggedOut;
}


// ==========================================================
// DESEMPACOTA MENSAGENS TEMPORÁRIAS E VISUALIZAÇÃO ÚNICA
// ==========================================================

function unwrapMessageContent(content) {
    let current = content;

    while (current) {
        if (current.ephemeralMessage?.message) {
            current =
                current.ephemeralMessage.message;

            continue;
        }

        if (current.viewOnceMessage?.message) {
            current =
                current.viewOnceMessage.message;

            continue;
        }

        if (current.viewOnceMessageV2?.message) {
            current =
                current.viewOnceMessageV2.message;

            continue;
        }

        if (
            current
                .viewOnceMessageV2Extension
                ?.message
        ) {
            current =
                current
                    .viewOnceMessageV2Extension
                    .message;

            continue;
        }

        if (
            current
                .documentWithCaptionMessage
                ?.message
        ) {
            current =
                current
                    .documentWithCaptionMessage
                    .message;

            continue;
        }

        break;
    }

    return current || {};
}


// ==========================================================
// EXTRAI TEXTO DA MENSAGEM
// ==========================================================

function getMessageText(messageContent) {
    const message =
        unwrapMessageContent(messageContent);

    return (
        message?.conversation ||
        message?.extendedTextMessage?.text ||
        message?.imageMessage?.caption ||
        message?.videoMessage?.caption ||
        message?.documentMessage?.caption ||
        ''
    );
}


// ==========================================================
// IDENTIFICA O TIPO DE MÍDIA
// ==========================================================

function getMediaData(messageContent) {
    const message =
        unwrapMessageContent(messageContent);

    if (message.imageMessage) {
        return {
            type: 'image',

            mimetype:
                message.imageMessage.mimetype ||
                'image/jpeg',

            caption:
                message.imageMessage.caption ||
                ''
        };
    }

    if (message.videoMessage) {
        return {
            type: 'video',

            mimetype:
                message.videoMessage.mimetype ||
                'video/mp4',

            caption:
                message.videoMessage.caption ||
                '',

            gifPlayback:
                Boolean(
                    message
                        .videoMessage
                        .gifPlayback
                )
        };
    }

    if (message.audioMessage) {
        return {
            type: 'audio',

            mimetype:
                message.audioMessage.mimetype ||
                'audio/ogg; codecs=opus',

            ptt:
                Boolean(
                    message
                        .audioMessage
                        .ptt
                )
        };
    }

    if (message.stickerMessage) {
        return {
            type: 'sticker',

            mimetype:
                message.stickerMessage.mimetype ||
                'image/webp'
        };
    }

    if (message.documentMessage) {
        return {
            type: 'document',

            mimetype:
                message.documentMessage.mimetype ||
                'application/octet-stream',

            fileName:
                message.documentMessage.fileName ||
                'arquivo'
        };
    }

    return null;
}


// ==========================================================
// HELPERS PARA IDs @LID E @S.WHATSAPP.NET
// ==========================================================

function idCandidates(...ids) {
    const set = new Set();

    for (const id of ids) {
        if (!id) {
            continue;
        }

        const original = String(id);

        const withoutDevice =
            original.split(':')[0];

        const withoutDomain =
            withoutDevice.split('@')[0];

        set.add(original);
        set.add(withoutDevice);
        set.add(withoutDomain);
    }

    return set;
}


function sameParticipant(firstId, secondId) {
    if (!firstId || !secondId) {
        return false;
    }

    const firstCandidates =
        idCandidates(firstId);

    const secondCandidates =
        idCandidates(secondId);

    for (
        const candidate of firstCandidates
    ) {
        if (
            secondCandidates.has(candidate)
        ) {
            return true;
        }
    }

    return false;
}


function sameAnyParticipant(
    firstIds,
    secondIds
) {
    for (const firstId of firstIds) {
        for (const secondId of secondIds) {
            if (
                sameParticipant(
                    firstId,
                    secondId
                )
            ) {
                return true;
            }
        }
    }

    return false;
}


function participantMatches(
    participant,
    senderSet
) {
    const participantSet =
        idCandidates(
            participant?.id,
            participant?.jid,
            participant?.lid,
            participant?.phoneNumber
        );

    for (
        const value of participantSet
    ) {
        if (senderSet.has(value)) {
            return true;
        }
    }

    return false;
}


function getIsAdmin(participant) {
    return (
        participant?.admin === 'admin' ||
        participant?.admin === 'superadmin'
    );
}


// ==========================================================
// ENVIA A MÍDIA RECUPERADA
// ==========================================================
// ==========================================================
// AVISO DE BANIMENTO
// ==========================================================
const AUDIO_BAN_PATH = path.join(__dirname, 'media', 'banimento.mpeg');

function getAudioMimetype(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.ogg') {
        return 'audio/ogg; codecs=opus';
    }

    if (ext === '.mp3' || ext === '.mpeg') {
        return 'audio/mpeg';
    }

    if (ext === '.m4a' || ext === '.mp4') {
        return 'audio/mp4';
    }

    return 'audio/mpeg';
}

function getMentionNumber(jid) {
    return String(jid || '')
        .split('@')[0]
        .split(':')[0];
}

async function anunciarBanimento(groupId, participant) {
    try {
        const number = getMentionNumber(participant);

        await sock.sendMessage(groupId, {
            text: `🚫 @${number} foi banido do grupo.`,
            mentions: [participant]
        });

        if (fs.existsSync(AUDIO_BAN_PATH)) {
            await sock.sendMessage(groupId, {
                audio: fs.readFileSync(AUDIO_BAN_PATH),
                mimetype: getAudioMimetype(AUDIO_BAN_PATH),
                ptt: true
            });
        } else {
            console.log(
                'Áudio de banimento não encontrado em:',
                AUDIO_BAN_PATH
            );
        }
    } catch (error) {
        console.error('Erro ao anunciar banimento:', error);
    }
}

async function resendDeletedMedia(
    remoteJid,
    media,
    quotedMessage
) {
    if (
        !media?.buffer ||
        !Buffer.isBuffer(media.buffer) ||
        media.buffer.length === 0
    ) {
        return;
    }

    const options = quotedMessage
        ? {
            quoted: quotedMessage
        }
        : {};

    if (media.type === 'image') {
        await sock.sendMessage(
            remoteJid,
            {
                image: media.buffer,

                caption:
                    media.caption ||
                    '🖼️ Imagem apagada'
            },
            options
        );

        return;
    }

    if (media.type === 'video') {
        await sock.sendMessage(
            remoteJid,
            {
                video: media.buffer,

                caption:
                    media.caption ||
                    '🎥 Vídeo apagado',

                gifPlayback:
                    Boolean(media.gifPlayback)
            },
            options
        );

        return;
    }

    if (media.type === 'audio') {
        await sock.sendMessage(
            remoteJid,
            {
                audio: media.buffer,

                mimetype:
                    media.mimetype ||
                    'audio/ogg; codecs=opus',

                ptt:
                    Boolean(media.ptt)
            },
            options
        );

        return;
    }

    if (media.type === 'sticker') {
        await sock.sendMessage(
            remoteJid,
            {
                sticker: media.buffer
            },
            options
        );

        return;
    }

    if (media.type === 'document') {
        await sock.sendMessage(
            remoteJid,
            {
                document: media.buffer,

                mimetype:
                    media.mimetype ||
                    'application/octet-stream',

                fileName:
                    media.fileName ||
                    'arquivo'
            },
            options
        );
    }
}


// ==========================================================
// INICIA O BOT
// ==========================================================

async function startBot() {
    if (isStarting) {
        return;
    }

    isStarting = true;

    if (
        process.argv.includes(
            '--reset-auth'
        )
    ) {
        fs.rmSync(
            './database/auth',
            {
                recursive: true,
                force: true
            }
        );

        console.log(
            'Sessão antiga removida. ' +
            'O bot vai gerar um QR novo.'
        );
    }

    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(
        './database/auth'
    );

    sock = makeWASocket({
        auth: state,

        browser: [
            'Bot WhatsApp',
            'Chrome',
            '1.0.0'
        ]
    });

    sock.ev.on(
        'creds.update',
        saveCreds
    );


    // ======================================================
    // CONEXÃO
    // ======================================================

    sock.ev.on(
        'connection.update',
        (update) => {
            const {
                connection,
                lastDisconnect,
                qr
            } = update;

            if (qr) {
                console.log(
                    'Escaneie o QR Code abaixo ' +
                    'para conectar o bot:'
                );

                qrcode.generate(
                    qr,
                    {
                        small: true
                    }
                );
            }

            if (connection === 'open') {
                console.log(
                    'Conectado ao WhatsApp'
                );

                isStarting = false;

                return;
            }

            if (connection === 'close') {
                isStarting = false;

                const shouldReconnect =
                    shouldReconnectConnection(
                        lastDisconnect
                    );

                console.log(
                    'Conexão encerrada. Reconectando?',
                    shouldReconnect
                );

                if (!shouldReconnect) {
                    console.error(
                        'A sessão foi encerrada por conflito. ' +
                        'Feche outras sessões do WhatsApp Web ' +
                        'ou Desktop no mesmo número e inicie ' +
                        'o bot novamente.'
                    );

                    return;
                }

                clearTimeout(reconnectTimer);

                reconnectTimer =
                    setTimeout(
                        () => {
                            startBot().catch(
                                (error) => {
                                    console.error(
                                        'Erro ao reconectar:',
                                        error
                                    );
                                }
                            );
                        },
                        3000
                    );
            }
        }
    );

    // ======================================================
    // PARTICIPANTE REMOVIDO / BANIDO
    // ======================================================
    sock.ev.on(
        'group-participants.update',
        async (event) => {
            try {
                const groupId = event.id;
                const action = event.action;
                const participants = event.participants || [];

                if (!groupId || action !== 'remove') {
                    return;
                }

                for (const participant of participants) {
                    await anunciarBanimento(groupId, participant);
                }
            } catch (error) {
                console.error(
                    'Erro no evento de participante removido:',
                    error
                );
            }
        }
    );
    // ======================================================
    // RECEBIMENTO DE MENSAGENS
    // ======================================================

    sock.ev.on(
        'messages.upsert',
        async ({ messages }) => {
            for (const message of messages || []) {
                try {
                    if (!message?.message) {
                        continue;
                    }

                    const remoteJid =
                        message.key.remoteJid;

                    const isGroup =
                        remoteJid?.endsWith(
                            '@g.us'
                        );

                    if (!remoteJid) {
                        continue;
                    }


                    // ======================================
                    // ANTI-DELETE
                    // ======================================

                    const protocolMsg =
                        message
                            .message
                            ?.protocolMessage;

                    const isRevoke =
                        protocolMsg &&
                        (
                            protocolMsg.type ===
                            'REVOKE' ||
                            protocolMsg.type === 0
                        );

                    if (isRevoke) {
                        const deletedId =
                            protocolMsg.key?.id;

                        const original =
                            getMessage(deletedId);

                        if (
                            original &&
                            isGroup &&
                            isAntideleteOn(
                                remoteJid
                            )
                        ) {
                            try {
                                const deleteActorIds = [
                                    message.key.participant,
                                    message.key.participantAlt,
                                    message.participant
                                ].filter(Boolean);

                                const originalAuthorIds = [
                                    original.participant,
                                    original.participantAlt,
                                    protocolMsg
                                        .key
                                        ?.participant
                                ].filter(Boolean);

                                const originalAuthor =
                                    original.participantAlt ||
                                    original.participant ||
                                    protocolMsg
                                        .key
                                        ?.participant;

                                const deletedOwnMessage =
                                    sameAnyParticipant(
                                        deleteActorIds,
                                        originalAuthorIds
                                    );

                                const authorNumber =
                                    String(
                                        originalAuthor ||
                                        'alguém'
                                    )
                                        .split(':')[0]
                                        .split('@')[0];

                                let aviso =
                                    '🕵️ *Anti-delete*\n\n';

                                if (originalAuthor) {
                                    aviso +=
                                        `@${authorNumber} ` +
                                        'apagou uma mensagem:\n\n';
                                } else {
                                    aviso +=
                                        'Uma mensagem foi ' +
                                        'apagada:\n\n';
                                }

                                if (original.text) {
                                    aviso +=
                                        `💬 ${original.text}`;
                                } else if (
                                    original.media
                                ) {
                                    const mediaNames = {
                                        image:
                                            'uma imagem',

                                        video:
                                            'um vídeo',

                                        audio:
                                            'um áudio',

                                        sticker:
                                            'uma figurinha',

                                        document:
                                            'um documento'
                                    };

                                    aviso +=
                                        '📎 Conteúdo apagado: ' +
                                        (
                                            mediaNames[
                                            original
                                                .media
                                                .type
                                            ] ||
                                            'uma mídia'
                                        );
                                } else {
                                    aviso +=
                                        '📎 Não consegui recuperar ' +
                                        'o conteúdo apagado.';
                                }


                                // ==========================
                                // PUNIÇÃO AUTOMÁTICA
                                // ==========================

                                if (
                                    deletedOwnMessage &&
                                    originalAuthor &&
                                    isProtectedUser(
                                        originalAuthor,
                                        original.participant,
                                        original.participantAlt,
                                        protocolMsg.key?.participant
                                    )
                                ) {
                                    aviso +=
                                        '\n\n🛡️ *Tenta de novo*\n' +
                                        'Ta achando que vai punir quem ta no controle?.';
                                } else if (
                                    deletedOwnMessage &&
                                    originalAuthor
                                ) {
                                    const totalPunicoes =
                                        adicionarPunicao(
                                            originalAuthor
                                        );

                                    if (
                                        totalPunicoes >= 3
                                    ) {
                                        try {
                                            await sock
                                                .groupParticipantsUpdate(
                                                    remoteJid,
                                                    [
                                                        originalAuthor
                                                    ],
                                                    'remove'
                                                );

                                            removerPunido(
                                                originalAuthor
                                            );

                                            aviso +=
                                                '\n\n🚫 ' +
                                                '*Punição automática*\n' +
                                                'A pessoa atingiu ' +
                                                '3/3 punições e foi ' +
                                                'removida do grupo.';
                                        } catch (
                                        removeError
                                        ) {
                                            console.error(
                                                'Erro ao remover ' +
                                                'participante:',
                                                removeError
                                            );

                                            aviso +=
                                                '\n\n⚠️ ' +
                                                '*Punição automática*\n' +
                                                `Punições: ` +
                                                `${totalPunicoes}/3\n` +
                                                'Não consegui remover ' +
                                                'a pessoa. Verifique ' +
                                                'se o bot é administrador.';
                                        }
                                    } else {
                                        aviso +=
                                            '\n\n⚠️ ' +
                                            '*Punição automática*\n' +
                                            `Punições: ` +
                                            `${totalPunicoes}/3\n` +
                                            'Motivo: apagou ' +
                                            'uma mensagem.';
                                    }
                                } else {
                                    aviso +=
                                        '\n\nℹ️ Nenhuma punição ' +
                                        'foi aplicada porque ' +
                                        'a mensagem foi apagada ' +
                                        'por outra pessoa.';
                                }


                                // ==========================
                                // ENVIA O AVISO
                                // ==========================

                                await sock.sendMessage(
                                    remoteJid,
                                    {
                                        text: aviso,

                                        mentions:
                                            originalAuthor
                                                ? [
                                                    originalAuthor
                                                ]
                                                : []
                                    }
                                );


                                // ==========================
                                // DEVOLVE A MÍDIA APAGADA
                                // ==========================

                                if (original.media) {
                                    try {
                                        await resendDeletedMedia(
                                            remoteJid,
                                            original.media
                                        );
                                    } catch (
                                    resendError
                                    ) {
                                        console.error(
                                            'Erro ao devolver ' +
                                            'mídia apagada:',
                                            resendError
                                        );

                                        await sock.sendMessage(
                                            remoteJid,
                                            {
                                                text:
                                                    '❌ O conteúdo foi ' +
                                                    'identificado, mas ' +
                                                    'não consegui reenviar ' +
                                                    'a mídia apagada.'
                                            }
                                        );
                                    }
                                }
                            } catch (
                            antiDeleteError
                            ) {
                                console.error(
                                    'Erro no anti-delete:',
                                    antiDeleteError
                                );
                            }
                        }

                        continue;
                    }


                    // ======================================
                    // GUARDA TEXTO E BAIXA MÍDIAS
                    // ======================================

                    if (!message.key.fromMe) {
                        const texto =
                            getMessageText(
                                message.message
                            );

                        const registro = {
                            participant:
                                message
                                    .key
                                    .participant ||
                                message.participant ||
                                remoteJid,

                            participantAlt:
                                message
                                    .key
                                    .participantAlt ||
                                null,

                            text:
                                texto || '',

                            media: null
                        };

                        const mediaData =
                            getMediaData(
                                message.message
                            );

                        if (mediaData) {
                            try {
                                const mediaBuffer =
                                    await downloadMediaMessage(
                                        message,
                                        'buffer',
                                        {}
                                    );

                                if (
                                    Buffer.isBuffer(
                                        mediaBuffer
                                    ) &&
                                    mediaBuffer.length > 0
                                ) {
                                    registro.media = {
                                        ...mediaData,

                                        buffer:
                                            mediaBuffer
                                    };
                                }
                            } catch (
                            mediaError
                            ) {
                                console.error(
                                    'Erro ao guardar mídia ' +
                                    `do tipo ${mediaData.type}:`,
                                    mediaError
                                );
                            }
                        }

                        saveMessage(
                            message.key.id,
                            registro
                        );
                    }


                    // ======================================
                    // IGNORA MENSAGENS DO PRÓPRIO BOT
                    // ======================================

                    if (message.key.fromMe) {
                        continue;
                    }


                    // ======================================
                    // SOMENTE GRUPOS
                    // ======================================

                    if (!isGroup) {
                        continue;
                    }


                    // ======================================
                    // USUÁRIO MUTADO
                    // ======================================

                    // ======================================
                    // USUÁRIO MUTADO
                    // ======================================
                    const senderIds = [
                        message.key.participantAlt,
                        message.key.participant,
                        message.participant
                    ].filter(Boolean);

                    const senderId =
                        senderIds[0] || null;

                    const usuarioEstaMutado = senderIds.some(id =>
                        isMuted(remoteJid, id)
                    );

                    if (usuarioEstaMutado) {
                        try {
                            const participant =
                                message.key.participant ||
                                message.participant ||
                                senderId;

                            await sock.sendMessage(
                                remoteJid,
                                {
                                    delete: {
                                        remoteJid,
                                        fromMe: false,
                                        id: message.key.id,
                                        participant
                                    }
                                }
                            );
                        } catch (muteError) {
                            console.error(
                                'Erro ao apagar mensagem de usuário mutado:',
                                muteError
                            );
                        }

                        continue;
                    }


                    // ======================================
                    // IDENTIFICA O COMANDO
                    // ======================================
                    const text =
                        getMessageText(
                            message.message
                        ).trim();

                    const normalizedSecretCommand =
                        text.toLowerCase();

                    const isSecretBlockCommand =
                        normalizedSecretCommand === '$abe';

                    const isSecretUnblockCommand =
                        normalizedSecretCommand === '!isaak';


                    // ======================================
                    // COMANDOS SECRETOS DE BLOQUEIO
                    // ======================================

                    if (
                        isSecretBlockCommand ||
                        isSecretUnblockCommand
                    ) {
                        try {
                            const metadata =
                                await sock.groupMetadata(
                                    remoteJid
                                );

                            const secretSenderSet =
                                idCandidates(
                                    message.key.participant,
                                    message.key.participantAlt,
                                    message.participant
                                );

                            const secretSenderParticipant =
                                metadata.participants.find(
                                    participant =>
                                        participantMatches(
                                            participant,
                                            secretSenderSet
                                        )
                                );

                            const secretSenderIsAdmin =
                                getIsAdmin(
                                    secretSenderParticipant
                                );

                            /*
                             * Se não for administrador,
                             * ignora sem responder.
                             */
                            if (!secretSenderIsAdmin) {
                                continue;
                            }

                            /*
                             * O alvo é a pessoa cuja mensagem
                             * recebeu a resposta $abe ou !isaak.
                             */
                            const contextInfo =
                                message
                                    .message
                                    ?.extendedTextMessage
                                    ?.contextInfo;

                            const quotedMessage =
                                contextInfo?.quotedMessage;

                            const targetFromQuote =
                                contextInfo?.participant;

                            if (
                                !quotedMessage ||
                                !targetFromQuote
                            ) {
                                /*
                                 * Se não respondeu à mensagem
                                 * de alguém, fica em silêncio.
                                 */
                                continue;
                            }

                            /*
                             * Encontra o participante dentro
                             * dos metadados do grupo para obter
                             * todos os formatos de ID disponíveis.
                             */
                            const targetSet =
                                idCandidates(
                                    targetFromQuote,
                                    contextInfo?.participantAlt
                                );

                            const targetParticipant =
                                metadata.participants.find(
                                    participant =>
                                        participantMatches(
                                            participant,
                                            targetSet
                                        )
                                );

                            const targetIds = [
                                targetFromQuote,
                                contextInfo?.participantAlt,
                                targetParticipant?.id,
                                targetParticipant?.jid,
                                targetParticipant?.lid,
                                targetParticipant?.phoneNumber
                            ].filter(Boolean);


                            if (targetIds.length === 0) {
                                continue;
                            }

                            if (isSecretBlockCommand) {
                                bloquearSecretamente(
                                    remoteJid,
                                    targetIds
                                );
                            }

                            if (isSecretUnblockCommand) {
                                desbloquearSecretamente(
                                    remoteJid,
                                    targetIds
                                );
                            }
                        } catch (secretError) {
                            /*
                             * O erro fica somente no terminal.
                             * Nenhuma informação aparece no grupo.
                             */
                            console.error(
                                'Erro no comando secreto:',
                                secretError
                            );
                        }

                        /*
                         * Impede que $abe e !isaak
                         * sigam para o restante do código.
                         */
                        continue;
                    }


                    // ======================================
                    // IGNORA SECRETAMENTE O USUÁRIO BLOQUEADO
                    // ======================================

                    if (
                        text.startsWith(prefix) &&
                        isBloqueadoSecretamente(
                            remoteJid,
                            senderIds
                        )
                    ) {
                        /*
                         * Não responde, não avisa e
                         * não executa o comando.
                         */
                        continue;
                    }


                    // ======================================
                    // COMANDOS NORMAIS DO BOT
                    // ======================================

                    if (!text.startsWith(prefix)) {
                        continue;
                    }
                    const [
                        rawCommand,
                        ...args
                    ] = text
                        .slice(prefix.length)
                        .trim()
                        .split(/\s+/);

                    const command =
                        rawCommand
                            ?.toLowerCase();

                    if (!command) {
                        continue;
                    }

                    const handler =
                        commands[command];

                    if (!handler) {
                        await sock.sendMessage(
                            remoteJid,
                            {
                                text:
                                    'Comando não encontrado. ' +
                                    'Digite ,menu para ver ' +
                                    'os comandos.'
                            },
                            {
                                quoted:
                                    message
                            }
                        );

                        continue;
                    }


                    // ======================================
                    // VERIFICA CASTIGO
                    // ======================================
                    if (
                        ![
                            'castigar',
                            'descastigar'
                        ].includes(command) &&
                        isCastigado(
                            remoteJid,
                            senderIds
                        )
                    ) {
                        await sock.sendMessage(
                            remoteJid,
                            {
                                text:
                                    '🚫 Você está de castigo, ' +
                                    'repense seus atos.'
                            },
                            {
                                quoted:
                                    message
                            }
                        );

                        continue;
                    }


                    // ======================================
                    // VERIFICA ADMINISTRADORES
                    // ======================================

                    let isAdmin = false;
                    let isBotAdmin = false;

                    try {
                        const metadata =
                            await sock
                                .groupMetadata(
                                    remoteJid
                                );

                        const senderSet =
                            idCandidates(
                                message
                                    .key
                                    .participant,

                                message
                                    .key
                                    .participantAlt,

                                message.participant
                            );

                        const botSet =
                            idCandidates(
                                sock.user?.id,
                                sock.user?.lid
                            );

                        const senderParticipant =
                            metadata
                                .participants
                                .find(
                                    participant =>
                                        participantMatches(
                                            participant,
                                            senderSet
                                        )
                                );

                        const botParticipant =
                            metadata
                                .participants
                                .find(
                                    participant =>
                                        participantMatches(
                                            participant,
                                            botSet
                                        )
                                );

                        isAdmin =
                            getIsAdmin(
                                senderParticipant
                            );

                        isBotAdmin =
                            getIsAdmin(
                                botParticipant
                            );
                    } catch (
                    metadataError
                    ) {
                        console.error(
                            'Erro ao obter informações ' +
                            'do grupo:',
                            metadataError
                        );
                    }


                    // ======================================
                    // BLOQUEIA COMANDOS DE ADMIN
                    // ======================================

                    if (
                        adminOnly.includes(
                            command
                        ) &&
                        !isAdmin
                    ) {
                        await sock.sendMessage(
                            remoteJid,
                            {
                                text:
                                    '❌ Apenas administradores ' +
                                    'podem usar este comando.'
                            },
                            {
                                quoted:
                                    message
                            }
                        );

                        continue;
                    }


                    // ======================================
                    // EXECUTA O COMANDO
                    // ======================================

                    try {
                        const response =
                            await handler({
                                text,
                                args,
                                message,
                                sock,
                                isAdmin,
                                isBotAdmin
                            });

                        if (response) {
                            await sock.sendMessage(
                                remoteJid,
                                {
                                    text:
                                        response
                                },
                                {
                                    quoted:
                                        message
                                }
                            );
                        }
                    } catch (
                    commandError
                    ) {
                        console.error(
                            `Erro no comando ${command}:`,
                            commandError
                        );

                        await sock.sendMessage(
                            remoteJid,
                            {
                                text:
                                    '❌ Ocorreu um erro ao ' +
                                    'executar este comando.'
                            },
                            {
                                quoted:
                                    message
                            }
                        );
                    }
                } catch (
                messageError
                ) {
                    console.error(
                        'Erro ao processar mensagem:',
                        messageError
                    );
                }
            }
        }
    );
}


// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

acquireProcessLock();

startBot().catch((error) => {
    isStarting = false;

    console.error(
        'Erro ao iniciar o bot:',
        error
    );
});