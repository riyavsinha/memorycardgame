'use strict';

//process.env.DEBUG = 'actions-on-google:*';
const DialogflowApp = require('actions-on-google').DialogflowApp;
const Logging = require('@google-cloud/logging');
const Strings = require('./strings.js');
const functions = require('firebase-functions');

const projectId = 'memory-f8db7';
const logging = new Logging( {
  projectId: projectId,
})
const log = logging.log(
  'projects/memory-f8db7/logs/cloudfunctions.googleapis.com%2Fcloud-functions');
function metadata(fn) {
  return {
    labels: {
      method: fn,
    },
    resource: {
      labels: {
        function_name:  "memory", 
        project_id:  "memory-f8db7",
        region:  "us-central1",
      },
      type:  "cloud_function", 
    },
    severity:  "DEBUG",
  }
}

// Actions in DialogFlow Intents
const Actions = {
  CARDS_LEFT: 'num_cards_left',
  CONFIRM_LEVEL: 'level_confirm',
  FAQ_GENERAL_FB: 'faq_general_fallback',
  FAQ_LUCKY: 'faq_lucky',
  FAQ_MISSED: 'faq_missed',
  FAQ_PERFECT: 'faq_perfect',
  FAQ_RULES: 'faq_rules',
  GUESS: 'guess',
  GUESS_FB: 'guess_fb',
  IMPLICIT_LEVEL_SELECT: 'implicit_level_select',
  LEVEL_SELECT: 'level_select',
  LIST_UNMATCHED: 'list_unmatched',
  PAIRS_LEFT: 'num_pairs_left',
  WELCOME: 'input.welcome',
};

const Contexts = {
  LEVEL_SELECT: 'level-select',
  LEVEL_SELECT_FB: 'level-select-fb',
  CONFIRM_LEVEL: 'level-confirm',
  GAME: 'game',
  GAME_FB: 'game-fb',
  PLAY_AGAIN_YES: 'play-again-yes',
  PLAY_AGAIN_NO: 'play-again-no',
  PLAY_AGAIN_FB: 'play-again-fb',
  RESTART_YES: 'restart-yes',
  RESTART_NO: 'restart-no',
  RESTART_FB: 'restart-fb',
}

// Params to parse from Intents
const Params = {
  COORD: 'coord',
  LEVEL: 'level',
}

