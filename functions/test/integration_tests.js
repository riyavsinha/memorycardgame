const DialogflowApp = require('actions-on-google').DialogflowApp;
const assert = require('assert');
const {
  Actions,
  Memory,
  States
} = require('../index');
const {
  blankRequest,
  guessRequest,
  selectLevelRequest,
  headerV1,
  headerV2,
  MockResponse,
  MockRequest,
  clone
} = require('./mocks');

var board;

suite( 'Integration Tests', function() {

  setup(function () {
    var mockRequest = new MockRequest(headerV1, {});
    board = new Memory(mockRequest, mockResponse);
    board.data.numCols = 2;
    board.data.numRows = 2;
    board[Actions.CONFIRM_LEVEL] ()
    board.data.board = [['dog', 'cat'], 
                        ['dog', 'cat']];
  })

  test('[2x2] Finish in 2 guesses, one lucky', function() {
    // Guess 1
    performGuess('a', '1');
    assert.equal('A1 is a dog.', mockResponse.body.speech.trim());

    performGuess('b', '1');
    assert.equal(
      'B1 is a dog. Lucky guess, that\'s a match!',
      mockResponse.body.speech.trim());

    // Guess 2
    performGuess('a', '2');
    assert.equal('A2 is a cat.', mockResponse.body.speech.trim());

    performGuess('b', '2');
    assert.equal(
      'B2 is a cat. That\'s all of them! You won in 2 guesses. 1 of those ' +
          'were lucky. Great job! Would you like to play again?',
       mockResponse.body.speech.trim());
  })

  test('[2x2] Finish in 3 guesses, 2 perfect, no lucky', function() {
    // Guess 1
    performGuess('a', '1');
    assert.equal('A1 is a dog.', mockResponse.body.speech.trim());

    performGuess('a', '2');
    assert.equal('A2 is a cat. Not a match', mockResponse.body.speech.trim());

    // Guess 2
    performGuess('b', '1');
    assert.equal('B1 is a dog.', mockResponse.body.speech.trim());

    performGuess('a', '1');
    assert.equal(
      'A1 is a dog. Good memory! That\'s a match!',
      mockResponse.body.speech.trim());

    // Guess 3
    performGuess('b', '2');
    assert.equal('B2 is a cat.', mockResponse.body.speech.trim());

    performGuess('a', '2');
    assert.equal('A2 is a cat. Good memory! That\'s all of them! You won in ' +
        '3 guesses. 2 of those were perfect recall. Great job! Would you ' +
        'like to play again?',
        mockResponse.body.speech.trim());
  })

  test('[2x2] Finish in 4 guesses, one perfect, one missed', function() {
    // Guess 1
    performGuess('a', '1');
    assert.equal('A1 is a dog.', mockResponse.body.speech.trim());

    performGuess('a', '2');
    assert.equal('A2 is a cat. Not a match', mockResponse.body.speech.trim());

    // Guess 2
    performGuess('b', '1');
    assert.equal('B1 is a dog.', mockResponse.body.speech.trim());

    performGuess('b', '2');
    assert.equal('B2 is a cat. Not a match', mockResponse.body.speech.trim());

    // Guess 3
    performGuess('b', '1');
    assert.equal('B1 is a dog.', mockResponse.body.speech.trim());

    performGuess('a', '1');
    assert.equal('A1 is a dog. That\'s a match!',
       mockResponse.body.speech.trim());

    // Ask unmatched coordinates
    askUnmatched();
    assert.equal('A2, B2', mockResponse.body.speech.trim());

    // Guess 4
    performGuess('a', '2');
    assert.equal('A2 is a cat.', mockResponse.body.speech.trim());

    performGuess('b', '2');
    assert.equal('B2 is a cat. Good memory! That\'s all of them! You won ' +
      'in 4 guesses. 1 of those were perfect recall. There was 1 incorrect '  +
      'guess that could have been correct. Would you like to play again?',
      mockResponse.body.speech.trim());
  })
})

function performGuess(r, c) {
  var guess = clone(guessRequest(r, c));
  var mockRequest = new MockRequest(headerV1, guess);
  let request = mockRequest;
  let response = mockResponse;
  board.app = new DialogflowApp( {request, response} )
  board[Actions.GUESS]();
}

function askUnmatched() {
  var req = clone(blankRequest());
  var mockRequest = new MockRequest(headerV1, req);
  let request = mockRequest;
  let response = mockResponse;
  board.app = new DialogflowApp( {request, response} )
  board[Actions.LIST_UNMATCHED]();
}