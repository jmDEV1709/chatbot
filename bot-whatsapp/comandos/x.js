const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const MAX_VIDEO_SIZE = 60 * 1024 * 1024;

function isValidXUrl(value) {
    try {
        const url = new URL(value);

        const allowedHosts = [
            'x.com',
            'www.x.com',
            'twitter.com',
            'www.twitter.com',
            'mobile.twitter.com'
        ];

        const validHost = allowedHosts.includes(
            url.hostname.toLowerCase()
        );

        const validPath = /\/status\/\d+/i.test(url.pathname);

        return validHost && validPath;
    } catch {
        return false;
    }
}

function runYtDlp(args) {
    return new Promise((resolve, reject) => {
        const process = spawn(
            '/usr/local/bin/yt-dlp',
            args,
            {
                stdio: [
                    'ignore',
                    'pipe',
                    'pipe'
                ]
            }
        );

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', chunk => {
            stdout += chunk.toString();
        });

        process.stderr.on('data', chunk => {
            stderr += chunk.toString();
        });

        process.on('error', error => {
            reject(
                new Error(
                    `Não consegui executar o yt-dlp: ${error.message}`
                )
            );
        });

        process.on('close', code => {
            if (code !== 0) {
                const details =
                    stderr.trim() ||
                    stdout.trim() ||
                    'Erro desconhecido.';

                reject(
                    new Error(
                        `yt-dlp encerrou com código ${code}. ` +
                        `Detalhes: ${details}`
                    )
                );

                return;
            }

            resolve({
                stdout,
                stderr
            });
        });
    });
}

function findDownloadedVideo(directory, prefix) {
    const supportedExtensions = [
        '.mp4',
        '.mkv',
        '.webm',
        '.mov'
    ];

    const files = fs.readdirSync(directory)
        .filter(file => file.startsWith(prefix))
        .filter(file =>
            supportedExtensions.includes(
                path.extname(file).toLowerCase()
            )
        )
        .map(file => path.join(directory, file))
        .sort((first, second) => {
            return (
                fs.statSync(second).mtimeMs -
                fs.statSync(first).mtimeMs
            );
        });

    return files[0] || null;
}

function deleteTemporaryFiles(directory, prefix) {
    try {
        const files = fs.readdirSync(directory);

        for (const file of files) {
            if (!file.startsWith(prefix)) {
                continue;
            }

            const filePath = path.join(directory, file);

            try {
                fs.unlinkSync(filePath);
            } catch (error) {
                console.error(
                    'Não consegui apagar arquivo temporário:',
                    filePath,
                    error.message
                );
            }
        }
    } catch (error) {
        console.error(
            'Erro ao limpar arquivos temporários do X:',
            error.message
        );
    }
}

module.exports = async ({ args, message, sock }) => {
    const remoteJid = message.key.remoteJid;

    const link = args?.[0]?.trim();

    if (!link) {
        return (
            '❌ Envie o link do vídeo do X.\n\n' +
            'Exemplo:\n' +
            ',x https://x.com/usuario/status/123456789'
        );
    }

    if (!isValidXUrl(link)) {
        return (
            '❌ Link inválido.\n\n' +
            'Use um link de publicação do X ou Twitter:\n' +
            'https://x.com/usuario/status/...'
        );
    }

    const prefix =
        `jm-x-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

    const tempDirectory = os.tmpdir();

    const outputTemplate = path.join(
        tempDirectory,
        `${prefix}.%(ext)s`
    );

    try {
        await sock.sendMessage(
            remoteJid,
            {
                text:
                    '⏳ Baixando o vídeo do X. Aguarde...'
            },
            {
                quoted: message
            }
        );

        const ytDlpArgs = [
            '--no-playlist',
            '--no-warnings',
            '--restrict-filenames',

            '--format',
            'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best',

            '--merge-output-format',
            'mp4',

            '--ffmpeg-location',
            '/usr/bin',

            '--max-filesize',
            '60M',

            '--output',
            outputTemplate,

            link
        ];

        await runYtDlp(ytDlpArgs);

        const videoPath = findDownloadedVideo(
            tempDirectory,
            prefix
        );

        if (!videoPath) {
            throw new Error(
                'O download terminou, mas nenhum vídeo foi encontrado.'
            );
        }

        const fileStats = fs.statSync(videoPath);

        if (fileStats.size === 0) {
            throw new Error(
                'O arquivo baixado está vazio.'
            );
        }

        if (fileStats.size > MAX_VIDEO_SIZE) {
            throw new Error(
                'O vídeo ultrapassou o limite de 60 MB definido no bot.'
            );
        }

        const videoBuffer = fs.readFileSync(videoPath);

        await sock.sendMessage(
            remoteJid,
            {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption:
                    '🐦 *Vídeo baixado do X*\n' +
                    '🤖 JM Bot'
            },
            {
                quoted: message
            }
        );

        return null;
    } catch (error) {
        console.error(
            'Erro no comando X:',
            error
        );

        let details = error.message || 'Erro desconhecido.';

        if (details.length > 700) {
            details = `${details.slice(0, 700)}...`;
        }

        if (
            /login|sign in|cookies|authentication/i.test(
                details
            )
        ) {
            return (
                '❌ O X exigiu autenticação para acessar esse vídeo.\n\n' +
                'A publicação pode ser privada, restrita ou exigir login.'
            );
        }

        if (
            /no video|unsupported|not contain/i.test(
                details
            )
        ) {
            return (
                '❌ Não encontrei vídeo nessa publicação do X.\n\n' +
                'Confirme se o link possui um vídeo reproduzível.'
            );
        }

        if (
            /max-filesize|larger than|max file/i.test(
                details
            )
        ) {
            return (
                '❌ O vídeo é maior que o limite permitido pelo bot.'
            );
        }

        return (
            '❌ Não consegui baixar o vídeo do X.\n\n' +
            `Detalhes: ${details}`
        );
    } finally {
        deleteTemporaryFiles(
            tempDirectory,
            prefix
        );
    }
};