'use strict';
const Groq = require('groq-sdk');
const env = require('./env');

let _client = null;

function getGroqClient() {
  if (!_client) {
    _client = new Groq({ apiKey: env.groq.apiKey });
  }
  return _client;
}

module.exports = { getGroqClient };
