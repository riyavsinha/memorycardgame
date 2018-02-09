
'use strict';

class MockRequest {
  constructor (headers, body) {
    if (headers) {
      this.headers = headers;
    } else {
      this.headers = {};
    }
    if (body) {
      this.body = body;
    } else {
      this.body = {};
    }
  }

  get (header) {
    return this.headers[header];
  }
};

class MockResponse {
  constructor () {
    this.statusCode = 200;
    this.headers = {};
  }

  status (statusCode) {
    this.statusCode = statusCode;
    return this;
  }

  send (body) {
    this.body = body;
    return this;
  }

  append (header, value) {
    this.headers[header] = value;
    return this;
  }
};

const headerV1 = {
  'Content-Type': 'application/json',
  'google-assistant-api-version': 'v1'
};

const headerV2 = {
  'Content-Type': 'application/json',
  'Google-Actions-API-Version': '2'
};
const fakeTimeStamp = '2017-01-01T12:00:00';
const fakeSessionId = '0123456789101112';
const fakeIntentId = '1a2b3c4d-5e6f-7g8h-9i10-11j12k13l14m15n16o';
const fakeDialogflowBodyRequestId = '1a2b3c4d-5e6f-7g8h-9i10-11j12k13l14m15n16o';
const fakeUserId = 'user123';
const fakeConversationId = '0123456789';

function selectLevelRequest(level) {
  let levelText = level.toString();
  return {
    'lang': 'en',
    'status': {
      'errorType': 'success',
      'code': 200
    },
    'timestamp': fakeTimeStamp,
    'sessionId': fakeSessionId,
    'result': {
      'parameters': {
        'level': levelText,
      },
      'contexts': [],
      'resolvedQuery': '',
      'source': 'agent',
      'score': 1.0,
      'speech': '',
      'fulfillment': {
        'messages': [
          {
            'speech': '',
            'type': 0
          }
        ],
        'speech': ''
      },
      'actionIncomplete': false,
      'action': 'greetings',
      'metadata': {
        'intentId': fakeIntentId,
        'webhookForSlotFillingUsed': 'false',
        'intentName': 'greetings',
        'webhookUsed': 'true'
      }
    },
    'id': fakeDialogflowBodyRequestId,
    'originalRequest': {
      'source': 'google',
      'data': {
        'inputs': [
          {
            'raw_inputs': [
              {
                'query': levelText,
                'input_type': 'VOICE'
              }
            ],
            'intent': 'actions.intent.TEXT',
            'arguments': [
              {
                'text_value': levelText,
                'raw_text': levelText,
                'name': 'text'
              }
            ]
          }
        ],
        'user': {
          'user_id': fakeUserId,
          'locale': 'en-US'
        },
        'conversation': {
          'conversation_id': fakeConversationId,
          'type': 'ACTIVE',
        }
      }
    }
  };
}

function guessRequest(row, col) {
  return {
    'lang': 'en',
    'status': {
      'errorType': 'success',
      'code': 200
    },
    'timestamp': fakeTimeStamp,
    'sessionId': fakeSessionId,
    'result': {
      'parameters': {
        'row': row,
        'col': col,
      },
      'contexts': [],
      'resolvedQuery': '',
      'source': 'agent',
      'score': 1.0,
      'speech': '',
      'fulfillment': {
        'messages': [
          {
            'speech': '',
            'type': 0
          }
        ],
        'speech': ''
      },
      'actionIncomplete': false,
      'action': 'greetings',
      'metadata': {
        'intentId': fakeIntentId,
        'webhookForSlotFillingUsed': 'false',
        'intentName': 'greetings',
        'webhookUsed': 'true'
      }
    },
    'id': fakeDialogflowBodyRequestId,
    'originalRequest': {
      'source': 'google',
      'data': {
        'inputs': [
          {
            'raw_inputs': [
              {
                'query': row,
                'input_type': 'VOICE'
              },
              {
                'query': col,
                'input_type': 'VOICE'
              }
            ],
            'intent': 'actions.intent.TEXT',
            'arguments': [
              {
                'text_value': row,
                'raw_text': row,
                'name': 'text'
              },
              {
                'text_value': col,
                'raw_text': col,
                'name': 'text'
              },
            ]
          }
        ],
        'user': {
          'user_id': fakeUserId,
          'locale': 'en-US'
        },
        'conversation': {
          'conversation_id': fakeConversationId,
          'type': 'ACTIVE',
        }
      }
    }
  };
}

/** @param {Object} obj */
const clone = obj => JSON.parse(JSON.stringify(obj));

module.exports = {
  selectLevelRequest,
  guessRequest,
  MockRequest,
  MockResponse,
  headerV2,
  headerV1,
  fakeConversationId,
  fakeUserId,
  clone
};
