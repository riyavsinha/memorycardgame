'use strict';

export class Strings {

	static welcome () {
		return 'Ok, let\'s play a memory matching game! What level would you ' +
			'like to play? If you\'d like to hear the rules, just say ' +
			'\'rules\'!';
	}

	static askRestart () {
		return 'You\'re already in the middle of a game. Are you sure ' +
			'you\'d like to restart? The current game will be lost.';
	}

	static askLevel (level: number, rows: number, cols: number) {
		return 'Ok, select a level between 1 and 10 to get started, ' +
			'or just confirm whether level ' + level + ', a ' + rows + ' by ' +
			cols + ' board, is ok.'
	}

	static rulesFaq (contextStr: string) {
		return 'I\'m thinking of a grid of objects. You should guess one ' +
			'letter-number coordinate at a time like \'B 1\' or \'C 3\' to ' +
			'flip a card. Every 2 guesses, if the cards are the same, ' +
			'they\'re matched. Your goal is to match all of the cards in as ' +
			'few guesses as possible. There are special guesses like lucky ' +
			'guesses, perfect guesses or missed guesses. Just ask to hear ' +
			'more about them! Or if you\'d like to continue, please '
			+ contextStr;
	}

	static luckyFaq(contextStr: string) {
		return 'A lucky guess is when two cards you have never flipped ' +
			'before match. You can also ask about perfect or missed ' +
			'guesses, or to continue, please ' + contextStr;
	}

	static perfectFaq(contextStr: string) {
		return 'A perfect match is when you can match a first card to it\'s ' +
			'matching card you\'ve seen before, before incorrectly guessing ' +
			'it\'s match as some other card. You can also ask about lucky ' +
			'or missed guesses, or to continue, please ' + contextStr;
	}

	static missedFaq(contextStr: string) {
		return 'An incorrect or missed guess is one where you had enough ' +
			'information to correctly match a first flipped card, but the ' +
			'second guessed card was incorrect You can also ask about lucky ' +
			'or perfect guesses, or to continue, please ' + contextStr;
	}

	static generalFaqFallback(contextStr: string) {
		return 'Sorry, I can only tell you more about lucky, perfect or ' +
			'missed guesses, or to continue the game ' + contextStr;
	}

	static levelSelectContextSegment () {
		return 'select a level between 1 and 10'
	}

	static levelConfirmContextSegment(level: number, rows: number, cols: number) {
		return 'confirm whether level ' + level + ', a ' + rows + ' by ' +
			cols + ' board, is ok.'
	}

	static guessContextSegment() {
		return 'make a guess';
	}

	static levelSelect (level: number, rows: number, cols: number) {
		return 'You selected level ' + level + '. This is a ' + rows + ' by ' +
		  	cols + ' board. Is that ok?';
	}

	static startGuessing () {
		return 'Ok, I\'m ready to play! What\'s your first guess? Use a' +
        ' letter-number coordinate.';
	}

	static outOfBoundsGuess (maxRow: string, maxCol: number) {
		return 'Hmm, that\'s not a coordinate on my grid. The rows go ' +
          'from A to ' + maxRow + ' and the columns go from 1 to ' +
          maxCol + '. Please guess again.';
	}

	static pairsLeft (n: number) {
		switch (n) {
			case 1: 
				return 'There is 1 pair left';
			default: 
				return 'There are ' + n + ' pairs left';
		}
	}

	static cardsLeft (n: number) {
		return 'There are ' + n + ' cards left';
	}

	static tooManyUnmatched (n: number) {
		return 'I\'m sorry, there are too many unmatched pairs left right ' +
			'now. I can help you when there are ' + n + ' pairs left.'
	}

	static justGuessedSegment () {
		return 'You just guessed that coordinate. ';
	}

	static alreadyMatchedGuess (coord: string, item: string) {
		return 'You\'ve already matched this coordinate. ' + coord +
			' was a ' + item;
	}

	static revealPhrase(coord: string, item: string) {
		return coord + ' is a ' + item + '. '
	}

	static correctMatch () {
		return 'That\'s a match!';
	}

	static incorrectMatch () {
		return 'Not a match';
	}

	static luckyGuessSegment() {
		return 'Lucky guess, that\'s a match!';
	}

	static perfectMemorySegment() {
		return 'Good memory! ';
	}

	static incorrectGuessSegment(n: number) {
		switch (n) {
			case 1:
				return 'There was 1 incorrect guess that could have been ' + 
					'correct.';
      default:
        return 'There were ' + n + ' incorrect guesses that could ' +
          'have been correct.';
    }
	}

	static guessFb1() {
		return 'Hm, I didn\'t get that. Please guess a letter for the row, ' +
			'and a number for the column, like "B2".';
	}

	static guessFb2() {
		return 'Please guess a letter row and a number column, like "A1"';
	}

	static endingPhrase(guesses: number) {
		return 'That\'s all of them! You won in ' + guesses + ' guesses. ';
	}

	static endingLuckyPhrase(numLucky: number) {
		return numLucky + ' of those were lucky. ';
	}

	static endingPerfectPhrase(numPerfect: number) {
		return numPerfect + ' of those were perfect recall. ';
	}

	static endingGreatJob() {
		return 'Great job!';
	}

	static playAgain() {
		return 'Would you like to play again?';
	}
}
