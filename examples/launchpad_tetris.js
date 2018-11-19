const debug = require('debug');
const lunchpad = require('lunchpad');
const Color = lunchpad.Color;

const generateBlankSquare = require('../lib/generateBlankSquare');

const STATE_RUNNING = 'running';
const STATE_NONE = 'none';
const STATE_ERROR = 'error';

class Tetronimo {
  constructor(width, height, color) {
    this.width = width;
    this.height = height;
    this.maxColumn = 8 - width + 1;
    this.x = this._randomColumn();
    this.y = 8 + height;
    this.color = color;
    this.currentRotation = 0;
    this.collided = false;
  }

  clone() {
    const clone = new this.constructor(this.color);
    clone.x = this.x;
    clone.y = this.y;
    clone.currentRotation = this.currentRotation;

    return clone;
  }

  _randomColumn() {
    return parseInt(Math.random() * (this.maxColumn), 10);
  }

  moveRight(settledPieces) {
    return this.safelyMutate(settledPieces, t => {
      t.x = Math.min(t.maxColumn, t.x + 1);
    });
  }

  moveLeft(settledPieces) {
    return this.safelyMutate(settledPieces, t => {
      t.x = Math.max(0, t.x - 1);
    });
  }

  moveDown(settledPieces) {
    return this.safelyMutate(settledPieces, t => {
      t.y = Math.max(0, t.y - 1);
    });
  }

  static set(board, x, y, op) {
    if (x >= 0 && x < 8 && y >= 0 && y < 8) {
      op(board, x, y);
    }
  }

  isSet(board, x, y) {
    if (x >= 0 && x < 8 && y >= 0 && y < 8) {
      return board[x][y] !== ' ';
    }
  }

  collidesWith(settledPieces) {
    const thingy = this.rotations[this.currentRotation];
    const height = thingy.length;
    for (let line = 0; line < height; ++line) {
      const width = thingy[line].length;
      for (let char = 0; char < width; ++char) {
        const squareActive = this.isSet(settledPieces, this.x + char, this.y - (height - line));
        const thingyActive = thingy[line][char] === 'x';

        if (squareActive && thingyActive) {
          return true;
        }
      }
    }

    return false;
  }

  safelyMutate(settledPieces, op) {
    const clone = this.clone();
    op(clone);

    if (clone.collidesWith(settledPieces)) {
      this.collided = true;
      return this;
    }

    return clone;
  }

  rotateLeft(settledPieces) {
    return this.safelyMutate(settledPieces, t => {
      const num = t.rotations.length;
      t.currentRotation = (t.currentRotation - 1 + num) % num;
    });
  }

  rotateRight(settledPieces) {
    return this.safelyMutate(settledPieces, t => {
      const num = t.rotations.length;
      t.currentRotation = (t.currentRotation + 1) % num;
    });
  }

  draw(board, op = (board, x, y) => {
    board[x][y] = this.color;
  }) {
    const thingy = this.rotations[this.currentRotation];
    const height = thingy.length;
    for (let line = 0; line < height; ++line) {
      const width = thingy[line].length;
      for (let char = 0; char < width; ++char) {
        if (thingy[line][char] === 'x') {
          Tetronimo.set(board, this.x + char, this.y - (height - line), op);
        }
      }
    }
  }
}

class I extends Tetronimo {
  constructor(color) {
    super(4, 1, color);
    this.rotations = [
      ['xxxx'],
      ['x', 'x', 'x', 'x']
    ];
  }
}

class J extends Tetronimo {
  constructor(color) {
    super(3, 2, color);
    this.rotations = [
      ['x  ', 'xxx'],
      ['xx', 'x ', 'x '],
      ['xxx', '  x'],
      [' x', ' x', 'xx']
    ];
  }
}

class L extends Tetronimo {
  constructor(color) {
    super(3, 2, color);
    this.rotations = [
      ['  x', 'xxx'],
      ['x ', 'x ', 'xx'],
      ['xxx', 'x  '],
      ['xx', ' x', ' x']
    ];
  }
}

class O extends Tetronimo {
  constructor(color) {
    super(2, 2, color);
    this.rotations = [['xx', 'xx']];
  }
}

class S extends Tetronimo {
  constructor(color) {
    super(3, 2, color);
    this.rotations = [
      [' xx', 'xx '],
      ['x ', 'xx', ' x']
    ]
  }
}

class T extends Tetronimo {
  constructor(color) {
    super(3, 2, color);
    this.rotations = [
      [' x ', 'xxx'],
      ['x ', 'xx', 'x '],
      ['xxx', ' x '],
      [' x', 'xx', ' x']
    ];
  }
}

class Z extends Tetronimo {
  constructor(color) {
    super(3, 2, color);
    this.rotations = [
      ['xx ', ' xx'],
      [' x', 'xx', 'x ']
    ];
  }
}

