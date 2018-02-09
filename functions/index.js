'use strict';

//process.env.DEBUG = 'actions-on-google:*';
const DialogflowApp = require('actions-on-google').DialogflowApp;
const functions = require('firebase-functions');
const Strings = require('./strings.js');


// Actions in DialogFlow Intents
const Actions = {
  CARDS_LEFT: 'num_cards_left',
  CONFIRM_LEVEL: 'confirm_level',
  GUESS: 'guess',
  LEVEL_SELECT: 'level_select',
  LIST_UNMATCHED: 'list_unmatched',
  PAIRS_LEFT: 'num_pairs_left',
};

// Params to parse from Intents
const Params = {
  COL: 'col',
  LEVEL: 'level',
  ROW: 'row',
}

// Game difficulty levels available and corresponding board size.
const Levels = {
  1: [2, 4], // 8, 4 pairs
  2: [3, 4], // 12, 6 pairs
  3: [4, 4], // 16, 8 pairs
  4: [4, 6], // 24, 12 pairs
  5: [5, 6], // 30, 15 pairs
  6: [6, 6], // 36, 18 pairs
  7: [6, 8], // 48, 24 pairs
  8: [7, 8], // 56, 28 pairs
  9: [8, 8], // 64, 32 pairs 
  10: [8, 10], // 80, 40 pairs
}

// Possible states for a card.
const States = {
  UNKNOWN: 0,
  SEEN: 1,
  MISSED: 2,
  MATCHED: 3,
}

// Possible objects to initialize the board with.
var Objects = ["aardvark", "bat", "bear", "beaver", "bison", "boar",
    "butterfly", "camel", "capybara", "cat", "crab", "deer", "dog", "dolphin",
    "donkey", "duck", "eagle", "elephant", "fox", "giraffe", "goat", "horse",
    "kangaroo", "koala", "leopard", "lion", "lizard", "llama", "monkey",
    "mouse", "octopus", "panther", "parrot", "peacock", "penguin", "porcupine",
    "rabbit", "raven", "salmon", "shark", "sheep", "skunk", "sloth", "snake",
    "spider", "tiger", "toucan", "turkey", "turtle", "walrus", "whale", "wolf",
    "zebra"];

class Memory {

  constructor (request, response) {

     /** @type {DialogflowApp} */
    this.app = new DialogflowApp({ request, response });

    /** @type {AppData} */
    this.data = this.app.data;
  }

  /**
   * Get the Dialogflow intent and handle it using the appropriate method
   */
  run () {
    /** @type {*} */
    const map = this;
    const action = this.app.getIntent();
    console.log(action);
    map[action]();
  }

  // Intent Handlers
  [Actions.LEVEL_SELECT] () {
    let level = Number(this.app.getArgument(Params.LEVEL));
    this.data.numRows = Levels[level][0];
    this.data.numCols = Levels[level][1];
    this.app.ask(
        Strings.levelSelect(level, this.data.numRows, this.data.numCols));
  }

  [Actions.PAIRS_LEFT] () {
    this.app.ask(Strings.pairsLeft(this.data.pairsLeft));
  }

  [Actions.CARDS_LEFT] () {
    this.app.ask(Strings.cardsLeft(this.data.pairsLeft * 2));
  }

  [Actions.LIST_UNMATCHED] () {
    // Set a limit on when this method can be called to avoid long responses
    let limit = 1/3;
    let numPairs = this.data.numRows * this.data.numCols / 2
    let pairLimit = Math.ceil(numPairs * limit)
    if (this.data.pairsLeft > pairLimit) {
      this.app.tell(Strings.tooManyUnmatched(pairLimit));
      return;
    }
    var unmatched = [];
    for (var i = 0; i < this.data.numRows; i++) {
      for (var j = 0; j < this.data.numCols; j++) {
        if (this.data.metaboard[i][j] != States.MATCHED) {
          unmatched.push(this.intToLetter(i) + (j+1))
        }
      }
    }
    this.app.tell(unmatched.join(', '));
  }

  [Actions.CONFIRM_LEVEL] () {
    // Get list of cards for this game
    this.shuffle(Objects)
    let numPairs = this.data.numRows * this.data.numCols / 2
    var objs = Objects.slice(0, numPairs);

    // Duplicate each card for pair and shuffle
    objs = this.shuffle(objs.concat(objs))

    // Place into board
    this.data.board = [];
    this.data.metaboard = [];
    for (var i = 0; i < this.data.numRows; i++) {
      this.data.board.push(
          objs.slice(i*this.data.numCols, (i+1)*this.data.numCols));
      this.data.metaboard.push(Array(this.data.numCols).fill(States.UNKNOWN));
    }

    // Setup game info
    // Number of pairs left in play
    this.data.pairsLeft = numPairs;
    // First guess coordinates and object
    this.data.firstGuess = null;
    // Objects known to the player
    this.data.knownObjs = {};

    // Setup stats
    // Number of guesses player has made
    this.data.numGuesses = 0;
    // Numer of lucky guesses by the player
    this.data.numLucky = 0;
    // Number of perfect recall guesses
    this.data.numPerfect = 0;
    // Number of incorrect guesses that could have been correct
    this.data.numMissed = 0;

    this.app.ask(Strings.startGuessing());
  }

