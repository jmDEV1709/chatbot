const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const DOWNLOAD_TIMEOUT = 120000;

// Impede vários downloads simultâneos no mesmo grupo
const activeDownloads = new Set();

function isAllowedDomain(hostname, platform) {
    const host = hostname
        .toLowerCase()
        .replace(/^www\./, '');

    if (platform === 'instagram') {
        return (
            host === 'instagram.com' ||
            host.endsWith('.instagram.com')
        );
    }

    if (platform === 'tiktok') {
        return (
            host === 'tiktok.com' ||
            host.endsWith('.tiktok.com')
        );
    }

    return false;
}

function validateUrl(rawUrl, platform) {
    let parsedUrl;

    try {
        parsedUrl = new URL(rawUrl);
    } catch {
        throw new Error('INVALID_URL');
    }

    if (
        parsedUrl.protocol !== 'https:' &&
        parsedUrl.protocol !== 'http:'
    ) {
        throw new Error('INVALID_URL');
    }

    if (!isAllowedDomain(parsedUrl.hostname, platform)) {
        throw new Error('WRONG_PLATFORM');
    }

    return parsedUrl.toString();
}

function runYtDlp(url, outputTemplate) {
    return new Promise((resolve, reject) => {
        const args = [
            '--no-playlist',
            '--no-warnings',
            '--restrict-filenames',

            // Limite escolhido para proteger a VPS e o envio
            '--max-filesize',
            '50M',

            // Prioriza vídeo MP4/H.264 com áudio
            '-S',
            'vcodec:h264,acodec:aac,ext:mp4',

            '--merge-output-format',
            'mp4',

            '--recode-video',
            'mp4',

            '-o',
            outputTemplate,

            url
        ];

        const processYtDlp = spawn(
            'yt-dlp',
            args,
            {
                stdio: [
                    'ignore',
                    'pipe',
                    'pipe'
                ]
            }
        );

        let stderr = '';
        let stdout = '';
        let finished = false;

        const timeout = setTimeout(() => {
            if (finished) {
                return;
            }

            processYtDlp.kill('SIGKILL');
            reject(new Error('DOWNLOAD_TIMEOUT'));
        }, DOWNLOAD_TIMEOUT);

        processYtDlp.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        processYtDlp.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        processYtDlp.on('error', (error) => {
            if (finished) {
                return;
            }

            finished = true;
            clearTimeout(timeout);

            if (error.code === 'ENOENT') {
                reject(new Error('YTDLP_NOT_FOUND'));
                return;
            }

            reject(error);
        });

        processYtDlp.on('close', (code) => {
            if (finished) {
                return;
            }

            finished = true;
            clearTimeout(timeout);

            if (code === 0) {
                resolve({
                    stdout,
                    stderr
                });
                return;
            }

            const combinedOutput =
                `${stdout}\n${stderr}`.toLowerCase();

            if (
                combinedOutput.includes(
                    'file is larger than max-filesize'
                ) ||
                combinedOutput.includes(
                    'larger than max-filesize'
                )
            ) {
                reject(new Error('FILE_TOO_LARGE'));
                return;
            }

            if (
                combinedOutput.includes('login required') ||
                combinedOutput.includes(
                    'not available without logging in'
                ) ||
                combinedOutput.includes(
                    'requested content is not available'
                )
            ) {
                reject(new Error('PRIVATE_OR_UNAVAILABLE'));
                return;
            }

            console.error(
                'Erro completo do yt-dlp:',
                stderr || stdout
            );

            reject(new Error('YTDLP_ERROR'));
        });
    });
}

function findDownloadedVideo(directory) {
    const files = fs.readdirSync(directory);

    const videoFile = files.find((file) => {
        const extension = path
            .extname(file)
            .toLowerCase();

        return [
            '.mp4',
            '.mov',
            '.mkv',
            '.webm'
        ].includes(extension);
    });

    if (!videoFile) {
        return null;
    }

    return path.join(directory, videoFile);
}

function friendlyError(error, platformName) {
    switch (error.message) {
        case 'INVALID_URL':
            return '❌ O link enviado não é válido.';

        case 'WRONG_PLATFORM':
            return (
                `❌ Esse link não pertence ao ${platformName}.`
            );

        case 'FILE_TOO_LARGE':
            return (
                '❌ O vídeo ultrapassa o limite de 50 MB.'
            );

        case 'PRIVATE_OR_UNAVAILABLE':
            return (
                '❌ O vídeo está privado, indisponível ou ' +
                'exige login.'
            );

        case 'DOWNLOAD_TIMEOUT':
            return (
                '❌ O download demorou demais e foi cancelado.'
            );

        case 'YTDLP_NOT_FOUND':
            return (
                '❌ O yt-dlp não está instalado ou não foi ' +
                'encontrado na VPS.'
            );

        default:
            return (
                `❌ Não consegui baixar o vídeo do ` +
                `${platformName}. O link pode estar ` +
                'indisponível ou o yt-dlp pode precisar ' +
                'ser atualizado.'
            );
    }
}

async function downloadSocialVideo({
    url,
    platform,
    platformName,
    message,
    sock
}) {
    const remoteJid = message.key.remoteJid;

    if (activeDownloads.has(remoteJid)) {
        return (
            '⚠️ Já existe um download em andamento neste grupo. ' +
            'Aguarde ele terminar.'
        );
    }

    let temporaryDirectory;

    try {
        const validUrl = validateUrl(
            url,
            platform
        );

        activeDownloads.add(remoteJid);

        await sock.sendMessage(
            remoteJid,
            {
                text:
                    `⏳ Baixando vídeo do ${platformName}...`
            },
            {
                quoted: message
            }
        );

        temporaryDirectory = fs.mkdtempSync(
            path.join(
                os.tmpdir(),
                `${platform}-`
            )
        );

        const outputTemplate = path.join(
            temporaryDirectory,
            'video.%(ext)s'
        );

        await runYtDlp(
            validUrl,
            outputTemplate
        );

        const videoPath =
            findDownloadedVideo(
                temporaryDirectory
            );

        if (!videoPath) {
            throw new Error('VIDEO_NOT_FOUND');
        }

        const stats = fs.statSync(videoPath);

        if (stats.size > MAX_FILE_SIZE) {
            throw new Error('FILE_TOO_LARGE');
        }

        const videoBuffer =
            fs.readFileSync(videoPath);

        await sock.sendMessage(
            remoteJid,
            {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption:
                    `✅ Vídeo baixado do ${platformName}`
            },
            {
                quoted: message
            }
        );

        return null;
    } catch (error) {
        console.error(
            `Erro no download do ${platformName}:`,
            error
        );

        return friendlyError(
            error,
            platformName
        );
    } finally {
        activeDownloads.delete(remoteJid);

        if (temporaryDirectory) {
            try {
                fs.rmSync(
                    temporaryDirectory,
                    {
                        recursive: true,
                        force: true
                    }
                );
            } catch (cleanupError) {
                console.error(
                    'Erro ao apagar arquivos temporários:',
                    cleanupError
                );
            }
        }
    }
}

module.exports = {
    downloadSocialVideo
};