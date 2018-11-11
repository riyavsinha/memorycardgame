
'use strict';

const Requests = {
  GUESS: 'guess',
  LEVEL: 'level',
  CONTEXT: 'context',
}

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

function blankRequest() {
  return makeRequest();
}

function contextualRequest(contexts) {
  return makeRequest(Requests.CONTEXT, contexts);
}

function selectLevelRequest(level) {
  let levelText = level.toString();
  return makeRequest(Requests.LEVEL, levelText);
}

function guessRequest(coord) {
  return makeRequest(Requests.GUESS, coord);
}

function makeRequest(type=null, data=[]) {
  let contexts = []
  let params = {};
  let raw_inputs = [];
  let args = [];

  switch (type) {
    case Requests.GUESS:
      let coord = data;
      params = {'coord': coord}
      raw_inputs = 
          [
            {'query': coord, 'input_type': 'VOICE'},
          ];
      args = 
          [
            {'text_value': coord, 'raw_text': coord, 'name': 'text'},
          ];
      break;
    case Requests.LEVEL:
      let level = data;
      params = {'level': level};
      raw_inputs = [{'query': level, 'input_type': 'VOICE'}];
      args = [{'text_value': level, 'raw_text': level, 'name': 'text'}];
      break;
    case Requests.CONTEXT:
      for (var i in data) {
        contexts.push(
            {"name": data[i], "lifespan": 1, "parameters": {}});
      }
      break;
    default:

  }
  return {
    'lang': 'en',
    'status': {
      'errorType': 'success',
      'code': 200
    },
    'timestamp': fakeTimeStamp,
    'sessionId': fakeSessionId,
    'result': {
      'parameters': params,
      'contexts': contexts,
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
            'raw_inputs': raw_inputs,
            'intent': 'actions.intent.TEXT',
            'arguments': args
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
  blankRequest,
  contextualRequest,
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
