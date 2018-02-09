const assert = require('assert');
const {
  Actions,
  Memory,
  States
} = require('../index');
const {
  guessRequest,
  selectLevelRequest,
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

suite( 'UnitTests', function () {

  suite('#' + Actions.LEVEL_SELECT, function () {

    test('Sets correct number of rows and columns for level 2', function() {
      // Setup board
      levelRequest = clone(selectLevelRequest(2));
      mockRequest = new MockRequest(headerV1, levelRequest);
      board = new Memory(mockRequest, mockResponse);

      // Perform action
      board[Actions.LEVEL_SELECT]();

      // Assert board state
      assert.equal(board.data.numRows, 3);
      assert.equal(board.data.numCols, 4);

      // Dialog assertion
      assert.equal(mockResponse.body.speech.trim(),
        'You selected level 2. This is a 3 by 4 board. Is that ok?');
    })

    test('Sets correct number of rows and columns for level 8', function() {
      // Setup board
      levelRequest = clone(selectLevelRequest(8));
      mockRequest = new MockRequest(headerV1, levelRequest);
      board = new Memory(mockRequest, mockResponse);

      // Perform action
      board[Actions.LEVEL_SELECT]();

      // Assert board state
      assert.equal(board.data.numRows, 7);
      assert.equal(board.data.numCols, 8);

      // Dialog assertion
      assert.equal(mockResponse.body.speech.trim(),
        'You selected level 8. This is a 7 by 8 board. Is that ok?', );
    })

  })

  suite('#' + Actions.LIST_UNMATCHED, function() {

    test('Fresh 3x4 board, does not list unmatched coords', function () {
        board.data.numRows = 3;
        board.data.numCols = 4;
        board.data.pairsLeft = 6;

        // Perform action
        board[Actions.LIST_UNMATCHED]();

        assert.equal('I\'m sorry, there are too many unmatched pairs left' +
            ' right now. I can help you when there are 2 pairs left.',
            mockResponse.body.speech.trim());
    })

    test('3x4 board, 2 pairs left, lists coordinates', function () {
        board.data.numRows = 3;
        board.data.numCols = 4;
        board.data.pairsLeft = 2;
        board.data.metaboard = [];
        for (var i = 0; i < board.data.numRows; i++) {
          board.data.metaboard.push(
            Array(board.data.numCols).fill(States.MATCHED));
        }
        setMetaboardState(board, 'a', '2', States.UNKNOWN);
        setMetaboardState(board, 'c', '1', States.UNKNOWN);
        setMetaboardState(board, 'b', '1', States.UNKNOWN);
        setMetaboardState(board, 'c', '4', States.UNKNOWN);

        // Perform action
        board[Actions.LIST_UNMATCHED]();

        assert.equal('A2, B1, C1, C4', mockResponse.body.speech.trim());
    })

    test('Fresh 8x10', function () {
        board.data.numRows = 8;
        board.data.numCols = 10;
        board.data.pairsLeft = 40;

        // Perform action
        board[Actions.LIST_UNMATCHED]();

        assert.equal('I\'m sorry, there are too many unmatched pairs left' +
            ' right now. I can help you when there are 14 pairs left.',
            mockResponse.body.speech.trim());
    })
  })

  suite('#' + Actions.PAIRS_LEFT, function () {

    test('Plural', function() {
        setupBoard(board);

        // Perform action
        board[Actions.PAIRS_LEFT]();

        // Dialog assertion
        assert.equal('There are 2 pairs left', mockResponse.body.speech.trim());
    })

    test('Singular', function() {
        setupBoard(board);
        board.data.pairsLeft = 1;

        // Perform action
        board[Actions.PAIRS_LEFT]();

        // Dialog assertion
        assert.equal('There is 1 pair left', mockResponse.body.speech.trim());
    })
  })

  suite('#' + Actions.CARDS_LEFT, function () {

    test('4 Cards in 2x2 board', function() {
        setupBoard(board);

        // Perform action
        board[Actions.CARDS_LEFT]();

        // Dialog assertion
        assert.equal('There are 4 cards left', mockResponse.body.speech.trim());
    })

    test('2 Cards in 2x2 board, 2 matched', function() {
        board.data.pairsLeft = 1;

        // Perform action
        board[Actions.CARDS_LEFT]();

        // Dialog assertion
        assert.equal('There are 2 cards left', mockResponse.body.speech.trim());
    })
  })

  suite('#' + Actions.GUESS, function () {

    suite('> Invalid Guesses', function() {

      test('Column too high', function() {
        setupGuessRequest('a', '3')

        // Perform action
        board[Actions.GUESS]();

        // Dialog assertions
        assert.equal('Hmm, that\'s not a coordinate on my grid. The rows go' +
          ' from A to B and the columns go from 1 to 2. Please guess again.',
          mockResponse.body.speech.trim());
      })

      test('Column too low', function() {
        setupGuessRequest('a', '0')

        // Perform action
        board[Actions.GUESS]();

        // Dialog assertions
        assert.equal('Hmm, that\'s not a coordinate on my grid. The rows go' +
          ' from A to B and the columns go from 1 to 2. Please guess again.',
          mockResponse.body.speech.trim());
      })

      test('Row too high', function() {
        setupGuessRequest('c', '1')

        // Perform action
        board[Actions.GUESS]();

        // Dialog assertions
        assert.equal('Hmm, that\'s not a coordinate on my grid. The rows go' +
          ' from A to B and the columns go from 1 to 2. Please guess again.',
          mockResponse.body.speech.trim());
      })

      test('Already matched guess adds penalty guess', function() {
         // Set guess coordinates
        let row = 'a';
        let col = '1';

        setupGuessRequest(row, col)
        setMetaboardState(board, row, col, States.MATCHED);

        // Check pre board state
        assert.equal(board.data.numGuesses, 0);

        // Perform action
        board[Actions.GUESS]();

        // Check post board state
        assert.equal(board.data.numGuesses, 1);

        // Dialog assertion
        assert.equal('You\'ve already matched this coordinate. A1 was a a',
          mockResponse.body.speech.trim());

      })

      test('Repeated first guess repeats object without penalty', function() {
        // Set guess coordinates
        let row = 'a';
        let col = '1';

        setupGuessRequest(row, col)
        board.data.firstGuess = {
          row: 0, 
          col: 0,
          item: 'a',
          state: States.UNKNOWN
        }
        firstGuess = board.data.firstGuess;

        // Check pre board state
        assert.equal(getMetaboardState(board, row, col), States.UNKNOWN);
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 0);
        assert.ok(board.data.firstGuess);

        // Perform action
        board[Actions.GUESS]();

        // Check post state
        assert.equal(getMetaboardState(board, row, col), States.UNKNOWN);
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 0);
        assert.ok(board.data.firstGuess);

        // Dialog assertions
        assert.equal('You just guessed that coordinate. A1 is a a.',
          mockResponse.body.speech.trim());
      })

      test('After OOB first guess, first guess remains null', function() {
        // Set guess coordinates
        let row = 'c';
        let col = '3';

        setupGuessRequest(row, col)

        // Perform action
        board[Actions.GUESS]();

        // Class assertion
        assert.equal(null, board.data.firstGuess);
      })

      test('After OOB second guess, first guess remains', function() {
        // Set guess coordinates
        let row = 'c';
        let col = '3';

        setupGuessRequest(row, col)
        board.data.firstGuess = {
          row: 0,
          col: 0,
          item: 'a',
          state: States.UNKNOWN
        }

        // Perform action
        board[Actions.GUESS]();

        // Class assertion
        assert.ok(board.data.firstGuess);
      })

      test('After already matched first guess, first guess remains null', 
        function() {
         // Set guess coordinates
        let row = 'a';
        let col = '1';

        setupGuessRequest(row, col)
        setMetaboardState(board, row, col, States.MATCHED);

        // Perform action
        board[Actions.GUESS]();

        // Class assertions
        assert.equal(null, board.data.firstGuess);

      })

      test('After OOB second guess, first guess remains', function() {
        // Set guess coordinates
        let row = 'c';
        let col = '3';

        setupGuessRequest(row, col)
        board.data.firstGuess = {
          row: 0,
          col: 0,
          item: 'a',
          state: States.UNKNOWN
        }

        // Perform action
        board[Actions.GUESS]();

        // Class assertion
        assert.ok(board.data.firstGuess);
      })

      test('After already matched second guess, first guess remains', 
        function() {
         // Set guess coordinates
        let row = 'a';
        let col = '1';

        // Setup board
        setupGuessRequest(row, col)
        setMetaboardState(board, row, col, States.MATCHED);
        board.data.firstGuess = {
          row: 0,
          col: 0,
          item: 'a',
          state: States.UNKNOWN
        }

        // Perform action
        board[Actions.GUESS]();

        // Class assertion
        assert.ok(board.data.firstGuess);

      })

    })

    suite('> Correct Matches', function() {

      test('Perfect match when first card unknown, second seen', function() {
        // Set guess coordinates
        let row = 'a';
        let col = '1';

        // Setup board
        setupGuessRequest(row, col);
        setMetaboardState(board, 'a', '1', States.SEEN)
        board.data.firstGuess = {
          row: 0,
          col: 1,
          item: 'a',
          state: States.UNKNOWN
        }
        firstGuess = board.data.firstGuess;

        // Check pre state
        assert.equal(getMetaboardState(board, row, col), States.SEEN);
        assert.equal(board.data.firstGuess.state, States.UNKNOWN);
        assert.equal(board.data.pairsLeft, 2);

        // Perform action
        board[Actions.GUESS]();

        // Check post state
        assert.equal(getMetaboardState(board, row, col), States.MATCHED);
        assert.equal(
            getMetaboardState(
                board,
                firstGuess.row,
                firstGuess.col),
            States.MATCHED);
        assert.equal(board.data.pairsLeft, 1);
        assert.equal(board.data.numPerfect, 1);

        // Dialog assertions
        assert.equal('A1 is a a. Good memory! That\'s a match!',
          mockResponse.body.speech.trim());
      })

      test('Perfect match when first card seen, second seen', function() {
        // Set guess coordinates
        let row = 'a';
        let col = '1';

        // Setup board
        setupGuessRequest(row, col);
        setMetaboardState(board, 'a', '1', States.SEEN)
        board.data.firstGuess = {
          row: 0,
          col: 1,
          item: 'a',
          state: States.SEEN
        }
        firstGuess = board.data.firstGuess;

        // Check pre state
        assert.equal(board.data.firstGuess.state, States.SEEN);
        assert.equal(getMetaboardState(board, row, col), States.SEEN);
        assert.equal(board.data.pairsLeft, 2);

        // Perform action
        board[Actions.GUESS]();

        // Check post state
        assert.equal(
            getMetaboardState(board, firstGuess.row, firstGuess.col),
            States.MATCHED);
        assert.equal(getMetaboardState(board, row, col), States.MATCHED);
        assert.equal(board.data.pairsLeft, 1);
        assert.equal(board.data.numPerfect, 1);

        // Dialog assertions
        assert.equal('A1 is a a. Good memory! That\'s a match!',
          mockResponse.body.speech.trim());
      })

      test('Not perfect match when first card already missed', function() {
        // Set guess coordinates
        let row = 'a';
        let col = '1';

        // Setup board
        setupGuessRequest(row, col);
        setMetaboardState(board, 'a', '1', States.SEEN)
        board.data.firstGuess = {
          row: 0,
          col: 1,
          item: 'a',
          state: States.MISSED
        }
        firstGuess = board.data.firstGuess;

        // Check pre state
        assert.equal(board.data.firstGuess.state, States.MISSED);
        assert.equal(getMetaboardState(board, row, col), States.SEEN);
        assert.equal(board.data.pairsLeft, 2);

        // Perform action
        board[Actions.GUESS]();

        // Check post state
        assert.equal(
            getMetaboardState(board, firstGuess.row, firstGuess.col),
            States.MATCHED);
        assert.equal(getMetaboardState(board, row, col), States.MATCHED);
        assert.equal(board.data.pairsLeft, 1);
        assert.equal(board.data.numPerfect, 0);

        // Dialog assertions
        assert.equal('A1 is a a. That\'s a match!',
          mockResponse.body.speech.trim());
      })
      
      test('Lucky match when both cards unknown', function() {
        // Set guess coordinates
        let row = 'a';
        let col = '1';

        // Setup board
        setupGuessRequest(row, col);
        board.data.firstGuess = {
          row: 0,
          col: 1,
          item: 'a',
          state: States.UNKNOWN
        }
        firstGuess = board.data.firstGuess;

        // Check pre state
        assert.equal(getMetaboardState(board, row, col), States.UNKNOWN);
        assert.equal(board.data.firstGuess.state, States.UNKNOWN);
        assert.equal(board.data.pairsLeft, 2);

        // Perform action
        board[Actions.GUESS]();

        // Check post state
        assert.equal(getMetaboardState(board, row, col), States.MATCHED);
        assert.equal(
            getMetaboardState(
                board,
                firstGuess.row,
                firstGuess.col),
            States.MATCHED);
        assert.equal(board.data.pairsLeft, 1);
        assert.equal(board.data.numLucky, 1);

        // Dialog assertions
        assert.equal('A1 is a a. Lucky guess, that\'s a match!',
          mockResponse.body.speech.trim());
      })

    })

    /**
     * This suite has multiple combinations and uses the following terminology:
     *     - Unseen: A never seen card
     *     - Original: A guessed card
     *     - Mirror: A card with the same item as an already guessed card 
     *
     * All guesses here guess 'b' first (row 1), and then 'a' (row 1)
     * Original guesses are first column (0), Mirror guesses are second (1)    
     */
    suite('> Incorrect Matches', function() {
      var row, col, guess, firstGuess;

      setup(function () {
        // Set guess coordinates to A1
        row = 'a';
        col = '1';

        setupGuessRequest(row, col);
        board.data.firstGuess = {
          row: 1,
          col: 0,
          item: 'b',
          state: States.UNKNOWN
        }
        firstGuess = board.data.firstGuess;
      })

      test('1: Unseen, 2: Unseen', function() {

        // Check board pre state
        assert.equal(firstGuess.state, States.UNKNOWN);
        assert.equal(getMetaboardState(board, row, col), States.UNKNOWN);

        // Check board pre stats
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 0)
        assert.equal(board.data.numMissed, 0)
        assert.equal(Object.keys(board.data.knownObjs).length, 0);

        // Perform action
        board[Actions.GUESS]();

        // Check board post state
        assert.equal(
            getMetaboardState(board, firstGuess.row, firstGuess.col),
            States.SEEN);
        assert.equal(getMetaboardState(board, row, col), States.SEEN);
        

        // Check board post stats
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 1);
        assert.equal(board.data.numMissed, 0)
        assert.equal(Object.keys(board.data.knownObjs).length, 2);
        assert.deepEqual(
          board.data.knownObjs['a'], {both: false, row: 0, col: 0});
        assert.deepEqual(
          board.data.knownObjs['b'], {both: false, row: 1, col: 0});

        // Dialog assertions
        assert.equal('A1 is a a. Not a match',
          mockResponse.body.speech.trim());
      })

      test('1: Unseen, 2: Original', function() {
        // Set second guess to seen and known
        setMetaboardState(board, 'a', '1', States.SEEN)
        board.data.knownObjs['a'] = {both: false, row: 0, col: 0};

        // Check board pre state
        assert.equal(board.data.firstGuess.state, States.UNKNOWN);
        assert.equal(getMetaboardState(board, row, col), States.SEEN);

        // Check board pre stats
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 0)
        assert.equal(board.data.numMissed, 0)
        assert.equal(Object.keys(board.data.knownObjs).length, 1);
        assert.deepEqual(
            board.data.knownObjs['a'], {both: false, row: 0, col: 0});

        // Perform action
        board[Actions.GUESS]();

        // Check board post state
        assert.equal(
            getMetaboardState(board, firstGuess.row, firstGuess.col),
            States.SEEN);
        assert.equal(getMetaboardState(board, row, col), States.SEEN);

        // Check board post stats
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 1);
        assert.equal(board.data.numMissed, 0)
        assert.equal(Object.keys(board.data.knownObjs).length, 2);
        assert.deepEqual(
            board.data.knownObjs['a'], {both: false, row: 0, col: 0});
        assert.deepEqual(
            board.data.knownObjs['b'], {both: false, row: 1, col: 0});

        // Dialog assertions
        assert.equal('A1 is a a. Not a match',
          mockResponse.body.speech.trim());
      })

      test('1: Unseen, 2: Mirror', function() {
        // Set second guess to known only
        board.data.knownObjs['a'] = {both: false, row: 0, col: 1};

        // Check board pre state
        assert.equal(board.data.firstGuess.state, States.UNKNOWN);
        assert.equal(getMetaboardState(board, row, col), States.UNKNOWN);

        // Check board pre stats
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 0)
        assert.equal(board.data.numMissed, 0)
        assert.equal(Object.keys(board.data.knownObjs).length, 1);
        assert.deepEqual(
            board.data.knownObjs['a'], {both: false, row: 0, col: 1});

        // Perform action
        board[Actions.GUESS]();

        // Check board post state
        assert.equal(
            getMetaboardState(board, firstGuess.row, firstGuess.col),
            States.SEEN);
        assert.equal(getMetaboardState(board, row, col), States.SEEN);

        // Check board post stats
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 1);
        assert.equal(board.data.numMissed, 0);
        assert.equal(Object.keys(board.data.knownObjs).length, 2);
        assert.deepEqual(
            board.data.knownObjs['a'], {both: true, row: 0, col: 1});
        assert.deepEqual(
            board.data.knownObjs['b'], {both: false, row: 1, col: 0});

        // Dialog assertions
        assert.equal('A1 is a a. Not a match',
          mockResponse.body.speech.trim());
      })

      test('1: Original, 2: Unseen', function() {
        // Set guess coordinates
        setMetaboardState(board, 'b', '1', States.SEEN);;
        board.data.firstGuess.state = States.SEEN;
        board.data.knownObjs['b'] = {both: false, row: 1, col: 0};


        // Check pre state
        assert.equal(board.data.firstGuess.state, States.SEEN);
        assert.equal(getMetaboardState(board, row, col), States.UNKNOWN);
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 0)
        assert.equal(Object.keys(board.data.knownObjs).length, 1);
        assert.deepEqual(
            board.data.knownObjs['b'], {both: false, row: 1, col: 0});

        // Perform action
        board[Actions.GUESS]();

        // Check post state
        assert.equal(getMetaboardState(board, row, col), States.SEEN);
        assert.equal(
            getMetaboardState(board, firstGuess.row, firstGuess.col),
            States.SEEN);
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 1);
        assert.equal(Object.keys(board.data.knownObjs).length, 2);
        assert.deepEqual(
            board.data.knownObjs['a'], {both: false, row: 0, col: 0});
        assert.deepEqual(
            board.data.knownObjs['b'], {both: false, row: 1, col: 0});

        // Dialog assertions
        assert.equal('A1 is a a. Not a match',
          mockResponse.body.speech.trim());
      })

      test('1: Original (Mirror Seen), 2: Other Mirror [MISSED]', function() {
        // Set guess coordinates
        setMetaboardState(board, 'a', '2', States.SEEN);
        setMetaboardState(board, 'a', '1', States.SEEN);
        setMetaboardState(board, 'b', '1', States.SEEN);
        setMetaboardState(board, 'b', '2', States.SEEN);
        board.data.firstGuess.state = States.SEEN;
        board.data.knownObjs['a'] = {both: true, row: 0, col: 1};
        board.data.knownObjs['b'] = {both: true, row: 1, col: 0};


        // Check pre state
        assert.equal(board.data.firstGuess.state, States.SEEN);
        assert.equal(getMetaboardState(board, row, col), States.SEEN);
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 0)
        assert.equal(Object.keys(board.data.knownObjs).length, 2);
        assert.deepEqual(
            board.data.knownObjs['a'], {both: true, row: 0, col: 1});
        assert.deepEqual(
            board.data.knownObjs['b'], {both: true, row: 1, col: 0});

        // Perform action
        board[Actions.GUESS]();

        // Check post state
        assert.equal(
            getMetaboardState(board, firstGuess.row, firstGuess.col),
            States.MISSED);
        assert.equal(getMetaboardState(board, row, col), States.SEEN);
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 1);
        assert.equal(Object.keys(board.data.knownObjs).length, 2);
        assert.deepEqual(
            board.data.knownObjs['a'], {both: true, row: 0, col: 1});
        assert.deepEqual(
            board.data.knownObjs['b'], {both: true, row: 1, col: 0});

        // Dialog assertions
        assert.equal('A1 is a a. Not a match',
          mockResponse.body.speech.trim());
      })

      test('1: Mirror, 2: Unseen [MISSED]', function() {
        board.data.knownObjs['b'] = {both: false, row: 1, col: 1};

        // Check board pre state
        assert.equal(board.data.firstGuess.state, States.UNKNOWN);
        assert.equal(getMetaboardState(board, row, col), States.UNKNOWN);

        // Check board pre stats
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 0);
        assert.equal(board.data.numMissed, 0);
        assert.equal(Object.keys(board.data.knownObjs).length, 1);
        assert.deepEqual(
            board.data.knownObjs['b'], {both: false, row: 1, col: 1});

        // Perform action
        board[Actions.GUESS]();

        // Check board post state
        assert.equal(
            getMetaboardState(board, firstGuess.row, firstGuess.col),
            States.MISSED);
        assert.equal(getMetaboardState(board, row, col), States.SEEN);
        
        // Check board post stats
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 1);
        assert.equal(board.data.numMissed, 1);
        assert.equal(Object.keys(board.data.knownObjs).length, 2);
        assert.deepEqual(
            board.data.knownObjs['a'], {both: false, row: 0, col: 0});
        assert.deepEqual(
            board.data.knownObjs['b'], {both: true, row: 1, col: 1});

        // Dialog assertions
        assert.equal('A1 is a a. Not a match',
          mockResponse.body.speech.trim());
      })

      test('1: Mirror, 2: Mirror [MISSED]', function() {
        setMetaboardState(board, 'a', '1', States.SEEN); 
        board.data.firstGuess.state = States.SEEN;
        board.data.knownObjs['a'] = {both: false, row: 0, col: 1};
        board.data.knownObjs['b'] = {both: false, row: 1, col: 1};

        // Check board pre state
        assert.equal(board.data.firstGuess.state, States.SEEN);
        assert.equal(getMetaboardState(board, row, col), States.SEEN);

        // Check board pre stats
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 0)
        assert.equal(board.data.numMissed, 0)
        assert.equal(Object.keys(board.data.knownObjs).length, 2);
        assert.deepEqual(
            board.data.knownObjs['a'], {both: false, row: 0, col: 1});
        assert.deepEqual(
            board.data.knownObjs['b'], {both: false, row: 1, col: 1});

        // Perform action
        board[Actions.GUESS]();

        // Check board post state
        assert.equal(
            getMetaboardState(board, firstGuess.row, firstGuess.col),
            States.MISSED);
        assert.equal(getMetaboardState(board, row, col), States.SEEN);
        
        // Check board post stats
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 1)
        assert.equal(board.data.numMissed, 1);
        assert.equal(Object.keys(board.data.knownObjs).length, 2);
        assert.deepEqual(
            board.data.knownObjs['a'], {both: true, row: 0, col: 1});
        assert.deepEqual(
            board.data.knownObjs['b'], {both: true, row: 1, col: 1});

        // Dialog assertions
        assert.equal('A1 is a a. Not a match',
          mockResponse.body.speech.trim());
      })

    })

    suite('> End Conditions', function() {

      test('No special guesses', function() {
        // Set guess coordinates
        let row = 'a';
        let col = '1';

        // Setup board
        setupGuessRequest(row, col);
        setMetaboardState(board, 'a', '1', States.SEEN)
        board.data.pairsLeft = 1;
        board.data.firstGuess = {
          row: 0,
          col: 1,
          item: 'a',
          state: States.MISSED
        }
        firstGuess = board.data.firstGuess;

        // Perform action
        board[Actions.GUESS]();

        // Dialog assertions
        assert.equal('A1 is a a. That\'s all of them! You won in 1 guesses.' +
            ' Great job!',
          mockResponse.body.speech.trim());
      })      
    
      test('With prior lucky guesses', function() {
        // Set guess coordinates
        let row = 'a';
        let col = '1';

        // Setup board
        setupGuessRequest(row, col);
        setMetaboardState(board, 'a', '1', States.SEEN)
        board.data.pairsLeft = 1;
        board.data.numLucky = 1;
        board.data.firstGuess = {
          row: 0,
          col: 1,
          item: 'a',
          state: States.MISSED
        }
        firstGuess = board.data.firstGuess;

        // Perform action
        board[Actions.GUESS]();

        // Dialog assertions
        assert.equal('A1 is a a. That\'s all of them! You won in 1 guesses. 1' +
             ' of those were lucky. Great job!',
          mockResponse.body.speech.trim());
      })

      test('With prior perfect guesses', function() {
        // Set guess coordinates
        let row = 'a';
        let col = '1';

        // Setup board
        setupGuessRequest(row, col);
        setMetaboardState(board, 'a', '1', States.SEEN)
        board.data.pairsLeft = 1;
        board.data.numPerfect = 1;
        board.data.firstGuess = {
          row: 0,
          col: 1,
          item: 'a',
          state: States.MISSED
        }
        firstGuess = board.data.firstGuess;

        // Perform action
        board[Actions.GUESS]();

        // Dialog assertions
        assert.equal('A1 is a a. That\'s all of them! You won in 1 guesses. 1' +
             ' of those were perfect recall. Great job!',
          mockResponse.body.speech.trim());
      })

      test('With prior lucky and perfect guesses', function() {
        // Set guess coordinates
        let row = 'a';
        let col = '1';

        // Setup board
        setupGuessRequest(row, col);
        setMetaboardState(board, 'a', '1', States.SEEN)
        board.data.pairsLeft = 1;
        board.data.numPerfect = 1;
        board.data.numLucky = 1;
        board.data.firstGuess = {
          row: 0,
          col: 1,
          item: 'a',
          state: States.MISSED
        }
        firstGuess = board.data.firstGuess;

        // Perform action
        board[Actions.GUESS]();

        // Dialog assertions
        assert.equal('A1 is a a. That\'s all of them! You won in 1 guesses.' +
              ' 1 of those were lucky. 1 of those were perfect recall. Great' +
              ' job!',
          mockResponse.body.speech.trim());
      })

      test('No lucky guess on ending guess', function() {
        // Set guess coordinates
        let row = 'a';
        let col = '1';

        // Setup board
        setupGuessRequest(row, col);
        board.data.pairsLeft = 1;
        board.data.firstGuess = {
          row: 0,
          col: 1,
          item: 'a',
          state: States.UNKNOWN
        }
        firstGuess = board.data.firstGuess;

        // Perform action
        board[Actions.GUESS]();

        // Dialog assertions
        assert.equal('A1 is a a. That\'s all of them! You won in 1 guesses.' +
            ' Great job!',
          mockResponse.body.speech.trim());
      })

      test('No lucky guess on ending guess with prior lucky guess', function() {
        // Set guess coordinates
        let row = 'a';
        let col = '1';

        // Setup board
        setupGuessRequest(row, col);
        board.data.pairsLeft = 1;
        board.data.numLucky = 1;
        board.data.firstGuess = {
          row: 0,
          col: 1,
          item: 'a',
          state: States.UNKNOWN
        }
        firstGuess = board.data.firstGuess;

        // Perform action
        board[Actions.GUESS]();

        // Dialog assertions
        assert.equal('A1 is a a. That\'s all of them! You won in 1 guesses. '+
              '1 of those were lucky. Great job!',
          mockResponse.body.speech.trim());
      })

      test('Perfect match on ending game', function() {
        // Set guess coordinates
        let row = 'a';
        let col = '1';

        // Setup board
        setupGuessRequest(row, col);
        setMetaboardState(board, 'a', '1', States.SEEN)
        board.data.pairsLeft = 1;
        board.data.firstGuess = {
          row: 0,
          col: 1,
          item: 'a',
          state: States.UNKNOWN
        }
        firstGuess = board.data.firstGuess;

        // Check pre state
        assert.equal(getMetaboardState(board, row, col), States.SEEN);
        assert.equal(board.data.firstGuess.state, States.UNKNOWN);
        assert.equal(board.data.pairsLeft, 1);

        // Perform action
        board[Actions.GUESS]();

        // Check post state
        assert.equal(getMetaboardState(board, row, col), States.MATCHED);
        assert.equal(
            getMetaboardState(
                board,
                firstGuess.row,
                firstGuess.col),
            States.MATCHED);
        assert.equal(board.data.pairsLeft, 0);
        assert.equal(board.data.numPerfect, 1);

        // Dialog assertions
        assert.equal('A1 is a a. Good memory! That\'s all of them! You won' +
          ' in 1 guesses. 1 of those were perfect recall. Great job!',
          mockResponse.body.speech.trim());
      })

    })

    suite('> First Guess', function() {

      test('A first guess for a card retains state', function() {
        // Set guess coordinates
        let row = 'a';
        let col = '1';

        // Setup board
        setupGuessRequest(row, col);

        // Check pre state
        assert.equal(States.UNKNOWN, getMetaboardState(board, row, col))

        // Perform action
        board[Actions.GUESS]();

        // Check post state
        assert.equal(States.UNKNOWN, getMetaboardState(board, row, col));
        assert.equal(board.data.pairsLeft, 2);
        assert.equal(board.data.numGuesses, 0);

        // Dialog assertions
        assert.equal('A1 is a a.', mockResponse.body.speech.trim());
      })

      test('A first guess is saved for future guess', function() {
        // Set guess coordinates
        let row = 'a';
        let col = '1';

        // Setup board
        setupGuessRequest(row, col);

        // Perform action
        board[Actions.GUESS]();

        // Check saved structure
        let expectedStructure =
           {row: 0, col: 0, item: 'a', state: States.UNKNOWN}
        assert.deepEqual(board.data.firstGuess, expectedStructure);
      })

    })
    

  })

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

  suite('#intToLetter', function () {

    test('0 to A', function() {
      assert.equal('A', board.intToLetter(0));
    })

  })

})

