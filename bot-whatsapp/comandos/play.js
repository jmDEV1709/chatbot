const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const COOKIES_PATH = path.join(__dirname, '..', 'cookies.txt');
const YTDLP_BIN = process.env.YTDLP_PATH || 'yt-dlp';

function isUrl(str) {
    return /^https?:\/\//i.test(str);
}

function runYtDlp(args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(YTDLP_BIN, args);
        let stderr = '';
        proc.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });
        proc.on('error', (error) => {
            reject(new Error(`Não foi possível executar o yt-dlp. Verifique se ele está instalado e no PATH. (${error.message})`));
        });
        proc.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`yt-dlp encerrou com código ${code}. Detalhes: ${stderr.slice(-500)}`));
            }
        });
    });
}

module.exports = async function play({ args, sock, message }) {
    const remoteJid = message.key.remoteJid;
    const query = args.join(' ').trim();

    if (!query) {
        return '❗ Uso: ,play <nome da música ou link do YouTube>';
    }

    const target = isUrl(query) ? query : `ytsearch1:${query}`;

    // Pasta temporária isolada por execução, pra evitar conflito entre pedidos simultâneos
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'play-'));
    const outputTemplate = path.join(tmpDir, '%(title)s.%(ext)s');

    try {
        await sock.sendMessage(remoteJid, { text: '🔎 Buscando e baixando o áudio, aguenta aí...' }, { quoted: message });

        const ytArgs = [
            target,
            '-x', // extrai só o áudio
            '--audio-format', 'mp3',
            '--audio-quality', '0',
            '--no-playlist',
            '-o', outputTemplate,
            '--no-progress',
        ];

        if (fs.existsSync(COOKIES_PATH)) {
            ytArgs.push('--cookies', COOKIES_PATH);
        }

        await runYtDlp(ytArgs);

        const files = fs.readdirSync(tmpDir).filter((f) => f.endsWith('.mp3'));
        if (files.length === 0) {
            throw new Error('Download concluído, mas nenhum arquivo mp3 foi encontrado.');
        }

        const filePath = path.join(tmpDir, files[0]);
        const buffer = fs.readFileSync(filePath);

        await sock.sendMessage(
            remoteJid,
            {
                audio: buffer,
                mimetype: 'audio/mpeg',
                ptt: false,
            },
            { quoted: message }
        );

        return null;
    } catch (error) {
        console.error('Erro no comando play:', error);
        return `❌ Não consegui baixar o áudio. ${error.message}`;
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
};
