const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const ytSearch = require('yt-search');

const execFileAsync = promisify(execFile);
const TEMP_MEDIA_DIR = path.join(__dirname, '..', 'media', 'temp');
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
const COOKIES_FILE = path.join(__dirname, '..', 'cookies.txt');

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

function inferMimeType(filePath) {
    if (filePath.endsWith('.webm')) {
        return 'audio/webm';
    }

    return 'audio/mp4';
}

async function downloadYouTubeAudio(url, outputBasePath) {
    const args = [
        '--no-playlist',
        '--no-warnings',
        '--max-filesize', '25M',
        '--format', 'bestaudio[ext=m4a]/bestaudio',
        '--output', `${outputBasePath}.%(ext)s`,
        '--print', 'after_move:filepath'
    ];

    if (fs.existsSync(COOKIES_FILE)) {
        args.push('--cookies', COOKIES_FILE);
    }

    try {
        const { stdout } = await execFileAsync('yt-dlp', [...args, url], {
            timeout: 120000,
            maxBuffer: 1024 * 1024
        });
        const filePath = stdout.trim().split('\n').pop();

        if (!filePath || !fs.existsSync(filePath)) {
            throw new Error('AUDIO_FORMAT_NOT_FOUND');
        }

        const { size } = await fs.promises.stat(filePath);
        if (size > MAX_AUDIO_SIZE) {
            await fs.promises.unlink(filePath).catch(() => {});
            throw new Error('FILE_TOO_LARGE');
        }

        return filePath;
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error('YTDLP_NOT_INSTALLED');
        }
        throw error;
    }
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

        const outputBasePath = path.join(
            TEMP_MEDIA_DIR,
            `play-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        );

        tempFilePath = await downloadYouTubeAudio(
            youtubeUrl,
            outputBasePath
        );

        await sock.sendMessage(
            remoteJid,
            {
                audio: { url: tempFilePath },
                mimetype: inferMimeType(tempFilePath),
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

        if (error.message === 'YTDLP_NOT_INSTALLED') {
            return '❌ Instale o yt-dlp na VM: sudo apt install -y yt-dlp';
        }

        return '❌ Não consegui baixar o áudio agora. Tente outro link ou outra música.';
    } finally {
        if (tempFilePath) {
            await fs.promises.unlink(tempFilePath).catch(() => {});
        }
    }
};