function setupBoard(b) {
  b.data.numRows = 2;
  b.data.numCols = 2;
  b.data.board = [['a', 'a'], 
                  ['b', 'b']];
  b.data.metaboard = [[States.UNKNOWN, States.UNKNOWN],
                      [States.UNKNOWN, States.UNKNOWN]];
  b.data.knownObjs = new Map();
  b.data.pairsLeft = 2;
  b.data.numLucky = 0;;
  b.data.numPerfect = 0;
  b.data.numMissed = 0
  b.data.numGuesses = 0;
}

function setupGuessRequest(r, c) {
    // Setup board
    guess = clone(guessRequest(r, c));
    mockRequest = new MockRequest(headerV1, guess);
    board = new Memory(mockRequest, mockResponse);
    setupBoard(board);
}

function getMetaboardState(board, row, col) {
  let r;
  let c;
  if (typeof(row) === "string") {
    r = board.letterToInt(row);
  } else {
    r = row;
  }
  if (typeof(col) === "string") {
    c = parseInt(col)-1
  } else {
    c = col;
  }
  return board.data.metaboard[r][c];
}

function setMetaboardState(board, row, col, state) {
  let r;
  let c;
  if (typeof(row) === "string") {
    r = board.letterToInt(row);
  } else {
    r = row;
  }
  if (typeof(col) === "string") {
    c = parseInt(col)-1
  } else {
    c = col;
  }
  board.data.metaboard[r][c] = state;
}