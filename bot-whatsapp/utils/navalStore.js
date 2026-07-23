const BOARD_SIZE = 16;
const COLUMNS = 'abcdefghijklmnop';

const FLEET = [
    { name: 'Porta-Aviões', size: 5 },
    { name: 'Couraçado', size: 4 },
    { name: 'Couraçado', size: 4 },
    { name: 'Cruzador', size: 3 },
    { name: 'Cruzador', size: 3 },
    { name: 'Submarino', size: 2 },
    { name: 'Submarino', size: 2 },
    { name: 'Submarino', size: 2 },
    { name: 'Bote', size: 1 },
    { name: 'Bote', size: 1 }
];

// groupId -> game state
const games = new Map();

function randomInt(max) {
    return Math.floor(Math.random() * max);
}

function createEmptyGrid() {
    return Array.from(
        { length: BOARD_SIZE },
        () => Array(BOARD_SIZE).fill(null)
    );
}

function canPlace(grid, row, col, size, horizontal) {
    for (let i = 0; i < size; i++) {
        const r = horizontal ? row : row + i;
        const c = horizontal ? col + i : col;

        if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) {
            return false;
        }

        // bloqueia inclusive as casas vizinhas (navios não encostam)
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;

                if (
                    nr >= 0 && nr < BOARD_SIZE &&
                    nc >= 0 && nc < BOARD_SIZE &&
                    grid[nr][nc]
                ) {
                    return false;
                }
            }
        }
    }

    return true;
}

function placeShip(grid, shipDef, id) {
    let attempts = 0;

    while (attempts < 500) {
        attempts++;

        const horizontal = Math.random() < 0.5;
        const row = randomInt(BOARD_SIZE);
        const col = randomInt(BOARD_SIZE);

        if (canPlace(grid, row, col, shipDef.size, horizontal)) {
            const cells = [];

            for (let i = 0; i < shipDef.size; i++) {
                const r = horizontal ? row : row + i;
                const c = horizontal ? col + i : col;
                grid[r][c] = id;
                cells.push(`${r},${c}`);
            }

            return cells;
        }
    }

    return [];
}

function generateBoard() {
    const grid = createEmptyGrid();
    const ships = [];

    FLEET.forEach((shipDef, index) => {
        const id = `s${index}`;
        const cells = placeShip(grid, shipDef, id);

        ships.push({
            id,
            name: shipDef.name,
            cells,
            hits: new Set()
        });
    });

    return {
        grid,
        ships,
        shots: new Map() // "row,col" -> 'hit' | 'miss'
    };
}

function parseCoordinate(text) {
    const match = String(text || '')
        .trim()
        .toLowerCase()
        .match(/^([a-p])(1[0-6]|[1-9])$/);

    if (!match) {
        return null;
    }

    const col = COLUMNS.indexOf(match[1]);
    const row = parseInt(match[2], 10) - 1;

    return { row, col, label: `${match[1]}${match[2]}` };
}

function fireShot(board, row, col) {
    const key = `${row},${col}`;

    if (board.shots.has(key)) {
        return { alreadyShot: true };
    }

    const shipId = board.grid[row][col];

    if (!shipId) {
        board.shots.set(key, 'miss');
        return { hit: false };
    }

    board.shots.set(key, 'hit');

    const ship = board.ships.find(s => s.id === shipId);
    ship.hits.add(key);

    const sunk = ship.hits.size === ship.cells.length;

    return { hit: true, ship, sunk };
}

function allSunk(board) {
    return board.ships.every(
        ship => ship.hits.size === ship.cells.length
    );
}

function renderBoard(board) {
    const header = '   ' + COLUMNS.split('').join(' ');
    const lines = [header];

    for (let r = 0; r < BOARD_SIZE; r++) {
        const rowLabel = String(r + 1).padStart(2, ' ');
        const cells = [];

        for (let c = 0; c < BOARD_SIZE; c++) {
            const key = `${r},${c}`;
            const shotResult = board.shots.get(key);

            if (shotResult === 'hit') {
                cells.push('💥');
            } else if (shotResult === 'miss') {
                cells.push('▫️');
            } else {
                cells.push('🌊');
            }
        }

        lines.push(`${rowLabel} ${cells.join(' ')}`);
    }

    return '```\n' + lines.join('\n') + '\n```';
}

module.exports = {
    BOARD_SIZE,
    COLUMNS,
    FLEET,
    games,
    generateBoard,
    parseCoordinate,
    fireShot,
    allSunk,
    renderBoard
};