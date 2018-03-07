"use strict";

const REQUIRED_PARAMETERS = [
  'es/endpoint',
];

const cfgPromise = require('./parameters')(REQUIRED_PARAMETERS);

module.exports = {
  getConfig: () => cfgPromise,
};
