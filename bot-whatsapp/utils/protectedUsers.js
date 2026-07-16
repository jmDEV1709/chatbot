const PROTECTED_NUMBERS = [
    '5521992439247'
];

function normalizeNumber(value) {
    return String(value || '')
        .split('@')[0]
        .split(':')[0]
        .replace(/\D/g, '');
}

function getPossibleNumbers(value) {
    const number = normalizeNumber(value);

    if (!number) {
        return [];
    }

    const numbers = new Set();

    numbers.add(number);

    if (!number.startsWith('55')) {
        numbers.add(`55${number}`);
    }

    return [...numbers];
}

function isProtectedUser(...ids) {
    return ids
        .flat()
        .filter(Boolean)
        .some(id => {
            const possibleNumbers = getPossibleNumbers(id);

            return possibleNumbers.some(number =>
                PROTECTED_NUMBERS.includes(number)
            );
        });
}

module.exports = {
    isProtectedUser,
    PROTECTED_NUMBERS
};