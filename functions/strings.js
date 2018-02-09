'use strict';

class Strings {

	static levelSelect (level, rows, cols) {
		return 'You selected level ' + level + '. This is a ' + rows + ' by ' +
		  	cols + ' board. Is that ok?';
	}

	static startGuessing () {
		return 'Ok, I\'m ready to play! What\'s your first guess? Use a' +
        ' letter-number coordinate.';
	}

	static outOfBoundsGuess (maxRow, maxCol) {
		return 'Hmm, that\'s not a coordinate on my grid. The rows go ' +
          'from A to ' + maxRow + ' and the columns go from 1 to ' +
          maxCol + '. Please guess again.';
	}

	static pairsLeft (n) {
		switch (n) {
			case 1: 
				return 'There is 1 pair left';
			default: 
				return 'There are ' + n + ' pairs left';
		}
	}

	static cardsLeft (n) {
		return 'There are ' + n + ' cards left';
	}

	static tooManyUnmatched (n) {
		return 'I\'m sorry, there are too many unmatched pairs left right ' +
			'now. I can help you when there are ' + n + ' pairs left.'
	}

	static justGuessedSegment () {
		return 'You just guessed that coordinate. ';
	}

	static alreadyMatchedGuess (row, col, item) {
		return 'You\'ve already matched this coordinate. ' + row+col +
			' was a ' + item;
	}

	static revealPhrase(row, col, item) {
		return row+col+ ' is a ' + item + '. '
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

	static incorrectGuessSegment(n) {
		switch (n) {
			case 1:
				return 'There was 1 incorrect guess that could have been ' + 
					'correct.';
            default:
            	return 'There were ' + n + ' incorrect guesses that could ' +
            		'have been correct.';
         }
	}

	static endingPhrase(guesses) {
		return 'That\'s all of them! You won in ' + guesses + ' guesses. ';
	}

	static endingLuckyPhrase(numLucky) {
		return numLucky + ' of those were lucky. ';
	}

	static endingPerfectPhrase(numPerfect) {
		return numPerfect + ' of those were perfect recall. ';
	}

	static endingGreatJob() {
		return 'Great job!';
	}
}

module.exports = Strings;