class FakeLaunchpad {
  setFunctionX() {
    return this;
  }
  setFunctionY() {
    return this;
  }
  clearFunctionButtons() {}
  on() {
    return this;
  }
  clearSquares() {}
  _isBlack(color) {
    return color._red === 0 && color._green === 0;
  }
  updateBoard(board) {
    for (let y = 0; y < 8; ++y) {
      const line = board[y].map(p => this._isBlack(p) ? ' ' : 'x');
      console.log(line.join(''));
    }
  }
}

lunchpad.initialize().then(launchpad => tetris(launchpad)).catch(() => tetris(new FakeLaunchpad())).catch(console.error);

function clearFunctionButtons(launchpad) {
  for (let i = 0; i < 8; ++i) {
    launchpad.setFunctionX(i, Color.BLACK);
    launchpad.setFunctionY(i, Color.BLACK);
  }
}

function clearAll(launchpad) {
  launchpad.clearSquares();
  clearFunctionButtons(launchpad);
}

function tetris(launchpad) {
  let state = STATE_NONE, delay, tetronimo, settledPieces;

  function randomTetronimo() {
    // return new O(Color.RED);
    const selection = parseInt(Math.random() * 7, 10);
    switch(selection) {
      case 0:
        return new I(Color.GREEN);
      case 1:
        return new J(Color.AMBER);
      case 2:
        return new L(Color.RED);
      case 3:
        return new O(Color.RED);
      case 4:
        return new S(Color.GREEN);
      case 5:
        return new T(Color.AMBER);
      case 6:
        return new Z(Color.GREEN);
      default:
        return new I(Color.AMBER);
    }
  }

  function initiate() {
    state = STATE_RUNNING;
    delay = 500;
    tetronimo = randomTetronimo();
    settledPieces = [
      '        ',
      '        ',
      '        ',
      '        ',
      '        ',
      '        ',
      '        ',
      '        '
    ];
    tick();
  }

  function handleError() {
    state = STATE_ERROR

    launchpad.updateBoard(generateBlankSquare(Color.RED))
    setTimeout(() => launchpad.updateBoard(generateBlankSquare(Color.BLACK)), 400)
    setTimeout(() => launchpad.updateBoard(generateBlankSquare(Color.RED)), 800)
    setTimeout(() => launchpad.updateBoard(generateBlankSquare(Color.BLACK)), 1200)
  }

  function clearFullLines(settledPieces) {
    console.log(settledPieces);
//    const transposed = 
    const removedLines = settledPieces.filter(l => l !== 'xxxxxxxx');
    while (removedLines.length < 8) {
      removedLines.push('        ');
    }

    console.log(settledPieces);
    return removedLines;
  }

  function tick() {
    if (tetronimo.y === tetronimo.height || tetronimo.collided) {
      //clearAll(launchpad);
      tetronimo.draw(settledPieces, (board, x, y) => {
        const l = board[x];
        board[x] = [...l.slice(0, y), 'x', ...l.slice(y + 1)].join('');
      });
      settledPieces = clearFullLines(settledPieces);
      tetronimo = randomTetronimo();
    }
    print();
    tetronimo = tetronimo.moveDown(settledPieces);
    setTimeout(tick, delay);
  }

  function drawSettledPieces(board, settledPieces) {
    for (let x = 0; x < 8; ++x) {
      for (let y = 0; y < 8; ++y) {
        if (settledPieces[x][y] === 'x') {
          Tetronimo.set(board, x, y, (board, x, y) => board[x][y] = Color.RED);
        }
      }
    }
  }

  function print() {
    let board = generateBlankSquare(Color.BLACK)
    drawSettledPieces(board, settledPieces);
    tetronimo.draw(board);
    launchpad.updateBoard(board);

    // snake.forEach((entry, i) => blank[entry.x][entry.y] = entry.c)

    // blank[apple.x][apple.y] = Color.RED

    // launchpad.updateBoard(blank)
  }

  launchpad
    .on('functionY', y => {
      console.log('pressed functionY', y);
      if (y === 0) {
        tick();
      }
      if (y === 7) {
        initialize();
      }
      if (y === 1) {
        tetronimo = tetronimo.rotateLeft(settledPieces);
      }
      if (y === 2) {
        tetronimo = tetronimo.rotateRight(settledPieces);
      }
    })
    .on('functionX', x => {
      console.log('pressed functionX', x);
      if (x === 0) {
        tetronimo = tetronimo.moveLeft(settledPieces);
      }
      if (x === 1) {
        tetronimo = tetronimo.moveRight(settledPieces);
      }
    })

  clearAll(launchpad);

  launchpad
    .setFunctionY(0, Color.getColor(1, 1))
    .setFunctionY(1, Color.getColor(1, 1))
    .setFunctionX(0, Color.getColor(1, 1))
    .setFunctionX(1, Color.getColor(1, 1))

  initiate();
}

module.exports = tetris;