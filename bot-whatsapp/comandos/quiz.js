const { salvarQuiz } = require('../utils/quizStore');

const perguntas = [
    {
        id: 1,
        dificuldade: 'facil',
        categoria: 'Conhecimentos Gerais',
        pergunta: 'Qual é a capital do Brasil?',
        opcoes: ['Rio de Janeiro', 'Brasília', 'São Paulo', 'Salvador'],
        correta: 'Brasília'
    },
    {
        id: 2,
        dificuldade: 'facil',
        categoria: 'Geografia',
        pergunta: 'Em qual região do Brasil fica o estado do Rio de Janeiro?',
        opcoes: ['Norte', 'Nordeste', 'Sudeste', 'Sul'],
        correta: 'Sudeste'
    },
    {
        id: 3,
        dificuldade: 'facil',
        categoria: 'Matemática',
        pergunta: 'Quanto é 7 x 8?',
        opcoes: ['54', '56', '58', '64'],
        correta: '56'
    },
    {
        id: 4,
        dificuldade: 'facil',
        categoria: 'Brasil',
        pergunta: 'Quais são as cores principais da bandeira do Brasil?',
        opcoes: ['Verde, amarelo, azul e branco', 'Vermelho, azul e branco', 'Preto e branco', 'Verde e vermelho'],
        correta: 'Verde, amarelo, azul e branco'
    },
    {
        id: 5,
        dificuldade: 'facil',
        categoria: 'Tecnologia',
        pergunta: 'O que significa HTML?',
        opcoes: ['Linguagem de marcação', 'Banco de dados', 'Sistema operacional', 'Programa de edição'],
        correta: 'Linguagem de marcação'
    },
    {
        id: 6,
        dificuldade: 'facil',
        categoria: 'Português',
        pergunta: 'Qual palavra está escrita corretamente?',
        opcoes: ['Excessão', 'Exceção', 'Eseção', 'Eccessão'],
        correta: 'Exceção'
    },
    {
        id: 7,
        dificuldade: 'facil',
        categoria: 'Ciências',
        pergunta: 'Qual órgão do corpo humano bombeia o sangue?',
        opcoes: ['Pulmão', 'Coração', 'Estômago', 'Rim'],
        correta: 'Coração'
    },
    {
        id: 8,
        dificuldade: 'facil',
        categoria: 'Futebol',
        pergunta: 'Quantos jogadores cada time tem em campo no futebol tradicional?',
        opcoes: ['9', '10', '11', '12'],
        correta: '11'
    },
    {
        id: 9,
        dificuldade: 'facil',
        categoria: 'Cultura Brasileira',
        pergunta: 'Qual festa popular é muito conhecida no Brasil?',
        opcoes: ['Carnaval', 'Halloween', 'Ação de Graças', 'Ano Novo Chinês'],
        correta: 'Carnaval'
    },
    {
        id: 10,
        dificuldade: 'facil',
        categoria: 'Matemática',
        pergunta: 'Quanto é 15 + 27?',
        opcoes: ['32', '42', '52', '40'],
        correta: '42'
    },
    {
        id: 11,
        dificuldade: 'facil',
        categoria: 'Brasil',
        pergunta: 'Qual é a moeda oficial do Brasil?',
        opcoes: ['Dólar', 'Euro', 'Real', 'Peso'],
        correta: 'Real'
    },
    {
        id: 12,
        dificuldade: 'facil',
        categoria: 'Geografia',
        pergunta: 'Qual oceano banha a costa brasileira?',
        opcoes: ['Oceano Pacífico', 'Oceano Atlântico', 'Oceano Índico', 'Oceano Ártico'],
        correta: 'Oceano Atlântico'
    },
    {
        id: 13,
        dificuldade: 'facil',
        categoria: 'Tecnologia',
        pergunta: 'Qual destes é um navegador de internet?',
        opcoes: ['Google Chrome', 'Windows', 'Excel', 'Photoshop'],
        correta: 'Google Chrome'
    },
    {
        id: 14,
        dificuldade: 'facil',
        categoria: 'Ciências',
        pergunta: 'Qual animal é conhecido como o melhor amigo do ser humano?',
        opcoes: ['Cachorro', 'Jacaré', 'Águia', 'Tubarão'],
        correta: 'Cachorro'
    },
    {
        id: 15,
        dificuldade: 'facil',
        categoria: 'Conhecimentos Gerais',
        pergunta: 'Quantos dias normalmente tem uma semana?',
        opcoes: ['5', '6', '7', '8'],
        correta: '7'
    },

    {
        id: 16,
        dificuldade: 'medio',
        categoria: 'História do Brasil',
        pergunta: 'Em que ano o Brasil se tornou independente?',
        opcoes: ['1500', '1822', '1889', '1964'],
        correta: '1822'
    },
    {
        id: 17,
        dificuldade: 'medio',
        categoria: 'História do Brasil',
        pergunta: 'Quem proclamou a Independência do Brasil?',
        opcoes: ['Dom Pedro I', 'Tiradentes', 'Getúlio Vargas', 'Dom Pedro II'],
        correta: 'Dom Pedro I'
    },
    {
        id: 18,
        dificuldade: 'medio',
        categoria: 'Geografia',
        pergunta: 'Qual é o maior estado do Brasil em território?',
        opcoes: ['Amazonas', 'Pará', 'Mato Grosso', 'Bahia'],
        correta: 'Amazonas'
    },
    {
        id: 19,
        dificuldade: 'medio',
        categoria: 'Ciências',
        pergunta: 'Qual planeta é conhecido como planeta vermelho?',
        opcoes: ['Vênus', 'Marte', 'Júpiter', 'Saturno'],
        correta: 'Marte'
    },
    {
        id: 20,
        dificuldade: 'medio',
        categoria: 'Português',
        pergunta: 'Qual alternativa contém apenas substantivos?',
        opcoes: ['Casa, livro, cidade', 'Correr, bonito, azul', 'Muito, ontem, aqui', 'Feliz, alto, rápido'],
        correta: 'Casa, livro, cidade'
    },
    {
        id: 21,
        dificuldade: 'medio',
        categoria: 'Tecnologia',
        pergunta: 'Qual linguagem é muito usada para criar interatividade em páginas web?',
        opcoes: ['JavaScript', 'Excel', 'Photoshop', 'Windows'],
        correta: 'JavaScript'
    },
    {
        id: 22,
        dificuldade: 'medio',
        categoria: 'Brasil',
        pergunta: 'Qual cidade é conhecida como Cidade Maravilhosa?',
        opcoes: ['São Paulo', 'Rio de Janeiro', 'Curitiba', 'Recife'],
        correta: 'Rio de Janeiro'
    },
    {
        id: 23,
        dificuldade: 'medio',
        categoria: 'Meio Ambiente',
        pergunta: 'Qual bioma brasileiro é conhecido por sua grande floresta tropical?',
        opcoes: ['Caatinga', 'Cerrado', 'Amazônia', 'Pampa'],
        correta: 'Amazônia'
    },
    {
        id: 24,
        dificuldade: 'medio',
        categoria: 'Matemática',
        pergunta: 'Qual é o resultado de 12 x 12?',
        opcoes: ['124', '134', '144', '154'],
        correta: '144'
    },
    {
        id: 25,
        dificuldade: 'medio',
        categoria: 'Geografia',
        pergunta: 'Qual é a sigla do estado de Minas Gerais?',
        opcoes: ['MG', 'MS', 'MT', 'MA'],
        correta: 'MG'
    },
    {
        id: 26,
        dificuldade: 'medio',
        categoria: 'História',
        pergunta: 'Em que ano ocorreu a chegada dos portugueses ao Brasil?',
        opcoes: ['1492', '1500', '1530', '1600'],
        correta: '1500'
    },
    {
        id: 27,
        dificuldade: 'medio',
        categoria: 'Ciências',
        pergunta: 'Qual gás é essencial para a respiração humana?',
        opcoes: ['Oxigênio', 'Hidrogênio', 'Nitrogênio', 'Gás carbônico'],
        correta: 'Oxigênio'
    },
    {
        id: 28,
        dificuldade: 'medio',
        categoria: 'Tecnologia',
        pergunta: 'O que é CSS no desenvolvimento web?',
        opcoes: ['Linguagem de estilo', 'Banco de dados', 'Sistema operacional', 'Servidor'],
        correta: 'Linguagem de estilo'
    },
    {
        id: 29,
        dificuldade: 'medio',
        categoria: 'Português',
        pergunta: 'Qual é o plural de “cidadão”?',
        opcoes: ['Cidadões', 'Cidadãos', 'Cidadães', 'Cidadãoses'],
        correta: 'Cidadãos'
    },
    {
        id: 30,
        dificuldade: 'medio',
        categoria: 'Esportes',
        pergunta: 'Em qual esporte se usa uma raquete?',
        opcoes: ['Tênis', 'Futebol', 'Natação', 'Boxe'],
        correta: 'Tênis'
    },
    {
        id: 31,
        dificuldade: 'medio',
        categoria: 'Brasil',
        pergunta: 'Qual é o maior país da América do Sul?',
        opcoes: ['Argentina', 'Brasil', 'Chile', 'Colômbia'],
        correta: 'Brasil'
    },
    {
        id: 32,
        dificuldade: 'medio',
        categoria: 'Conhecimentos Gerais',
        pergunta: 'Quantos meses têm 28 dias?',
        opcoes: ['Apenas fevereiro', 'Todos os meses', 'Dois meses', 'Nenhum mês'],
        correta: 'Todos os meses'
    },
    {
        id: 33,
        dificuldade: 'medio',
        categoria: 'Matemática',
        pergunta: 'Qual é metade de 250?',
        opcoes: ['100', '115', '125', '150'],
        correta: '125'
    },
    {
        id: 34,
        dificuldade: 'medio',
        categoria: 'Tecnologia',
        pergunta: 'Qual destes é um sistema operacional?',
        opcoes: ['Linux', 'HTML', 'Google', 'WhatsApp'],
        correta: 'Linux'
    },
    {
        id: 35,
        dificuldade: 'medio',
        categoria: 'Geografia',
        pergunta: 'Qual é a capital do estado de São Paulo?',
        opcoes: ['Campinas', 'Santos', 'São Paulo', 'Ribeirão Preto'],
        correta: 'São Paulo'
    },

    {
        id: 36,
        dificuldade: 'dificil',
        categoria: 'História do Brasil',
        pergunta: 'Em que ano ocorreu a Proclamação da República no Brasil?',
        opcoes: ['1822', '1888', '1889', '1930'],
        correta: '1889'
    },
    {
        id: 37,
        dificuldade: 'dificil',
        categoria: 'Geografia',
        pergunta: 'Qual é o rio mais extenso do Brasil?',
        opcoes: ['Rio São Francisco', 'Rio Paraná', 'Rio Amazonas', 'Rio Tocantins'],
        correta: 'Rio Amazonas'
    },
    {
        id: 38,
        dificuldade: 'dificil',
        categoria: 'Ciências',
        pergunta: 'Qual é a unidade básica da vida?',
        opcoes: ['Átomo', 'Célula', 'Molécula', 'Tecido'],
        correta: 'Célula'
    },
    {
        id: 39,
        dificuldade: 'dificil',
        categoria: 'Tecnologia',
        pergunta: 'Em programação, o que é uma API?',
        opcoes: ['Uma interface para comunicação entre sistemas', 'Um tipo de vírus', 'Uma placa de vídeo', 'Um editor de texto'],
        correta: 'Uma interface para comunicação entre sistemas'
    },
    {
        id: 40,
        dificuldade: 'dificil',
        categoria: 'Matemática',
        pergunta: 'Qual é a raiz quadrada de 144?',
        opcoes: ['10', '11', '12', '14'],
        correta: '12'
    },
    {
        id: 41,
        dificuldade: 'dificil',
        categoria: 'História',
        pergunta: 'Qual movimento teve Tiradentes como um de seus principais nomes?',
        opcoes: ['Inconfidência Mineira', 'Revolução Farroupilha', 'Guerra de Canudos', 'Revolta da Vacina'],
        correta: 'Inconfidência Mineira'
    },
    {
        id: 42,
        dificuldade: 'dificil',
        categoria: 'Português',
        pergunta: 'Qual figura de linguagem ocorre em “O vento sussurrava pela janela”?',
        opcoes: ['Metáfora', 'Personificação', 'Hipérbole', 'Ironia'],
        correta: 'Personificação'
    },
    {
        id: 43,
        dificuldade: 'dificil',
        categoria: 'Tecnologia',
        pergunta: 'No desenvolvimento web, o que é responsividade?',
        opcoes: ['Adaptação do layout a diferentes telas', 'Velocidade da internet', 'Tipo de banco de dados', 'Sistema de login'],
        correta: 'Adaptação do layout a diferentes telas'
    },
    {
        id: 44,
        dificuldade: 'dificil',
        categoria: 'Ciências',
        pergunta: 'Qual parte da célula é conhecida como responsável por controlar suas atividades?',
        opcoes: ['Membrana', 'Núcleo', 'Citoplasma', 'Ribossomo'],
        correta: 'Núcleo'
    },
    {
        id: 45,
        dificuldade: 'dificil',
        categoria: 'Geografia',
        pergunta: 'Qual bioma brasileiro é conhecido por vegetação adaptada ao clima seco?',
        opcoes: ['Caatinga', 'Amazônia', 'Mata Atlântica', 'Pantanal'],
        correta: 'Caatinga'
    },
    {
        id: 46,
        dificuldade: 'dificil',
        categoria: 'Matemática',
        pergunta: 'Se x = 5, qual é o valor de 3x + 2?',
        opcoes: ['15', '17', '20', '22'],
        correta: '17'
    },
    {
        id: 47,
        dificuldade: 'dificil',
        categoria: 'Brasil',
        pergunta: 'Qual foi a primeira capital do Brasil?',
        opcoes: ['Brasília', 'Rio de Janeiro', 'Salvador', 'São Paulo'],
        correta: 'Salvador'
    },
    {
        id: 48,
        dificuldade: 'dificil',
        categoria: 'Tecnologia',
        pergunta: 'Qual destas opções representa melhor o front-end de um site?',
        opcoes: ['Parte visual com a qual o usuário interage', 'Servidor de banco de dados', 'Sistema de backup', 'Painel elétrico'],
        correta: 'Parte visual com a qual o usuário interage'
    },
    {
        id: 49,
        dificuldade: 'dificil',
        categoria: 'Ciências',
        pergunta: 'Qual é a principal função dos glóbulos vermelhos?',
        opcoes: ['Transportar oxigênio', 'Produzir hormônios', 'Digerir alimentos', 'Filtrar urina'],
        correta: 'Transportar oxigênio'
    },
    {
        id: 50,
        dificuldade: 'dificil',
        categoria: 'História do Brasil',
        pergunta: 'Qual lei aboliu oficialmente a escravidão no Brasil?',
        opcoes: ['Lei Áurea', 'Lei do Ventre Livre', 'Lei Eusébio de Queirós', 'Lei Saraiva'],
        correta: 'Lei Áurea'
    },
    {
        id: 51,
        dificuldade: 'facil',
        categoria: 'Animais',
        pergunta: 'Qual animal produz leite e é muito comum em fazendas?',
        opcoes: ['Vaca', 'Galinha', 'Peixe', 'Jacaré'],
        correta: 'Vaca'
    },
    {
        id: 52,
        dificuldade: 'facil',
        categoria: 'Português',
        pergunta: 'Qual destas palavras é um verbo?',
        opcoes: ['Correr', 'Casa', 'Azul', 'Mesa'],
        correta: 'Correr'
    },
    {
        id: 53,
        dificuldade: 'medio',
        categoria: 'Tecnologia',
        pergunta: 'Qual comando geralmente instala pacotes em projetos Node.js?',
        opcoes: ['npm install', 'node delete', 'css run', 'html start'],
        correta: 'npm install'
    },
    {
        id: 54,
        dificuldade: 'medio',
        categoria: 'Futebol',
        pergunta: 'Qual cartão indica expulsão direta no futebol?',
        opcoes: ['Cartão vermelho', 'Cartão amarelo', 'Cartão azul', 'Cartão branco'],
        correta: 'Cartão vermelho'
    },
    {
        id: 55,
        dificuldade: 'medio',
        categoria: 'Geografia',
        pergunta: 'Qual é a capital do Paraná?',
        opcoes: ['Curitiba', 'Londrina', 'Maringá', 'Cascavel'],
        correta: 'Curitiba'
    },
    {
        id: 56,
        dificuldade: 'dificil',
        categoria: 'Tecnologia',
        pergunta: 'Em JavaScript, qual palavra é usada para declarar uma constante?',
        opcoes: ['const', 'variante', 'constant', 'fix'],
        correta: 'const'
    },
    {
        id: 57,
        dificuldade: 'dificil',
        categoria: 'Matemática',
        pergunta: 'Qual é o valor de 2³?',
        opcoes: ['6', '8', '9', '12'],
        correta: '8'
    },
    {
        id: 58,
        dificuldade: 'medio',
        categoria: 'Brasil',
        pergunta: 'Qual estado brasileiro tem a sigla RJ?',
        opcoes: ['Rio de Janeiro', 'Rio Grande do Norte', 'Roraima', 'Rondônia'],
        correta: 'Rio de Janeiro'
    },
    {
        id: 59,
        dificuldade: 'facil',
        categoria: 'Conhecimentos Gerais',
        pergunta: 'Quantas letras tem a palavra “Brasil”?',
        opcoes: ['5', '6', '7', '8'],
        correta: '6'
    },
    {
        id: 60,
        dificuldade: 'medio',
        categoria: 'Meio Ambiente',
        pergunta: 'Qual atitude ajuda a preservar o meio ambiente?',
        opcoes: ['Reciclar materiais', 'Jogar lixo no chão', 'Desperdiçar água', 'Queimar lixo'],
        correta: 'Reciclar materiais'
    }
];