  [Actions.GUESS] () {
    let rowPrint = this.app.getArgument(Params.ROW).toUpperCase();
    let colPrint = this.app.getArgument(Params.COL);

    let row = this.letterToInt(rowPrint);
    let col = colPrint - 1;

    /////////////////////////////////////////////////
    // Handle invalid guesses
    /////////////////////////////////////////////////

    if (this.isOutOfBounds(row, col)) {
      let rowBound = this.intToLetter(this.data.numRows - 1);
      this.app.ask(Strings.outOfBoundsGuess(rowBound, this.data.numCols));
      return;
    }

    let item = this.data.board[row][col];
    let state = this.data.metaboard[row][col];
    let phrase = Strings.revealPhrase(rowPrint, colPrint, item);
    let firstGuess = this.data.firstGuess;    

    // Check if coordinate has been matched already.
    if (state == States.MATCHED) {
      // Penalty guess
      this.data.numGuesses++;
      this.app.ask(Strings.alreadyMatchedGuess(rowPrint, colPrint, item));
      return;
    }

    // If no first guess, extract information
    if (firstGuess) {
      // Invalid if first guess is the same as the second. No penalty.
      if (row == firstGuess.row && col == firstGuess.col) {
        this.app.ask(Strings.justGuessedSegment() + phrase);
        return;
      } else {
        this.data.firstGuess = null;
      }
    } else {
      this.data.firstGuess = {row: row, col: col, item: item, state: state};
      this.app.ask(phrase);
      return;
    }

    this.data.numGuesses++;


    /////////////////////////////////////////////////
    // Handle item comparison on even guess
    /////////////////////////////////////////////////

    if (item === firstGuess.item) {
      // Set tile states to matched and decrease pairs
      this.data.metaboard[row][col] = States.MATCHED;
      this.data.metaboard[firstGuess.row][firstGuess.col] = States.MATCHED;

      // Lucky guess if both unknown
      if (state == States.UNKNOWN && firstGuess.state == States.UNKNOWN &&
          this.data.pairsLeft > 1) {
        this.data.numLucky++;
        this.data.pairsLeft--;
        this.app.ask(phrase + Strings.luckyGuessSegment());
        return;
      }

      this.data.pairsLeft--;

      // Check for perfect memory
      if (state == States.SEEN && firstGuess.state != States.MISSED) {
        this.data.numPerfect++;
        phrase += Strings.perfectMemorySegment();
      }

      // Check end-game condition.
      if (this.data.pairsLeft == 0) {
        phrase += Strings.endingPhrase(this.data.numGuesses);
        if (this.data.numLucky > 0) {
          phrase += Strings.endingLuckyPhrase(this.data.numLucky);
        }
        if (this.data.numPerfect > 0) {
          phrase += Strings.endingPerfectPhrase(this.data.numPerfect);
        }
        if (this.data.numMissed > 0) {
          phrase += Strings.incorrectGuessSegment(this.data.numMissed);
        } else {
          phrase += Strings.endingGreatJob();
        }
        this.app.tell(phrase);
        return;
      }

      this.app.ask(phrase + Strings.correctMatch());

    } else {
      // For first guess, if item seen and not originally seen item,
      //     mark as a missed guess
      if (this.isKnown(firstGuess.item, firstGuess.row, firstGuess.col)) {
        this.data.numMissed++;
        this.data.metaboard[firstGuess.row][firstGuess.col] = States.MISSED;
      } else {
        this.data.metaboard[firstGuess.row][firstGuess.col] = States.SEEN;
      }
      // Always set second guess as seen
      this.data.metaboard[row][col] = States.SEEN;

      // Add first object to list of known objects
      if (this.isKnown(firstGuess.item, firstGuess.row, firstGuess.col)) {
        this.data.knownObjs[firstGuess.item].both = true;
      } else {
        this.data.knownObjs[firstGuess.item] =
            {both: false, row: firstGuess.row, col: firstGuess.col};
      }

      // Add second object to list of known objects
      if (this.isKnown(item, row, col)) {
        this.data.knownObjs[item].both = true;
      } else {
        this.data.knownObjs[item] = {both: false, row: row, col: col};
      }
      
      this.app.ask(phrase + Strings.incorrectMatch());
    }
  }

  /** 
   * Expression for determining whether a guess is already known or not
   * and if the known objects list should be updated.
   *
   * A guess is considered a known if:
   *     1)  The item already exists in the list of known information
   *     2a) Either both coordinates for the object have been found 
                 OR
   *     2b) The guessed coordinate is not the original coordinate the item was
   *         found on.
   */
  isKnown(item, row, col) {
    let map = this.data.knownObjs;
    return (item in map) && 
        (map[item].both || (
            (map[item].row != row || 
             map[item].col != col)));
  }


  /**
   * Utility method for shuffling array in place.
   * Credit: https://bost.ocks.org/mike/shuffle/
   *
   * @return {Array} the original array, shuffled.
   * @nondeterministic
   * @private
   */
  shuffle (array) {
    var m = array.length, t, i;
    // While there remain elements to shuffle…
    while (m) {
      // Pick a remaining element…
      i = Math.floor(Math.random() * m--);
      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
    return array;
  }

  /**
   * @return {boolean} Whether a coordinate is out of bounds
   * @private
   */
  isOutOfBounds (row, col) {
    return row < 0 || row >= this.data.numRows || col < 0 || 
        col >= this.data.numCols;
  }

  /**
   * @return {integer}
   * @private
   */
  letterToInt (letter) {
    return letter.toLowerCase().charCodeAt(0)-97;
  }

  /**
   * @return {String}
   * @private
   */
  intToLetter (number) {
    return String.fromCharCode(97 + number).toUpperCase();
  }
}

class ObjMap {
  constructor() {
    this.map = {}
  }

  has(key) {
    return key in this.map;
  }

  set(key, item) {
    this.map[key] = item;
  }

  get(key) {
    return this.map[key]
  }
}

exports.memory = functions.https.onRequest(
  (request, response) => new Memory(request, response).run()
);
// DEBUG ONLY
exports.Memory = Memory;
exports.Actions = Actions;
exports.States = States;
