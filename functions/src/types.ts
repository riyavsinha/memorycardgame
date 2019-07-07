
// Game difficulty levels available and corresponding board size.
export const Levels: {[key: number]: number[]} = {
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

export const Objects = ["aardvark", "bat", "bear", "beaver", "bison", "boar",
    "butterfly", "camel", "capybara", "cat", "crab", "deer", "dog", "dolphin",
    "donkey", "duck", "eagle", "elephant", "fox", "giraffe", "goat", "horse",
    "kangaroo", "koala", "leopard", "lion", "lizard", "llama", "monkey",
    "mouse", "octopus", "panther", "parrot", "peacock", "penguin", "porcupine",
    "rabbit", "raven", "salmon", "shark", "sheep", "skunk", "sloth", "snake",
    "spider", "tiger", "toucan", "turkey", "turtle", "walrus", "whale", "wolf",
    "zebra"];

export enum States {
  UNKNOWN,
  SEEN,
  MISSED,
  MATCHED,
}

export type ConvData = {
  level: number,
  numRows: number,
  numCols: number,
  board: string[][],
  metaboard: number[][],
  pairsLeft: number,
  firstGuess: {
    row: number,
    col: number,
    item: string,
    state: States
  } | null,
  knownObjs: KnownItemInformation,
  numLucky: number,
  numMissed: number,
  numPerfect: number,
  numGuesses: number,
}

export type KnownItemInformation = {
  [key: string]: {both: boolean, row: number, col: number}
}

// Actions in DialogFlow Intents
export enum Actions {
  CARDS_LEFT = 'num_cards_left',
  CONFIRM_LEVEL = 'level_confirm',
  FAQ_GENERAL_FB = 'faq_general_fallback',
  FAQ_LUCKY = 'faq_lucky',
  FAQ_MISSED = 'faq_missed',
  FAQ_PERFECT = 'faq_perfect',
  FAQ_RULES = 'faq_rules',
  GUESS = 'guess',
  GUESS_FB = 'guess_fb',
  IMPLICIT_LEVEL_SELECT = 'implicit_level_select',
  LEVEL_SELECT = 'level_select',
  LIST_UNMATCHED = 'list_unmatched',
  PAIRS_LEFT = 'num_pairs_left',
  WELCOME = 'welcome',
};

export enum GameContexts {
  LEVEL_SELECT = 'level-select',
  LEVEL_SELECT_FB = 'level-select-fb',
  CONFIRM_LEVEL = 'level-confirm',
  GAME = 'game',
  GAME_FB = 'game-fb',
  PLAY_AGAIN_YES = 'play-again-yes',
  PLAY_AGAIN_NO = 'play-again-no',
  PLAY_AGAIN_FB = 'play-again-fb',
  RESTART_YES = 'restart-yes',
  RESTART_NO = 'restart-no',
  RESTART_FB = 'restart-fb',
}

export const NumberWords : {[key: string] : number} = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10
}