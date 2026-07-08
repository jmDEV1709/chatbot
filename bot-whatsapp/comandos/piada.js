const jokes = [
    'Por que o computador foi ao médico? Porque estava com um vírus.',
    'Qual é o café mais perigoso do mundo? O descafeinado, porque faz mal ao sono.',
    'Por que o livro de matemática ficou triste? Porque tinha muitos problemas.',
    'O que o zero disse para o oito? Bonito cinto.',
    'Por que o esqueleto não brigou com ninguém? Porque não tinha estômago pra isso.',
    'O que uma parede disse pra outra? Te encontro na esquina.',
    'Por que o Pinóquio precisa dormir na frente do computador? Ele acorda com a tela travada.',
    'O que o pato falou pro balconista? Coloca na minha conta.',
    'Por que a bicicleta não fica em pé sozinha? Porque ela é dois pneus (tão pneus).',
    'Qual é o contrário de volátil? Vem cá gatil.',
    'Por que o livro de história nunca acaba? Porque a história se repete.',
    'O que é um passarinho? Um passarinho é um pássaro pequeno.',
    
];

module.exports = async () => {
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    return `Piada:\n${joke}`;
};