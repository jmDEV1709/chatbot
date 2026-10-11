const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const ytdl = require('@distube/ytdl-core');
const ytSearch = require('yt-search');

const TEMP_MEDIA_DIR = path.join(__dirname, '..', 'media', 'temp');
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

function isUrl(str) {
    return /^https?:\/\//i.test(str);
}

async function resolveYouTubeUrl(query) {
    if (isUrl(query)) {
        return query;
    }

    const result = await ytSearch(query);
    const firstVideo = result.videos?.[0];

    if (!firstVideo?.url) {
        throw new Error('SEARCH_NO_RESULTS');
    }

    return firstVideo.url;
}

async function ensureTempDir() {
    await fs.promises.mkdir(TEMP_MEDIA_DIR, { recursive: true });
}

async function downloadYouTubeAudio(url, outputPath) {
    const info = await ytdl.getInfo(url);

    const format = ytdl.chooseFormat(info.formats, {
        quality: 'highestaudio',
        filter: 'audioonly'
    });

    if (!format?.url) {
        throw new Error('AUDIO_FORMAT_NOT_FOUND');
    }

    const contentLength = Number(format.contentLength || 0);

    if (contentLength && contentLength > MAX_AUDIO_SIZE) {
        throw new Error('FILE_TOO_LARGE');
    }

    const audioStream = ytdl.downloadFromInfo(info, {
        format,
        highWaterMark: 1 << 20
    });

    let downloadedSize = 0;

    audioStream.on('data', (chunk) => {
        downloadedSize += chunk.length;

        if (downloadedSize > MAX_AUDIO_SIZE) {
            audioStream.destroy(new Error('FILE_TOO_LARGE'));
        }
    });

    await pipeline(
        audioStream,
        fs.createWriteStream(outputPath)
    );
}

module.exports = async function play({ args, sock, message }) {
    const remoteJid = message.key.remoteJid;
    const query = args.join(' ').trim();

    if (!query) {
        return '❗ Uso: ,play <nome da música ou link do YouTube>';
    }

    let tempFilePath;

    try {
        await sock.sendMessage(
            remoteJid,
            {
                text: '🔎 Buscando e baixando o áudio, aguenta aí...'
            },
            { quoted: message }
        );

        const youtubeUrl = await resolveYouTubeUrl(query);

        await ensureTempDir();

        tempFilePath = path.join(
            TEMP_MEDIA_DIR,
            `play-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.m4a`
        );

        await downloadYouTubeAudio(youtubeUrl, tempFilePath);

        await sock.sendMessage(
            remoteJid,
            {
                audio: { url: tempFilePath },
                mimetype: 'audio/mp4',
                ptt: false
            },
            { quoted: message }
        );

        await fs.promises.unlink(tempFilePath);
        tempFilePath = null;

        return null;
    } catch (error) {
        console.error('Erro no comando play:', error);

        if (error.message === 'SEARCH_NO_RESULTS') {
            return '❌ Não encontrei resultados para essa busca no YouTube.';
        }

        if (error.message === 'FILE_TOO_LARGE') {
            return '❌ O áudio ultrapassa o limite de 25 MB do bot.';
        }

        if (error.message === 'AUDIO_FORMAT_NOT_FOUND') {
            return '❌ Não encontrei um formato de áudio compatível para esse vídeo.';
        }

        return '❌ Não consegui baixar o áudio agora. Tente outro link ou outra música.';
    } finally {
        if (tempFilePath) {
            await fs.promises.unlink(tempFilePath).catch(() => {});
        }
    }
};