function embaralhar(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

function normalizarDificuldade(valor) {
    const texto = (valor || '').toLowerCase();

    if (texto === 'facil' || texto === 'fácil') return 'facil';
    if (texto === 'medio' || texto === 'médio') return 'medio';
    if (texto === 'dificil' || texto === 'difícil') return 'dificil';

    return null;
}

function formatarDificuldade(valor) {
    if (valor === 'facil') return 'Fácil';
    if (valor === 'medio') return 'Médio';
    if (valor === 'dificil') return 'Difícil';
    return 'Aleatória';
}

module.exports = async ({ args, message }) => {
    const grupoId = message.key.remoteJid;

    const dificuldade = normalizarDificuldade(args[0]);

    let lista = perguntas;

    if (dificuldade) {
        lista = perguntas.filter(p => p.dificuldade === dificuldade);
    }

    if (lista.length === 0) {
        return '❌ Não encontrei perguntas para essa dificuldade.';
    }

    const perguntaEscolhida = lista[Math.floor(Math.random() * lista.length)];

    const opcoes = embaralhar(perguntaEscolhida.opcoes);
    const letras = ['A', 'B', 'C', 'D'];

    const indiceCorreto = opcoes.findIndex(opcao => opcao === perguntaEscolhida.correta);
    const respostaLetra = letras[indiceCorreto];

    salvarQuiz(grupoId, {
        pergunta: perguntaEscolhida.pergunta,
        categoria: perguntaEscolhida.categoria,
        dificuldade: perguntaEscolhida.dificuldade,
        opcoes,
        respostaCorreta: perguntaEscolhida.correta,
        respostaLetra
    });

    let msg = '╭━━━━━━━━━━━━━━━━━━━━━━╮\n';
    msg += '┃        🧠 *QUIZ BR*        \n';
    msg += '╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n';

    msg += `📚 *Categoria:* ${perguntaEscolhida.categoria}\n`;
    msg += `🎯 *Dificuldade:* ${formatarDificuldade(perguntaEscolhida.dificuldade)}\n\n`;

    msg += `❓ *Pergunta:*\n${perguntaEscolhida.pergunta}\n\n`;

    msg += '╭─❒ *ALTERNATIVAS*\n';

    opcoes.forEach((opcao, index) => {
        msg += `│ ${letras[index]}) ${opcao}\n`;
    });

    msg += '╰──────────────────────╯\n\n';

    msg += '✅ *Para responder:*\n';
    msg += 'Digite uma das opções:\n\n';
    msg += '`,responder A`\n';
    msg += '`,responder B`\n';
    msg += '`,responder C`\n';
    msg += '`,responder D`\n\n';

    msg += '💡 *Dica:* também dá pra usar:\n';
    msg += '`,quiz facil`\n';
    msg += '`,quiz medio`\n';
    msg += '`,quiz dificil`';

    return msg;
};