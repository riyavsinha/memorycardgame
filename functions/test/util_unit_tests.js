/**
 * @fileoverview File for testing util methods in Memory class.
 */

const assert = require('assert');
const {
  Actions,
  Contexts,
  Memory,
  States
} = require('../index');
const {
  guessRequest,
  selectLevelRequest,
  contextualRequest,
  headerV1,
  headerV2,
  MockResponse,
  MockRequest,
  clone
} = require('./mocks');

setup(function() {
  mockRequest = new MockRequest(headerV1, {});
	mockResponse = new MockResponse();
  board = new Memory(mockRequest, mockResponse);
});

suite ('Util', function() {
	suite('#OutOfBounds', function () {

    setup(function() {
      board.data.numRows = 4;
      board.data.numCols = 3;
    })

		test('Row too low', function() {
      assert.ok(board.isOutOfBounds(-1, 2));
	  })

    test('Row too high', function() {
      assert.ok(board.isOutOfBounds(4, 2));
    })

    test('Col too low', function() {
      assert.ok(board.isOutOfBounds(2, -1));
    })

    test('Col too high', function() {
      assert.ok(board.isOutOfBounds(2, 3));
    })

	})

  suite('#LetterToInt', function () {

    test('A to 0', function() {
      assert.equal(board.letterToInt('A'), 0);
    })

    test('a to 0', function() {
      assert.equal(board.letterToInt('a'), 0);
    })

  })

  suite('#IntToLetter', function () {

    test('0 to A', function() {
      assert.equal('A', board.intToLetter(0));
    })

  })

  suite('#HasContext', function() {

  	setup(function() {
  		let req = clone(contextualRequest(
  			[Contexts.LEVEL_SELECT, Contexts.GAME]));
  		let mockRequest = new MockRequest(headerV1, req);
			let mockResponse = new MockResponse();
		  board = new Memory(mockRequest, mockResponse);
  	})

  	test('Has GameContext', function () {
  		assert.equal(true, board.hasContext(Contexts.GAME));
  	})

  	test('Has LevelSelectContext', function () {
  		assert.equal(true, board.hasContext(Contexts.LEVEL_SELECT));
  	})

  	test('Does not have PlayAgainYesContext', function () {
  		assert.equal(false, board.hasContext(Contexts.PLAY_AGAIN_YES));
  	})

  	test('Does not have LevelConfirmContext', function () {
  		assert.equal(false, board.hasContext(Contexts.CONFIRM_LEVEL));
  	})
  })

  suite('#FaqContext', function() {
    function strFn(context) {
  		return context;
  	}

  	test('Prioritizes game context', function () {
  		let req = clone(contextualRequest(
  			[Contexts.LEVEL_SELECT, Contexts.CONFIRM_LEVEL, Contexts.GAME]));
  		let mockRequest = new MockRequest(headerV1, req);
			let mockResponse = new MockResponse();
		  board = new Memory(mockRequest, mockResponse);

		  assert.equal('make a guess', board.faqContext(strFn));
  	})

  	test('Prioritizes confirm context if no game context', function () {
  		let req = clone(contextualRequest(
  			[Contexts.LEVEL_SELECT, Contexts.CONFIRM_LEVEL]));
  		let mockRequest = new MockRequest(headerV1, req);
			let mockResponse = new MockResponse();
		  board = new Memory(mockRequest, mockResponse);
		  board.data.level = 1;
		  board.data.numRows = 3;
		  board.data.numCols = 4;

		  assert.equal('confirm whether level 1, a 3 by 4 board, is ok.',
		    board.faqContext(strFn));
  	})

  	test('Level select segment when nothing else', function () {
  		let req = clone(contextualRequest([Contexts.LEVEL_SELECT]));
  		let mockRequest = new MockRequest(headerV1, req);
			let mockResponse = new MockResponse();
		  board = new Memory(mockRequest, mockResponse);

		  assert.equal('select a level between 1 and 10', board.faqContext(strFn));
  	})

  })

	suite('#IsKnown', function() {
		setup(function () {
			board.data.knownObjs = {
				"dog": {both: false, row: 2, col: 4},
				"cat": {both: true, row: 1, col: 5}
			}
		})

		test('Original coordinate when only one coordinate found has no ' +
				'information', function() {
			assert.equal(false, board.isKnown("dog", 2, 4));
		})

		test('New coordinate for item with one known coordinate has information',
				function() {
			assert.equal(true, board.isKnown("dog", 1, 3));		
		})

		test('Either coordinate for item with both known locations have ' +
				'information', function() {
			assert.equal(true, board.isKnown("cat", 1, 5));
			assert.equal(true, board.isKnown("cat", 2, 1));
		})
	})
})






























