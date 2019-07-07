'use strict';

//process.env.DEBUG = 'actions-on-google:*';
import {dialogflow} from 'actions-on-google';
import {Strings} from './strings';
import functions = require('firebase-functions');
import {Actions, ConvData, GameContexts, KnownItemInformation, Levels, NumberWords, Objects, States} from './types';
import { Contexts, DialogflowConversation } from 'actions-on-google/dist/service/dialogflow';

// const projectId = 'memory-f8db7';
// const logging = new Logging( {
//   projectId: projectId,
// })
// const log = logging.log(
//   'projects/memory-f8db7/logs/cloudfunctions.googleapis.com%2Fcloud-functions');
// function metadata(fn: Function) {
//   return {
//     labels: {
//       method: fn,
//     },
//     resource: {
//       labels: {
//         function_name:  "memory", 
//         project_id:  "memory-f8db7",
//         region:  "us-central1",
//       },
//       type:  "cloud_function", 
//     },
//     severity:  "DEBUG",
//   }
// }

const app = dialogflow<ConvData, {}>();

app.intent(Actions.WELCOME, conv => {
  if (conv.contexts.get(GameContexts.GAME)) {
    conv.contexts.set(GameContexts.RESTART_YES, 3);
    conv.contexts.set(GameContexts.RESTART_NO, 3);
    conv.contexts.set(GameContexts.RESTART_FB, 3);
    conv.contexts.delete(GameContexts.LEVEL_SELECT);
    conv.contexts.delete(GameContexts.LEVEL_SELECT_FB)
    conv.ask(Strings.askRestart());
  } else if (conv.contexts.get(GameContexts.CONFIRM_LEVEL)) {
    conv.ask(Strings.askLevel(
        conv.data.level, conv.data.numRows, conv.data.numCols));
  } else {
    // let entry = log.entry(metadata('resetConnection'), 'resetting . . .');
    // log.write(entry);

    conv.ask(Strings.welcome());
  }
});

app.intent(Actions.LEVEL_SELECT, (conv, {level}) => {
  // DEBUG: Log raw level choice
  // let entry = log.entry(metadata('levelSelect'), level);
  // log.write(entry);
  conv.data.level = Number(level) || NumberWords[level as string];
  console.log(conv.data.level);
  conv.data.numRows = Levels[conv.data.level][0];
  conv.data.numCols = Levels[conv.data.level][1];
  conv.ask(
      Strings.levelSelect(
          conv.data.level, conv.data.numRows, conv.data.numCols));
});

app.intent(Actions.CONFIRM_LEVEL, (conv) => {
  // Get list of cards for this game
  _shuffle(Objects)
  const numPairs = conv.data.numRows * conv.data.numCols / 2
  let objs = Objects.slice(0, numPairs);

  // Duplicate each card for pair and shuffle
  objs = _shuffle(objs.concat(objs))

  // Place into board
  conv.data.board = [];
  conv.data.metaboard = [];
  for (let i = 0; i < conv.data.numRows; i++) {
    conv.data.board.push(
        objs.slice(i*conv.data.numCols, (i+1)*conv.data.numCols));
    conv.data.metaboard.push(Array(conv.data.numCols).fill(States.UNKNOWN));
  }

  // Setup game info
  // Number of pairs left in play
  conv.data.pairsLeft = numPairs;
  // First guess coordinates and object
  conv.data.firstGuess = null;
  // Objects known to the player
  conv.data.knownObjs = {};

  // Setup stats
  // Number of guesses player has made
  conv.data.numGuesses = 0;
  // Numer of lucky guesses by the player
  conv.data.numLucky = 0;
  // Number of perfect recall guesses
  conv.data.numPerfect = 0;
  // Number of incorrect guesses that could have been correct
  conv.data.numMissed = 0;

  conv.ask(Strings.startGuessing());
});

