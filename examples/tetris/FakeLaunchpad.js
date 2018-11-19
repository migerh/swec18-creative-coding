const keypress = require('keypress');
const {EventEmitter} = require('events');

let keypressInitialized = false;

class FakeLaunchpad extends EventEmitter {
  constructor() {
    super();

    if (!keypressInitialized) {
      keypress(process.stdin);
      keypressInitialized = true;
    }

    process.stdin.on('keypress', (ch, key) => {
      const isCtrlC = key && key.ctrl && key.name === 'c';
      const isQ = key && key.name === 'q';
      if (isCtrlC || isQ) {
        process.exit(0);
      }

      const functionX = ['1', '2', '3', '4', '5', '6', '7', '8'];
      const functionY = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];
      const indexX = functionX.indexOf(ch);
      const indexY = functionY.indexOf(ch);

      if (indexX === -1 && indexY === -1) {
        return;
      }

      if (indexX !== -1) {
        this.emit('functionX', indexX);
      }

      if (indexY !== -1) {
        this.emit('functionY', indexY);
      }
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();
  }

  setFunctionX() {
    return this;
  }
  setFunctionY() {
    return this;
  }
  clearFunctionButtons() {}
  clearSquares() {}
  _isBlack(color) {
    return color._red === 0 && color._green === 0;
  }
  updateBoard(board) {
    console.log('+--------');
    for (let y = 0; y < 8; ++y) {
      const line = ['|'].concat(board[y].map(p => this._isBlack(p) ? ' ' : 'x'));
      console.log(line.join(''));
    }
    console.log('+--------');
  }
}

module.exports = FakeLaunchpad;