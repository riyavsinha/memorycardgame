const DialogflowApp = require('actions-on-google').DialogflowApp;
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

  test('Finish in 2 guesses, one lucky', function() {
    performGuess('a', '1')
    assert.equal('A1 is a dog.', mockResponse.body.speech.trim());
  })
})

function performGuess(r, c) {
  var guess = clone(guessRequest(r, c));
  var mockRequest = new MockRequest(headerV1, guess);
  board.app = new DialogFlowApp( {mockRequest, mockResponse} )
  board[Actions.GUESS]();
}