app.intent(Actions.GUESS, (conv, {coord}) => {
  const synonyms : {[key: string] : string}= {
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

  // DEBUG: Log raw guess
  // let entry = log.entry(metadata('validGuess'), coord);
  // log.write(entry);
  let processCoord = coord as string;
  if (processCoord in synonyms) {
    processCoord = synonyms[processCoord];
  } else {
    processCoord = processCoord.charAt(0).toUpperCase() + processCoord.slice(1);  
  }
  const row = _letterToInt(processCoord.charAt(0));
  const col = parseInt(processCoord.substr(1)) - 1;
  const numRows = conv.data.numRows;
  const numCols = conv.data.numCols;

  /////////////////////////////////////////////////
  // Handle invalid guesses
  /////////////////////////////////////////////////

  if (_isOutOfBounds(row, col, numRows, numCols)) {
    const rowBound = _intToLetter(numRows - 1);
    conv.ask(Strings.outOfBoundsGuess(rowBound, numCols));
    return;
  }

  const item = conv.data.board[row][col];
  const state = conv.data.metaboard[row][col];
  let phrase = Strings.revealPhrase(processCoord, item);
  const firstGuess = conv.data.firstGuess;    

  // Check if coordinate has been matched already.
  if (state === States.MATCHED) {
    // Penalty guess
    conv.data.numGuesses++;
    conv.ask(Strings.alreadyMatchedGuess(processCoord, item));
    return;
  }

  // If first guess, check and reset; else save info
  if (firstGuess) {
    // Invalid if first guess is the same as the second. No penalty.
    if (row === firstGuess.row && col === firstGuess.col) {
      conv.ask(Strings.justGuessedSegment() + phrase);
      return;
    } else {
      conv.data.firstGuess = null;
    }
  } else {
    conv.data.firstGuess = {row: row, col: col, item: item, state: state};
    conv.ask(phrase);
    return;
  }

  conv.data.numGuesses++;


  /////////////////////////////////////////////////
  // Handle item comparison on even guess
  /////////////////////////////////////////////////

  if (item === firstGuess.item) {
    // Set tile states to matched and decrease pairs
    conv.data.metaboard[row][col] = States.MATCHED;
    conv.data.metaboard[firstGuess.row][firstGuess.col] = States.MATCHED;

    // Lucky guess if both unknown
    if (state === States.UNKNOWN && firstGuess.state === States.UNKNOWN &&
        conv.data.pairsLeft > 1) {
      conv.data.numLucky++;
      conv.data.pairsLeft--;
      conv.ask(phrase + Strings.luckyGuessSegment());
      return;
    }

    conv.data.pairsLeft--;

    // Check for perfect memory
    if (state === States.SEEN && firstGuess.state !== States.MISSED) {
      conv.data.numPerfect++;
      phrase += Strings.perfectMemorySegment();
    }

    // Check end-game condition.
    if (conv.data.pairsLeft === 0) {
      phrase += Strings.endingPhrase(conv.data.numGuesses);
      if (conv.data.numLucky > 0) {
        phrase += Strings.endingLuckyPhrase(conv.data.numLucky);
      }
      if (conv.data.numPerfect > 0) {
        phrase += Strings.endingPerfectPhrase(conv.data.numPerfect);
      }
      if (conv.data.numMissed > 0) {
        phrase += Strings.incorrectGuessSegment(conv.data.numMissed);
      } else {
        phrase += Strings.endingGreatJob();
      }
      conv.contexts.set(GameContexts.PLAY_AGAIN_NO, 3);
      conv.contexts.set(GameContexts.PLAY_AGAIN_YES, 3);
      conv.contexts.set(GameContexts.PLAY_AGAIN_FB, 3);
      conv.contexts.delete(GameContexts.GAME);
      conv.contexts.delete(GameContexts.GAME_FB);
      conv.ask(phrase + " " + Strings.playAgain());
      return;
    }

    conv.ask(phrase + Strings.correctMatch());

  } else {
    // For first guess, if item seen and not originally seen item,
    //     mark as a missed guess
    if (_isKnown(firstGuess.item, firstGuess.row, firstGuess.col, conv.data.knownObjs)) {
      conv.data.numMissed++;
      conv.data.metaboard[firstGuess.row][firstGuess.col] = States.MISSED;
    } else {
      conv.data.metaboard[firstGuess.row][firstGuess.col] = States.SEEN;
    }
    // Always set second guess as seen
    conv.data.metaboard[row][col] = States.SEEN;

    // Add first object to list of known objects
    if (_isKnown(firstGuess.item, firstGuess.row, firstGuess.col, conv.data.knownObjs)) {
      conv.data.knownObjs[firstGuess.item].both = true;
    } else {
      conv.data.knownObjs[firstGuess.item] =
          {both: false, row: firstGuess.row, col: firstGuess.col};
    }

    // Add second object to list of known objects
    if (_isKnown(item, row, col, conv.data.knownObjs)) {
      conv.data.knownObjs[item].both = true;
    } else {
      conv.data.knownObjs[item] = {both: false, row: row, col: col};
    }
    
    conv.ask(phrase + Strings.incorrectMatch());
  }
});

app.intent(Actions.GUESS_FB, conv => {
  const guess = conv.query;

  // Debug: log raw guess
  // let entry = log.entry(metadata('invalidGuess'), guess);
  // log.write(entry);

  const phrase = Math.random() > .5 ?
      Strings.guessFb1() : Strings.guessFb2();
  conv.ask(phrase);
});

app.intent(Actions.PAIRS_LEFT, conv => {
  conv.ask(Strings.pairsLeft(conv.data.pairsLeft));
});

app.intent(Actions.CARDS_LEFT, conv => {
  conv.ask(Strings.cardsLeft(conv.data.pairsLeft * 2));
});

app.intent(Actions.LIST_UNMATCHED, conv => {
  // Set a limit on when this method can be called to avoid long responses
  const limit = 1/3;
  const numPairs = conv.data.numRows * conv.data.numCols / 2
  const pairLimit = Math.ceil(numPairs * limit)
  if (conv.data.pairsLeft > pairLimit) {
    conv.ask(Strings.tooManyUnmatched(pairLimit));
    return;
  }
  const unmatched = [];
  for (let i = 0; i < conv.data.numRows; i++) {
    for (let j = 0; j < conv.data.numCols; j++) {
      if (conv.data.metaboard[i][j] !== States.MATCHED) {
        unmatched.push(_intToLetter(i) + (j+1))
      }
    }
  }
  conv.ask(unmatched.join(', '));
});

  app.intent(Actions.FAQ_RULES, conv => {
    conv.ask(_faqContext(Strings.rulesFaq, conv));
  });

  app.intent(Actions.FAQ_LUCKY, conv => {
    conv.ask(_faqContext(Strings.luckyFaq, conv));
  });

  app.intent(Actions.FAQ_PERFECT, conv => {
    conv.ask(_faqContext(Strings.perfectFaq, conv));
  });

  app.intent(Actions.FAQ_MISSED, conv => {
    conv.ask(_faqContext(Strings.missedFaq, conv));
  });

  app.intent(Actions.FAQ_GENERAL_FB, conv => {
    conv.ask(_faqContext(Strings.generalFaqFallback, conv));
  });

/////////////////////////////////////////////////
// Util Methods
/////////////////////////////////////////////////

/** 
 * Expression for determining whether a guess is already known or not
 * and if the known objects list should be updated.
 *
 * A guess is considered to have known information if:
 *     1)  The item already exists in the list of known information
 *             AND
 *     2a) Either both coordinates for the object have been found 
 *             OR
 *     2b) The guessed coordinate is not the original coordinate the item was
 *         found on. 
 */
function _isKnown(item: string, row: number, col: number, knownObjs: KnownItemInformation): boolean {
  return (item in knownObjs) && 
      (knownObjs[item].both || (
          (knownObjs[item].row !== row || 
            knownObjs[item].col !== col)));
}

/**
 * Takes in a FAQ help string function requiring a current context parameter
 * and calls it with the most relevant context string.
  */
function _faqContext(faqStrFn: Function, conv: DialogflowConversation<ConvData, {}, Contexts>) {
  let segment;
  if (conv.contexts.get(GameContexts.GAME)) {
    segment = Strings.guessContextSegment();
  } else if (conv.contexts.get(GameContexts.CONFIRM_LEVEL)) {
    segment = Strings.levelConfirmContextSegment(
      conv.data.level, conv.data.numRows, conv.data.numCols);
  } else {
    segment = Strings.levelSelectContextSegment();
  }
  return faqStrFn(segment);
}

/**
 * Utility method for shuffling array in place.
 * Credit: https://bost.ocks.org/mike/shuffle/
 *
 * @nondeterministic
 */
function _shuffle (array: string[]): string[] {
  let m = array.length, t, i;
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
 */
function _isOutOfBounds(row: number, col: number, maxRows: number, maxCols: number): boolean {
  return row < 0 || row >= maxRows || col < 0 || 
      col >= maxCols;
}

/**
 * Converts a user-input row letter to the corresponding array row index.
 */
function _letterToInt (letter: string) : number {
  return letter.toLowerCase().charCodeAt(0)-97;
}

/**
 * Converts a number array coordinate to the printable corresponding letter
 * row.
 */
function _intToLetter (number : number): string {
  return String.fromCharCode(97 + number).toUpperCase();
}

exports.memory = functions.https.onRequest(app);