// Game difficulty levels available and corresponding board size.
const Levels = {
  0: [2, 2],
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

  /////////////////////////////////////////////////
  // Intent Handlers
  /////////////////////////////////////////////////

  [Actions.WELCOME] () {

    if (this.hasContext(Contexts.GAME)) {
      this.app.setContext(Contexts.RESTART_YES);
      this.app.setContext(Contexts.RESTART_NO);
      this.app.setContext(Contexts.RESTART_FB);
      this.app.setContext(Contexts.LEVEL_SELECT, 0);
      this.app.setContext(Contexts.LEVEL_SELECT_FB, 0)
      this.app.ask(Strings.askRestart());
    } else if (this.hasContext(Contexts.CONFIRM_LEVEL)) {
      this.app.ask(Strings.askLevel(
          this.data.level, this.data.numRows, this.data.numCols));
    } else {
      let entry = log.entry(metadata('resetConnection'), 'resetting . . .');
      log.write(entry);

      this.app.ask(Strings.welcome());
    }
  }

  [Actions.LEVEL_SELECT] () {
    let level = this.app.getArgument(Params.LEVEL);

    // DEBUG: Log raw level choice
    let entry = log.entry(metadata('levelSelect'), level);
    log.write(entry);

    this.data.level = Number(level);
    this.data.numRows = Levels[this.data.level][0];
    this.data.numCols = Levels[this.data.level][1];
    this.app.ask(
        Strings.levelSelect(
            this.data.level, this.data.numRows, this.data.numCols));
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
      this.app.ask(Strings.tooManyUnmatched(pairLimit));
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
    this.app.ask(unmatched.join(', '));
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

  [Actions.GUESS_FB] () {
    let guess = this.app.getRawInput();

    // Debug: log raw guess
    let entry = log.entry(metadata('invalidGuess'), guess);
    log.write(entry);

    const phrase = Math.random() > .5 ?
        Strings.guessFb1() : Strings.guessFb2;
    this.app.ask(phrase);
  }


  [Actions.GUESS] () {
    const synonyms = {
      'v': '5',
      '81': 'A1',
      '82': 'A2',
      '83': 'A3',
      '84': 'A4',
      '85': 'A5',
      'a v': 'A5',
      '86': 'A6',
      '87': 'A7',
      '88': 'A8',
      '89': 'A9',
      'big one': 'B1',
      'before': 'B4',
    }
    let coord = this.app.getArgument(Params.COORD);

    // DEBUG: Log raw guess
    let entry = log.entry(metadata('validGuess'), coord);
    log.write(entry);

    if (coord in synonyms) {
      coord = synonyms[coord];
    } else {
      coord = coord.charAt(0).toUpperCase() + coord.slice(1);  
    }
    let row = this.letterToInt(coord.charAt(0));
    let col = parseInt(coord.substr(1)) - 1;

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
    let phrase = Strings.revealPhrase(coord, item);
    let firstGuess = this.data.firstGuess;    

    // Check if coordinate has been matched already.
    if (state == States.MATCHED) {
      // Penalty guess
      this.data.numGuesses++;
      this.app.ask(Strings.alreadyMatchedGuess(coord, item));
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
        this.app.setContext(Contexts.PLAY_AGAIN_NO);
        this.app.setContext(Contexts.PLAY_AGAIN_YES);
        this.app.setContext(Contexts.PLAY_AGAIN_FB, 3);
        this.app.setContext(Contexts.GAME, 0);
        this.app.setContext(Contexts.GAME_FB, 0);
        this.app.ask(phrase + " " + Strings.playAgain());
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

  [Actions.FAQ_RULES] () {
    this.app.ask(this.faqContext(Strings.rulesFaq));
  }

  [Actions.FAQ_LUCKY] () {
    this.app.ask(this.faqContext(Strings.luckyFaq));
  }

  [Actions.FAQ_PERFECT] () {
    this.app.ask(this.faqContext(Strings.perfectFaq));
  }

  [Actions.FAQ_MISSED] () {
    this.app.ask(this.faqContext(Strings.missedFaq));
  }

  [Actions.FAQ_GENERAL_FB] () {
    this.app.ask(this.faqContext(Strings.generalFaqFallback))
  }

  /////////////////////////////////////////////////
  // Util Methods
  /////////////////////////////////////////////////

  /** 
   * Expression for determining whether a guess is already known or not
   * and if the known objects list should be updated.
   *
   * A guess is considered to have known information if:
   *     1)  The item already exists in the list of known information
   *     2a) Either both coordinates for the object have been found 
   *             OR
   *     2b) The guessed coordinate is not the original coordinate the item was
   *         found on. 
   *
   * @param {!String} item The item to see if information is known about
   * @param {!Number} row The row number the item was just flipped at
   * @param {!Number} col The col number the item was just flipped at
   * @private
   */
  isKnown(item, row, col) {
    let map = this.data.knownObjs;
    return (item in map) && 
        (map[item].both || (
            (map[item].row != row || 
             map[item].col != col)));
  }

  /**
   * Takes in a FAQ help string function requiring a current context parameter
   * and calls it with the most relevant context string.

   * @private
   * @param {!Function} faqStrFn The help string function
   */
  faqContext(faqStrFn) {
    let segment;
    if (this.hasContext(Contexts.GAME)) {
      segment = Strings.guessContextSegment();
    } else if (this.hasContext(Contexts.CONFIRM_LEVEL)) {
      segment = Strings.levelConfirmContextSegment(
        this.data.level, this.data.numRows, this.data.numCols);
    } else {
      segment = Strings.levelSelectContextSegment();
    }
    return faqStrFn(segment);
  }

  /**
   * Returns whether a given context exists in the current transaction.
   *
   * @param {!String} context The context to check for
   * @private
   */
  hasContext(context) {
    let contexts = this.app.getContexts();
    return contexts.filter((c) => c.name === context).length == 1;
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
   * Checks whether a coordinate is out of bounds of the board.
   *
   * @return {boolean} Whether a coordinate is out of bounds
   * @private
   */
  isOutOfBounds (row, col) {
    return row < 0 || row >= this.data.numRows || col < 0 || 
        col >= this.data.numCols;
  }

  /**
   * Converts a user-input row letter to the corresponding array row index.
   *
   * @return {integer}
   * @private
   */
  letterToInt (letter) {
    return letter.toLowerCase().charCodeAt(0)-97;
  }

  /**
   * Converts a number array coordinate to the printable corresponding letter
   * row.
   * 
   * @param {!Number} the array index to convert. 
   * @return {String} the printable 
   * @private
   */
  intToLetter (number) {
    return String.fromCharCode(97 + number).toUpperCase();
  }
}

exports.memory = functions.https.onRequest(
  (request, response) => new Memory(request, response).run()
);
// DEBUG ONLY
exports.Memory = Memory;
exports.Actions = Actions;
exports.States = States;
exports.Contexts = Contexts;