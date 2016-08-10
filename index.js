'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CLIENT_CONFIG_DEFAULTS = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _logdown = require('logdown');

var _logdown2 = _interopRequireDefault(_logdown);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _PromiseMaker = require('./PromiseMaker');

var _PromiseMaker2 = _interopRequireDefault(_PromiseMaker);

var _EventEmitter2 = require('./EventEmitter');

var _EventEmitter3 = _interopRequireDefault(_EventEmitter2);

var _ConnectingMessageBuffer = require('./ConnectingMessageBuffer');

var _ConnectingMessageBuffer2 = _interopRequireDefault(_ConnectingMessageBuffer);

var _Constants = require('./Constants');

var _index = require('./transports/index');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CLIENT_CONFIG_DEFAULTS = exports.CLIENT_CONFIG_DEFAULTS = {
  url: '/signalr',
  logging: false,
  logger: new _logdown2.default({ prefix: 'SignalR Client' }),
  hubClient: false,
  totalTransportConnectTimeout: 10000
};

/**
 * The public API for managing communications with a SignalR server
 * @class
 * @public
 */

var Client = function (_EventEmitter) {
  _inherits(Client, _EventEmitter);

  /**
   * Initializes th' client object wit' userdefined options. Options can include a multitude 'o properties, includin' th' ship URL,
   * a set transport protocol th' user wishes to use, a hub client, th' timeout to use when connection, 'n loggin' mechanisms.
   * @param {Object} options Defines the options that the client will initialize with.
   * @constructs
   * @returns {Client} Returns a new client object.
   */
  function Client(options) {
    _classCallCheck(this, Client);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Client).call(this));

    _this._config = Object.assign({}, CLIENT_CONFIG_DEFAULTS, options || {});
    _this._logger = _this._config.logger;
    _this.state = _Constants.CLIENT_STATES.stopped;
    _this._connectingMessageBuffer = new _ConnectingMessageBuffer2.default(_this, _this.emit.bind(_this, _Constants.CLIENT_EVENTS.received));
    _this.connectionData = [];

    return _this;
  }

  /**
   * Accessor fer th' state property 'o th' client. Sets th' state to newState 'n automatically emits th' correct events.
   * @param {string} newState The new state of the client.
   * @public
   * @emits stateChanging
   * @emits stateChanged
   * @returns {void} Nothing is returned by this method.
   */


  _createClass(Client, [{
    key: 'start',


    /**
     * Starts th' underlyin' connection to th' ship.
     * @param {Object} options contains any updated treaty values that be used to start th' connection.
     * @returns {Promise} that resolves once th' connection be opened successfully.
     * @public
     * @function
     * @emits starting
     * @emits started
     * @emits error
     */
    value: function start(options) {
      var _this2 = this;

      this._config = Object.assign(this._config, options);
      if (this.state !== _Constants.CLIENT_STATES.stopped) {
        this.emit(_Constants.CLIENT_EVENTS.error);
        throw new Error('The SignalR client is in an invalid state. You only need to call `start()` once and it cannot be called while reconnecting.');
      }
      this.emit(_Constants.CLIENT_EVENTS.starting);
      this.state = _Constants.CLIENT_STATES.starting;
      return this._negotiate().then(this._findTransport.bind(this)).then(function (transport) {
        _this2._logger.info('Using the *' + transport.constructor.name + '*.');
        _this2._transport = transport;
        _this2.emit(_Constants.CLIENT_EVENTS.started);
        _this2.state = _Constants.CLIENT_STATES.started;
        _this2._connectingMessageBuffer.drain();
        return _this2;
      });
    }

    /**
     * Stops th' connection to th' ship
     * @returns {Promise} that resolves once th' connection has closed successfully.
     * @public
     * @function
     * @emits stopping
     * @emits stopped
     */

  }, {
    key: 'stop',
    value: function stop() {
      if (this._transport) {
        this.state = _Constants.CLIENT_STATES.stopping;
        this.emit(_Constants.CLIENT_EVENTS.stopping);
        this._transport.stop();
        this.state = _Constants.CLIENT_STATES.stopped;
        this.emit(_Constants.CLIENT_EVENTS.stopped);
        this._logger.info('Client stopped');
      }
    }

    /**
     * Sends a message to th' connected ship if th' transport be valid.
     * @param {object} data Th' message to send.
     * @public
     * @function
     * @returns {void} Nothing is returned by this method.
     * */

  }, {
    key: 'send',
    value: function send(data) {
      if (this._transport) {
        this._transport.send(data);
      }
    }

    /**
     * A connnection and client event handler that is listening for an 'error' event.
     * Event is emitted when an error is thrown.
     * @param {function} callback Contains the error message. //TODO: Implement error events
     * @function
     * @public
     * @returns {void} Nothing is returned by this method.
     */

  }, {
    key: 'error',
    value: function error(callback) {
      this.on(_Constants.CLIENT_EVENTS.error, callback);
    }

    /**
     * A client event handler that is listening for a 'starting' event.
     * Event is emitted when the client begins initialization.
     * @param {function} callback Method that is executed once a starting event has been fired.
     * @function
     * @public
     * @returns {void} Nothing is returned by this method.
     */

  }, {
    key: 'starting',
    value: function starting(callback) {
      this.on(_Constants.CLIENT_EVENTS.starting, callback);
    }

    /**
     * A client event handler that is listening for a 'started' event.
     * Event is emitted once the client has secured a connection successfully.
     * @param {function} callback Method that is executed once a starting event has been fired.
     * @function
     * @public
     * @returns {void} Nothing is returned by this method.
     */

  }, {
    key: 'started',
    value: function started(callback) {
      this.on(_Constants.CLIENT_EVENTS.started, callback);
    }

    /**
     * A client event handler that is listening for a 'stopping' event.
     * Event is emitted once the client has initiated a disconnect.
     * @param {function} callback Method that is executed once a starting event has been fired.
     * @function
     * @public
     * @returns {void} Nothing is returned by this method.
     */

  }, {
    key: 'stopping',
    value: function stopping(callback) {
      this.on(_Constants.CLIENT_EVENTS.stopping, callback);
    }

    /**
     * A client event handler that is listening for a 'stopped' event.
     * Event is emitted once the client has successfully disconnected from the server.
     * @param {function} callback Method that is executed once a starting event has been fired.
     * @function
     * @public
     * @returns {void} Nothing is returned by this method.
     */

  }, {
    key: 'stopped',
    value: function stopped(callback) {
      this.on(_Constants.CLIENT_EVENTS.stopped, callback);
    }

    /**
     * A connection and client event handler that is listening for a 'receiving' event.
     * Event is emitted whenever a message is received by the client from the server. (Message is in compressed, raw form from server).
     * @param {function} callback Contains the compressed message data that the client is currently receiving.
     * @function
     * @public
     * @returns {void} Nothing is returned by this method.
     */

  }, {
    key: 'receiving',
    value: function receiving(callback) {
      this.on(_Constants.CLIENT_EVENTS.receiving, callback);
    }

    /**
     * A connection and client event handler that is listening for a 'received' event.
     * Event is emitted whenever a message is received by the client from the server. (Message is decompressed by client, making it more managable).
     * @param {function} callback Contains the received decompressed message data.
     * @function
     * @public
     * @returns {void} Nothing is returned by this method.
     */

  }, {
    key: 'received',
    value: function received(callback) {
      this.on(_Constants.CLIENT_EVENTS.received, callback);
    }

    /**
     * A connection and client event handler that is listening for a 'stateChanging' event.
     * Event is emitted whenever the client's state or the connection's state is in the process of changing.
     * @param {function} callback Contains both the old and new state.
     * @function
     * @public
     * @returns {void} Nothing is returned by this method.
     */

  }, {
    key: 'stateChanging',
    value: function stateChanging(callback) {
      this.on(_Constants.CLIENT_EVENTS.stateChanging, callback);
    }

    /**
     * A connection and client event handler that is listening for a 'stateChanged' event.
     * Event is emitted whenever the client's state or the connection's state has changed.
     * @param {function} callback Contains the new state.
     * @function
     * @public
     * @returns {void} Nothing is returned by this method.
     */

  }, {
    key: 'stateChanged',
    value: function stateChanged(callback) {
      this.on(_Constants.CLIENT_EVENTS.stateChanged, callback);
    }

    /**
     * A connection event handler that is listening for a 'disconnecting' event.
     * Event is emitted once the connection is in the process of stopping, initiated by the user, or automatically if the connection is lost unexpectedly.
     * @param {function} callback Method that is executed once a starting event has been fired.
     * @function
     * @public
     * @returns {void} Nothing is returned by this method.
     */

  }, {
    key: 'disconnecting',
    value: function disconnecting(callback) {
      this.on(_Constants.CONNECTION_EVENTS.disconnecting, callback);
    }

    /**
     * A connection event handler that is listening for a 'disconnected' event.
     * Event is emitted once the connection has been completely haulted by the uesr, or has been lost unexpectedly.
     * @param {function} callback Method that is executed once a starting event has been fired.
     * @function
     * @public
     * @returns {void} Nothing is returned by this method.
     */

  }, {
    key: 'disconnected',
    value: function disconnected(callback) {
      this.on(_Constants.CONNECTION_EVENTS.disconnected, callback);
    }

    /**
     * A connection event handler that is listening for a 'reconnecting' event.
     * Event is emitted if the connection has been lost unexpectedly and is automatically attempting to reconnect.
     * @param {function} callback Method that is executed once a starting event has been fired.
     * @function
     * @public
     * @returns {void} Nothing is returned by this method.
     */

  }, {
    key: 'reconnecting',
    value: function reconnecting(callback) {
      this.on(_Constants.CONNECTION_EVENTS.reconnecting, callback);
    }

    /**
     * A connection event handler that is listening for a 'reconnected' event.
     * Event is emitted if the connection has been successfully re-established after an unexpected disconnect.
     * @param {function} callback Method that is executed once a starting event has been fired.
     * @function
     * @public
     * @returns {void} Nothing is returned by this method.
     */

  }, {
    key: 'reconnected',
    value: function reconnected(callback) {
      this.on(_Constants.CONNECTION_EVENTS.reconnected, callback);
    }

    /**
     * A connection event listener that is listening for a 'connecting' event.
     * Event is emitted if the user has used the client to try and negotiate a connection to a server.
     * @param {function} callback Method that is executed once a starting event has been fired.
     * @function
     * @public
     * @returns {void} Nothing is returned by this method.
     */

  }, {
    key: 'connecting',
    value: function connecting(callback) {
      this.on(_Constants.CONNECTION_EVENTS.connecting, callback);
    }

    /**
     * A connection event listener that is listening for a 'onConnected' event.
     * Event is emitted if the connection to the server was successfully established.
     * @param {function} callback Method that is executed once a starting event has been fired.
     * @function
     * @public
     * @returns {void} Nothing is returned by this method.
     */

  }, {
    key: 'connected',
    value: function connected(callback) {
      this.on(_Constants.CONNECTION_EVENTS.onConnected, callback);
    }

    /**
     * A connection event listener that is listeing for a 'connectionSlow' event.
     * Currently not implemented.
     * @param {function} callback Method that is executed once a starting event has been fired.
     * @function
     * @public
     * @returns {void} Nothing is returned by this method.
     */

  }, {
    key: 'connectionSlow',
    value: function connectionSlow(callback) {
      this.on(_Constants.CLIENT_EVENTS.connectionSlow, callback);
    }

    /**
     * Negotiates th' request to th' ship 'n returns th' consequental promise that be created as a result.
     * @returns {*} Returns the treaty for the server request.
     * @protected
     * @function
     */

  }, {
    key: '_negotiate',
    value: function _negotiate() {
      return _superagent2.default.get(this._config.url + '/negotiate').query({ clientProtocol: _Constants.CLIENT_PROTOCOL_VERSION }).use(_PromiseMaker2.default).promise();
    }

    /**
     * Takes a treaty (result 'o _negotiate()) 'n uses that 'n th' client configuration to find th' best transport protocol to use.
     * A user may specify a transport as well if they would like to not use th' automated selection 'o one.
     * @param {Object} treaty The result of the initial negotiation with the server.
     * @returns {Promise} A promise that will automatically find the best connection type, or to use the one defined by the user.
     * @function
     * @private
     */

  }, {
    key: '_findTransport',
    value: function _findTransport(treaty) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        var availableTransports = (0, _index.AvailableTransports)();
        if (_this3._config.transport && _this3._config.transport !== 'auto') {
          var transportConstructor = availableTransports.filter(function (x) {
            return x.name === _this3._config.transport;
          })[0];
          if (transportConstructor) {
            (function () {
              // If the transport specified in the config is found in the available transports, use it
              var transport = new transportConstructor(_this3, treaty, _this3._config.url);
              transport.start().then(function () {
                return resolve(transport);
              });
            })();
          } else {
            reject(new Error('The transport specified (' + _this3._config.transport + ') was not found among the available transports [' + availableTransports.map(function (x) {
              return '\'' + x.name + '\'';
            }).join(' ') + '].'));
          }
        } else {
          // Otherwise, Auto Negotiate the transport
          _this3._logger.info('Negotiating the transport...');
          _async2.default.detectSeries(availableTransports.map(function (x) {
            return new x(_this3, treaty, _this3._config.url);
          }), function (t, c) {
            return t.start().then(function () {
              return c(t);
            }).catch(function () {
              return c();
            });
          }, function (transport) {
            return transport ? resolve(transport) : reject('No suitable transport was found.');
          });
        }
      });
    }
  }, {
    key: 'state',
    set: function set(newState) {
      if (!this._state) {
        this._state = newState;
      } else {
        this.emit(_Constants.CLIENT_EVENTS.stateChanging, { oldState: this.state, newState: newState });
        this._state = newState;
        this.emit(_Constants.CLIENT_EVENTS.stateChanged, newState);
      }
    }

    /**
     *Accessor fer th' state property 'o th' client. Returns th' current state 'o th' client.
     * @returns {*} Returns the current state.
     */
    ,
    get: function get() {
      return this._state;
    }
  }]);

  return Client;
}(_EventEmitter3.default);

exports.default = Client;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Constants = require('./Constants');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ConnectingMessageBuffer = function () {
  /**
   * Takes the client and drainCallback and creates an efficient buffer for buffering recieved messages.
   * @param {Client} client The current instance of the user's client.
   * @param {bool} drainCallback A boolean to decide wherer to drain the buffer.
   * @constructor
   * @returns {ConnectingMessageBuffer} Creates a new ConnectingMessageBuffer.
   */
  function ConnectingMessageBuffer(client, drainCallback) {
    _classCallCheck(this, ConnectingMessageBuffer);

    this.buffer = [];
    this.client = client;
    this.drainCallback = drainCallback;
  }

  /**
   * Attempts to add a passed in message to the buffer.
   * @param {Object} message The message to be pushed into the buffer.
   * @returns {boolean} Returns false if the client is currently not connecting.
   * @function
   * @public
   */


  _createClass(ConnectingMessageBuffer, [{
    key: 'tryBuffer',
    value: function tryBuffer(message) {
      if (this.client.transport === _Constants.CONNECTION_STATES.connecting) {
        this.buffer.push(message);
        return true;
      }
      return false;
    }

    /**
     * Drains the current buffer and removes all messages.
     * @function
     * @public
     * @returns {void} Method does not return any value.
     */

  }, {
    key: 'drain',
    value: function drain() {
      // Ensure that the connection is connected when we drain (do not want to drain while a connection is not active)
      if (this.client.transport === _Constants.CONNECTION_STATES.connected) {
        while (this.buffer.length > 0) {
          this.drainCallback(buffer.shift());
        }
      }
    }
  }]);

  return ConnectingMessageBuffer;
}();

exports.default = ConnectingMessageBuffer;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var CLIENT_PROTOCOL_VERSION = exports.CLIENT_PROTOCOL_VERSION = 1.3;

/**
 * A collection of the different states a connection may be in.
 * @exports CONNECTION_STATES
 * @type {{connecting: number, connected: number, reconnecting: number, disconnected: number}}
 * @readonly
 * @public
 */
var CONNECTION_STATES = exports.CONNECTION_STATES = {
  connecting: 0,
  connected: 1,
  reconnecting: 2,
  disconnected: 4
};
/**
 * A collection of different states that the client may be in.
 * @exports CLIENT_STATES
 * @type {{starting: number, started: number, stopping: number, stopped: number}}
 * @readonly
 * @public
 */
var CLIENT_STATES = exports.CLIENT_STATES = {
  starting: 8,
  started: 16,
  stopping: 32,
  stopped: 64
};

/**
 * A collection of all of the currently defined events that may be fired off during different stages of a connection's lifecycle.
 * @exports CONNECTION_EVENTS
 * @type {{error: string, connectionSlow: string, connecting: string, onConnected: string, receiving: string, received: string, reconnecting: string, reconnected: string, stateChanging: string, stateChanged: string, disconnecting: string, disconnected: string}}
 * @readonly
 * @public
 */
var CONNECTION_EVENTS = exports.CONNECTION_EVENTS = {
  error: 'error',
  connectionSlow: 'connectionSlow',
  connecting: 'connecting',
  onConnected: 'onConnected',
  receiving: 'receiving',
  received: 'received',
  reconnecting: 'reconnecting',
  reconnected: 'reconnected',
  stateChanging: 'stateChanging',
  stateChanged: 'stateChanged',
  disconnecting: 'disconnecting',
  disconnected: 'disconnected'
};
/**
 * A collection of all of the currently defined events that may be fired off during the different stages of the client's lifecycle.
 * @exports CLIENT_EVENTS
 * @type {{starting: string, started: string, stopping: string, stopped: string, error: string, stateChanging: string, stateChanged: string, receiving: string, received: string}}
 * @readonly
 * @public
 */
var CLIENT_EVENTS = exports.CLIENT_EVENTS = {
  starting: 'starting',
  started: 'started',
  stopping: 'stopping',
  stopped: 'stopped',
  error: 'error',
  stateChanging: 'stateChanging',
  stateChanged: 'stateChanged',
  receiving: 'receiving',
  received: 'received'
};

/**
 * A collection of different messages that may be written to the console when certain conditions are met.
 * @exports RESOURCES
 * @type {{nojQuery: string, noTransportOnInit: string, errorOnNegotiate: string, stoppedWhileLoading: string, stoppedWhileNegotiating: string, errorParsingNegotiateResponse: string, errorDuringStartRequest: string, stoppedDuringStartRequest: string, errorParsingStartResponse: string, invalidStartResponse: string, protocolIncompatible: string, sendFailed: string, parseFailed: string, longPollFailed: string, eventSourceFailedToConnect: string, eventSourceError: string, webSocketClosed: string, pingServerFailedInvalidResponse: string, pingServerFailed: string, pingServerFailedStatusCode: string, pingServerFailedParse: string, noConnectionTransport: string, webSocketsInvalidState: string, reconnectTimeout: string, reconnectWindowTimeout: string}}
 * @readonly
 * @public
 */
var RESOURCES = exports.RESOURCES = {
  nojQuery: 'jQuery was not found. Please ensure jQuery is referenced before the SignalR client JavaScript file.',
  noTransportOnInit: 'No transport could be initialized successfully. Try specifying a different transport or none at all for auto initialization.',
  errorOnNegotiate: 'Error during negotiation request.',
  stoppedWhileLoading: 'The connection was stopped during page load.',
  stoppedWhileNegotiating: 'The connection was stopped during the negotiate request.',
  errorParsingNegotiateResponse: 'Error parsing negotiate response.',
  errorDuringStartRequest: 'Error during start request. Stopping the connection.',
  stoppedDuringStartRequest: 'The connection was stopped during the start request.',
  errorParsingStartResponse: 'Error parsing start response: \'{0}\'. Stopping the connection.',
  invalidStartResponse: 'Invalid start response: \'{0}\'. Stopping the connection.',
  protocolIncompatible: 'You are using a version of the client that isn\'t compatible with the server. Client version {0}, server version {1}.',
  sendFailed: 'Send failed.',
  parseFailed: 'Failed at parsing response: {0}',
  longPollFailed: 'Long polling request failed.',
  eventSourceFailedToConnect: 'EventSource failed to connect.',
  eventSourceError: 'Error raised by EventSource',
  webSocketClosed: 'WebSocket closed.',
  pingServerFailedInvalidResponse: 'Invalid ping response when pinging server: \'{0}\'.',
  pingServerFailed: 'Failed to ping server.',
  pingServerFailedStatusCode: 'Failed to ping server.  Server responded with status code {0}, stopping the connection.',
  pingServerFailedParse: 'Failed to parse ping server response, stopping the connection.',
  noConnectionTransport: 'Connection is in an invalid state, there is no transport active.',
  webSocketsInvalidState: 'The Web Socket transport is in an invalid state, transitioning into reconnecting.',
  reconnectTimeout: 'Couldn\'t reconnect within the configured timeout of {0} ms, disconnecting.',
  reconnectWindowTimeout: 'The client has been inactive since {0} and it has exceeded the inactivity timeout of {1} ms. Stopping the connection.'
};
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash.sum');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash');

var _lodash4 = _interopRequireDefault(_lodash3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventEmitter = function () {
  function EventEmitter() {
    _classCallCheck(this, EventEmitter);

    this.observers = {};
  }

  /**
   *Pushes an event to the passed in listener.
   * @param {Object} event The event that was fired.
   * @param {Object} listener The listener that the fired event will be pushed to.
   * @function
   * @public
   * @returns {void} Method does not return a value.
   */


  _createClass(EventEmitter, [{
    key: 'on',
    value: function on(event, listener) {
      this.observers[event] = this.observers[event] || [];
      this.observers[event].push(listener);
    }

    /**
     * Removes an event from a passed in listener.
     * @param {Object} event Event to be removed from the listener.
     * @param {Object} listener The listener the event will be removed from.
     * @function
     * @public
     * @returns {void} Method does not return a value.
     */

  }, {
    key: 'off',
    value: function off(event, listener) {
      var _this = this;

      if (!this.observers[event]) {
        return;
      }
      this.observers[event].forEach(function () {
        if (!listener) {
          delete _this.observers[event];
        } else {
          var index = _this.observers[event].indexOf(listener);
          if (index > -1) {
            _this.observers[event].splice(index, 1);
          }
        }
      });
    }

    /**
     * Emits the passed in event to all observers.
     * @param {Object} event The event to be broadcasted to all available observers.
     * @param {Object} args A variable number of objects passed in to attatch.
     * @function
     * @public
     * @returns {void} Returns if there is no current observers for the passed in event.
     */

  }, {
    key: 'emit',
    value: function emit(event) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      if (!this.observers[event]) {
        return;
      }

      this.observers[event].forEach(function (observer) {
        return observer.apply(undefined, args);
      });
    }

    /**
     * Returns the true number of current observers.
     * @returns {int} The current number of observers.
     * @function
     * @public
     */

  }, {
    key: 'numberOfObservers',
    value: function numberOfObservers() {
      if (_lodash4.default.map(this.observers).map(function (x) {
        return x.length;
      }).length === 0) {
        return 0;
      } else {
        return (0, _lodash2.default)(_lodash4.default.map(this.observers).map(function (x) {
          return x.length;
        }));
      }
    }
  }]);

  return EventEmitter;
}();

exports.default = EventEmitter;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HUB_CLIENT_CONFIG_DEFAULTS = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _logdown = require('logdown');

var _logdown2 = _interopRequireDefault(_logdown);

var _Constants = require('./Constants');

var _Client2 = require('./Client');

var _Client3 = _interopRequireDefault(_Client2);

var _HubProxy = require('./HubProxy');

var _HubProxy2 = _interopRequireDefault(_HubProxy);

var _Protocol = require('./Protocol');

var _Protocol2 = _interopRequireDefault(_Protocol);

var _PromiseMaker = require('./PromiseMaker');

var _PromiseMaker2 = _interopRequireDefault(_PromiseMaker);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HUB_CLIENT_CONFIG_DEFAULTS = exports.HUB_CLIENT_CONFIG_DEFAULTS = {
  logger: new _logdown2.default({ prefix: 'SignalR Hub-Client' }),
  hubClient: true
};
/**
 *Th' Client that be used fer Hub connections.
 * @class
 */

var HubClient = function (_Client) {
  _inherits(HubClient, _Client);

  /**
   *Uses passed in configuration settin's to initialize th' HubClient. Attatches event handlers that handle client invocations sent from th' ship,
   * as well as registerin' th' proxies fer each Hub on startup.
   * @param {Object} options The initial options defined by the user to initialize the HubClient with.
   * @constructor
   */
  function HubClient(options) {
    _classCallCheck(this, HubClient);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(HubClient).call(this, options));

    _this._config = Object.assign({}, _Client2.CLIENT_CONFIG_DEFAULTS, HUB_CLIENT_CONFIG_DEFAULTS, options || {});
    // Object to store hub proxies for this connection
    _this.proxies = {};
    _this.invocationCallbackId = 0;
    _this.invocationCallbacks = {};
    _this.connectionData = [];

    _this.starting(function () {
      _this._logger.info('Registering Hub Proxies...');
      _this._registerHubProxies();
    });

    _this.received(function (minData) {
      if (!minData || !minData.length) {
        return;
      }
      _lodash2.default.each(minData, function (md) {
        var data = _Protocol2.default.expandClientHubInvocation(md);
        var proxy = _this.proxies[data.Hub];
        if (proxy) {
          _this._logger.info('`' + data.Hub + '` proxy found, invoking `' + data.Method + '`.');
          var func = proxy.funcs[data.Method];
          if (func) {
            var _Array$prototype;

            var arrrrgs = (_Array$prototype = Array.prototype).join.apply(_Array$prototype, _toConsumableArray(data.Args).concat([', ']));
            _this._logger.info('Invoking `' + data.Method + '(' + arrrrgs + ')`. ');
            func.apply(undefined, [data.State].concat(_toConsumableArray(data.Args)));
          } else {
            _this._logger.warn('Client function not found for method `' + data.Method + '` on hub `' + data.Hub + '`.');
          }
        } else {
          _this._logger.error('Proxy for ' + data.Hub + ' not found.');
        }
      });
    });
    return _this;
  }

  /**
   * Creates a new hub proxy based on th' actual hub moniker.
   * @param {string} hubName The name of the hub that the proxy will be created for.
   * @returns {*|HubProxy} If th' proxy already exists, it return that individual proxy, else it creates a new one.
   * @function
   * @public
   */


  _createClass(HubClient, [{
    key: 'createHubProxy',
    value: function createHubProxy(hubName) {
      var hubNameLower = hubName.toLowerCase();
      this.connectionData.push({ name: hubName });
      return this.proxies[hubNameLower] || (this.proxies[hubNameLower] = new _HubProxy2.default(this, hubNameLower));
    }

    /**
     * Calls th' base client's start method, initializin' th' connection. Currently unknown if extra code be needed.
     * @param {Object} options Th' configuration to start th' client wit'.
     * @returns {Promise} Returns a promise signifying that the connection has been intialized.
     * @function
     * @public
     */

  }, {
    key: 'start',
    value: function start(options) {
      return _get(Object.getPrototypeOf(HubClient.prototype), 'start', this).call(this, options);
      // TODO: figure out why this is needed/not needed
      //.then(() => request
      //  .get(`${this._config.url}/start`)
      //  .query({clientProtocol: CLIENT_PROTOCOL_VERSION})
      //  .query({connectionData: JSON.stringify(this.connectionData)})
      //  .query({connectionToken: this._transport.connectionToken})
      //  .query({transport: this._transport.name})
      //  .use(PromiseMaker)
      //  .promise());
    }

    /**
     *Overridden negotiate method that adds connectionData to th' initial query. ConnectionData holds th' names 'o th' current connected hubs.
     * @returns {Promise} Returns the
     * @private
     * @function
     */

  }, {
    key: '_negotiate',
    value: function _negotiate() {
      return _superagent2.default.get(this._config.url + '/negotiate').query({ clientProtocol: _Constants.CLIENT_PROTOCOL_VERSION }).query({ connectionData: JSON.stringify(this.connectionData) }).use(_PromiseMaker2.default).promise();
    }
  }]);

  return HubClient;
}(_Client3.default);

exports.default = HubClient;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _logdown = require('logdown');

var _logdown2 = _interopRequireDefault(_logdown);

var _Protocol = require('./Protocol');

var _Protocol2 = _interopRequireDefault(_Protocol);

var _EventEmitter2 = require('./EventEmitter');

var _EventEmitter3 = _interopRequireDefault(_EventEmitter2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * A proxy that can be used to invoke methods server-side.
 * @class
 */
var HubProxy = function (_EventEmitter) {
  _inherits(HubProxy, _EventEmitter);

  /**
   * Initializes the proxy given the current client and the hub that the client is connected to.
   * @param {Client} client The current HubClient that is initialized.
   * @param {string} hubName The name of the hub that the user wishes to generate a proxy for.
   * @constructor
   */
  function HubProxy(client, hubName) {
    _classCallCheck(this, HubProxy);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(HubProxy).call(this));

    _this._state = {};
    _this._client = client;
    _this._hubName = hubName;
    _this._logger = new _logdown2.default({ prefix: hubName });
    _this.funcs = {};
    _this.server = {};
    return _this;
  }

  /**
   * Invokes a server hub method with the given arguments.
   * @param {string} methodName The name of the server hub method
   * @param {Object} args The arguments to pass into the server hub method.
   * @returns {*} The return statement invokes the send method, which sends the information the server needs to invoke the correct method.
   * @function
   */


  _createClass(HubProxy, [{
    key: 'invoke',
    value: function invoke(methodName) {
      var _this2 = this;

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var data = {
        H: this._hubName,
        M: methodName,
        A: args.map(function (a) {
          return (0, _lodash.isFunction)(a) || (0, _lodash.isUndefined)(a) ? null : a;
        }),
        I: this._client.invocationCallbackId
      };

      var callback = function callback(minResult) {
        return new Promise(function (resolve, reject) {
          var result = _Protocol2.default.expandServerHubResponse(minResult);

          // Update the hub state
          (0, _lodash.extend)(_this2._state, result.State);

          if (result.Progress) {
            // TODO: Progress in promises?
          } else if (result.Error) {
            // Server hub method threw an exception, log it & reject the deferred
            if (result.StackTrace) {
              _this2._logger.error(result.Error + '\n' + result.StackTrace + '.');
            }
            // result.ErrorData is only set if a HubException was thrown
            var source = result.IsHubException ? 'HubException' : 'Exception';
            var error = new Error(result.Error);
            error.source = source;
            error.data = result.ErrorData;
            _this2._logger.error(_this2._hubName + '.' + methodName + ' failed to execute. Error: ' + error.message);
            reject(error);
          } else {
            // Server invocation succeeded, resolve the deferred
            _this2._logger.info('Invoked ' + _this2._hubName + '.' + methodName);
            return resolve(result.Result);
          }
        });
      };

      this._client.invocationCallbacks[this._client.invocationCallbackId.toString()] = { scope: this, method: callback };
      this._client.invocationCallbackId += 1;

      if (!(0, _lodash.isEmpty)(this.state)) {
        data.S = this.state;
      }

      this._logger.info('Invoking ' + this._hubName + '.' + methodName);
      return this._client.send(data);
    }
  }]);

  return HubProxy;
}(_EventEmitter3.default);

exports.default = HubProxy;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = PromiseMaker;
function PromiseMaker(req) {
  req.promise = function () {
    return new Promise(function (resolve, reject) {
      req.end(function (err, res) {
        err = err || res.error;
        if (err) {
          reject(err);
        } else {
          resolve(res.body);
        }
      });
    });
  };
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * A utility tavern that contains methods fer decompressin'/compressin' incomin' 'n outgoin' messages.
 * @class
 * @exports Protocol
 */
var Protocol = function () {
  function Protocol() {
    _classCallCheck(this, Protocol);
  }

  _createClass(Protocol, null, [{
    key: 'expandClientHubInvocation',

    /**
     * Decompresses a message received from the server that is meant to contain information about invoking a method client-side.
     * @param {Object} compressedClientHubInvocation The compressed message received from the server.
     * @returns {Object} The decompressed message from the server. Contains client-side method invocation data.
     * @function
     * @static
     * @public
     */
    value: function expandClientHubInvocation(compressedClientHubInvocation) {
      return {
        Hub: compressedClientHubInvocation.H,
        Method: compressedClientHubInvocation.M,
        Args: compressedClientHubInvocation.A,
        State: compressedClientHubInvocation.S
      };
    }

    /**
     * Decompresses a message received from a server hub into a more readible and workable form.
     * @param {Object} compressedServerHubResponse The compressed, raw message received from the server.
     * @returns {Object}  The decompressed message received from the server.
     * @function
     * @static
     * @public
     */

  }, {
    key: 'expandServerHubResponse',
    value: function expandServerHubResponse(compressedServerHubResponse) {
      return {
        State: compressedServerHubResponse.S,
        Result: compressedServerHubResponse.R,
        Progress: compressedServerHubResponse.P && {
          Id: compressedServerHubResponse.P.I,
          Data: compressedServerHubResponse.P.D
        },
        Id: compressedServerHubResponse.I,
        IsHubException: compressedServerHubResponse.H,
        Error: compressedServerHubResponse.E,
        StackTrace: compressedServerHubResponse.T,
        ErrorData: compressedServerHubResponse.D
      };
    }

    /**
     * Decompresses a response from the server to a more readible and workable form.
     * @param {Object} min The message that has been received from the server.
     * @returns {Object} The decompressed message received from the server.
     * @function
     * @static
     * @public
     */

  }, {
    key: 'expandResponse',
    value: function expandResponse(min) {
      if (_lodash2.default.isString(min)) {
        min = JSON.parse(min);
      }
      return {
        messageId: min.C,
        messages: min.M || [],
        initialized: !_lodash2.default.isUndefined(min.S),
        shouldReconnect: !_lodash2.default.isUndefined(min.T),
        longPollDelay: min.L,
        groupsToken: min.G
      };
    }
  }]);

  return Protocol;
}();

exports.default = Protocol;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Client = require('./Client');

var _Client2 = _interopRequireDefault(_Client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = window.SignalArr = _Client2.default;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _Transport2 = require('./Transport');

var _Transport3 = _interopRequireDefault(_Transport2);

var _PromiseMaker = require('../PromiseMaker');

var _PromiseMaker2 = _interopRequireDefault(_PromiseMaker);

var _Constants = require('../Constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Th' long pollin' transport protocol.
 * @class
 */
var LongPollingTransport = function (_Transport) {
  _inherits(LongPollingTransport, _Transport);

  /**
   * Uses th' current client, treaty from th' initial negotiation, 'n target URL to construct a new Longpollin' transport.
   * @param {Client} client The current instance of the user's client.
   * @param {Object} treaty An Object that is the result of the initial client-server negotiation. Contains vital connection information.
   * @param {string} url The URL of the server the user wishes to connect to.
   * @constructor
   */
  function LongPollingTransport(client, treaty, url) {
    _classCallCheck(this, LongPollingTransport);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(LongPollingTransport).call(this, 'longPolling', client, treaty));

    _this._maxReconnectedTimeout = 3600000;
    _this._url = url;
    return _this;
  }

  /**
   * Initiates th' long pollin' transport protocol fer th' current connection.
   * @returns {Promise} That resolves once th' long pollin' transport has started successfully 'n has begun pollin'.
   * @param {Promise} current The current connection promise.
   * @private
   * @function
   */


  _createClass(LongPollingTransport, [{
    key: '_queryData',
    value: function _queryData(current) {
      return current.query({ clientProtocol: 1.5 }).query({ connectionToken: this._connectionToken }).query({ transport: 'longPolling' }).query({ connectionData: this._data || '' });
    }

    /**
     *Initiates th' connection after th' LongPollin'Transport transport type be declared via th' initial negotiation.
     * @returns {Promise.<T>} Resolves once the client has successfully connected and has started to poll the server for a response.
     * @function
     * @public
     * @extends start
     * @emits connected
     */

  }, {
    key: 'start',
    value: function start() {
      var _this2 = this;

      if (this._pollTimeoutId) {
        throw new Error('A polling session has already been initialized. Call `stop()` before attempting to `start()` again.');
      }
      this._logger.info('*' + this.constructor.name + '* starting...');
      return this._connect()
      //.then(this._startConnection.bind(this))
      .then(function () {
        _this2.state = _Constants.CONNECTION_STATES.connected;
        _this2.emit(_Constants.CONNECTION_EVENTS.onConnected);
        _this2._reconnectTries = 0;
        _this2._reconnectTimeoutId = null;
      }).then(this._poll.bind(this));
    }

    /**
     * Initiates th' long pollin' transport protocol fer th' current connection.
     * @returns {Promise} that resolves once th' long pollin' transport has started successfully 'n has begun pollin'.
     * @function
     * @private
     * @emits connecting
     */

  }, {
    key: '_connect',
    value: function _connect() {
      var url = this._url + '/connect';
      this._logger.info('Connecting to ' + url);
      this.state = _Constants.CONNECTION_STATES.connecting;
      this.emit(_Constants.CONNECTION_EVENTS.connecting);
      this._current = _superagent2.default.post(url);
      this._current = this._queryData(this._current);
      return this._current.use(_PromiseMaker2.default).promise().then(this._processMessages.bind(this));
    }

    //_startConnection() {
    //  this._current = request
    //    .post(this._url + '/start');
    //  this._current = this._queryData(this._current);
    //  return this._current
    //    .use(PromiseMaker)
    //    .promise();
    //}

    /**
     * Initiates a poll to th' ship 'n hold th' poll open 'til th' ship be able to send new information.
     * @returns {Promise} That resolves if th' client must reconnect due to bad connection.
     * Else, th' method be called recursively after it recieves new information from th' ship.
     * @emits reconnected
     * @function
     * @private
     */

  }, {
    key: '_poll',
    value: function _poll() {
      var _this3 = this;

      var poll = function poll() {
        var _lastMessages = _this3._lastMessages;
        var messageId = _lastMessages.messageId;
        var groupsToken = _lastMessages.groupsToken;
        var shouldReconnect = _lastMessages.shouldReconnect;

        _this3._current = _superagent2.default.post(_this3._url + '/poll');
        _this3._current = _this3._queryData(_this3._current);
        if (groupsToken) {
          _this3._current = _this3._current.send({ messageId: messageId, groupsToken: groupsToken });
        } else {
          _this3._current = _this3._current.send({ messageId: messageId });
        }
        _this3._current = _this3._current.end(function (err, res) {
          if (err && shouldReconnect) {
            return _this3._reconnectTimeoutId = setTimeout(_this3._reconnect(), Math.min(1000 * (Math.pow(2, _this3._reconnectTries) - 1), _this3._maxReconnectedTimeout)).then(_this3._poll);
          }
          if (res) {
            if (_this3.state === _Constants.CONNECTION_STATES.reconnecting) {
              _this3.state = _Constants.CONNECTION_STATES.connected;
              _this3.emit(_Constants.CONNECTION_EVENTS.reconnected);
              _this3._reconnectTries = 0;
            }
            if (!_lodash2.default.isString(res.body)) {
              _this3._processMessages(res.body);
            }
          }
          if (!_this3._abortRequest) {
            _this3._poll();
          }
        });
      };
      this._currentTimeoutId = setTimeout(poll.bind(this), 250);
    }

    /**
     * Initiates th' long pollin' transport protocol fer th' current connection.
     *  @param {data} data contains th' information that th' client wishes to send to th' ship.
     *  @returns {Promise} that resolves once th' message has be sent..
     *  @function
     *  @public
     *  @extends send
     */

  }, {
    key: 'send',
    value: function send(data) {
      return _superagent2.default.post(this._url + '/send').query({ connectionToken: this._connectionToken }).query({ transport: 'longPolling' }).send('data=' + JSON.stringify(data)).set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8').use(_PromiseMaker2.default).promise();
    }

    /**
     * Initiates a reconnection to th' ship in th' case that th' connection be too slow or be lost completely.
     *  @returns {Promise} that resolves once th' client has be successfully reconnected.
     *  @function
     *  @private
     *  @emits reconnecting
     */

  }, {
    key: '_reconnect',
    value: function _reconnect() {
      var url = this._url + '/connect';
      this.emit(_Constants.CONNECTION_EVENTS.reconnecting);
      this.state = _Constants.CONNECTION_STATES.reconnecting;
      this._logger.info('Attempting to reconnect to ' + url);
      this._reconnectTries++;
      this._current = _superagent2.default.post(url);
      this._current = this._queryData(this._current);

      if (Math.min(1000 * (Math.pow(2, this._reconnectTries) - 1)) >= this._maxReconnectedTimeout) {
        this.stop();
      }
      return this._current.use(_PromiseMaker2.default).promise().then(this._processMessages.bind(this));
    }

    /**
     * Clears th' timeouts 'n stops th' connection to th' ship cleanly.
     * @returns {Promise} Resolves once the transport has successfully halted.
     * @public
     * @function
     * @extends stop
     * @emits disconnecting
     * @emits disconnected
     */

  }, {
    key: 'stop',
    value: function stop() {
      clearTimeout(this._currentTimeoutId);
      clearTimeout(this._reconnectTimeoutId);
      this._abortRequest = true;
      if (this._current) {
        this._current.abort();
      }
      this.emit(_Constants.CONNECTION_EVENTS.disconnecting);
      this._logger.info('Disconnecting from ' + this._url + '.');
      this.state = _Constants.CONNECTION_STATES.disconnected;
      this.emit(_Constants.CONNECTION_EVENTS.disconnected);
      this._logger.info('Successfully disconnected.');
    }
  }]);

  return LongPollingTransport;
}(_Transport3.default);

LongPollingTransport.supportsKeepAlive = false;
exports.default = LongPollingTransport;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Transport2 = require('./Transport');

var _Transport3 = _interopRequireDefault(_Transport2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * A default, empty transport.
 */
var NullTransport = function (_Transport) {
  _inherits(NullTransport, _Transport);

  function NullTransport(client, treaty) {
    _classCallCheck(this, NullTransport);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(NullTransport).call(this, 'null', client, treaty));
  }

  return NullTransport;
}(_Transport3.default);

NullTransport.supportsKeepAlive = false;
exports.default = NullTransport;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Transport2 = require('./Transport');

var _Transport3 = _interopRequireDefault(_Transport2);

var _Constants = require('../Constants');

var _eventsource = require('eventsource');

var _eventsource2 = _interopRequireDefault(_eventsource);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _PromiseMaker = require('../PromiseMaker');

var _PromiseMaker2 = _interopRequireDefault(_PromiseMaker);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventSource = typeof window !== 'undefined' && window.EventSource || _eventsource2.default;
/**
 * The ServerSentEvents transport protocol.
 */

var ServerSentEventsTransport = function (_Transport) {
  _inherits(ServerSentEventsTransport, _Transport);

  /**
   * Uses th' current client, treaty from th' initial negotiation, 'n target URL to construct a new ServerSentEvents transport.
   * @param {Client} client The client that will be initiating the new ServerSentEvents connection.
   * @param {Object} treaty An object that holds the reults from the original negotiation between client-server. Contains critical connection information.
   * @param {string} url The URL of the server the client is connecting to.
   * @constructor
   */
  function ServerSentEventsTransport(client, treaty, url) {
    _classCallCheck(this, ServerSentEventsTransport);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ServerSentEventsTransport).call(this, 'serverSentEvents', client, treaty));

    _this._intentionallyClosed = null;
    _this._url = url;
    return _this;
  }

  /**
   * Initates th' ServerSentEvents connection, as well as handles onmessage, onerror,  'n onopen events.
   * @returns {Promise} Resolves when the client hasb een successfully connected to the server via a ServerSentEvents transport.
   * @public
   * @function
   * @extends start
   * @emits reconnecting
   * @emits connecting
   * @emits connected
   * @emits reconnected
   */


  _createClass(ServerSentEventsTransport, [{
    key: 'start',
    value: function start() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        if (_this2._eventSource && _this2._intentionallyClosed) {
          return reject(new Error('An EventSource has already been initialized. Call `stop()` before attempting to `start()` again.'));
        }

        _this2._logger.info('*' + _this2.constructor.name + '* starting...');
        var url = _this2._url;
        if (!_this2._intentionallyClosed && _this2.state === _Constants.CONNECTION_STATES.reconnecting) {
          _this2._logger.info('Reconnecting to ' + url);
          url += '/reconnect?transport=serverSentEvents&connectionToken=' + encodeURIComponent(_this2._connectionToken);
          _this2.emit(_Constants.CONNECTION_EVENTS.reconnecting);
        } else {
          _this2._logger.info('Connecting to ' + url);
          url += '/connect?transport=serverSentEvents&connectionToken=' + encodeURIComponent(_this2._connectionToken);
          _this2.emit(_Constants.CONNECTION_EVENTS.connecting);
          _this2.state = _Constants.CONNECTION_STATES.connecting;
        }
        url += '&tid=' + Math.floor(Math.random() * 11);

        _this2._eventSource = new EventSource(url);
        _this2._eventSource.onopen = function (e) {
          if (e.type === 'open') {
            _this2._logger.info('*' + _this2.constructor.name + '* connection opened.');
            if (!_this2._intentionallyClosed && _this2.state === _Constants.CONNECTION_STATES.reconnecting) {
              _this2.emit(_Constants.CONNECTION_EVENTS.reconnected);
            } else {
              _this2.emit(_Constants.CONNECTION_EVENTS.onConnected);
            }
            _this2.state = _Constants.CONNECTION_STATES.connected;
            resolve();
          }
        };
        _this2._eventSource.onmessage = function (e) {
          if (e.data === 'initialized') {
            return;
          }
          _this2._processMessages(e.data);
        };
        _this2._eventSource.onerror = function (e) {
          _this2._logger.error('*' + _this2.constructor.name + '* connection errored: ' + e);
        };
      });
    }

    /**
     * Cleanly disconnects from th' target ship.
     * @returns {Promise} Resolves once the connection has been halted successfully.
     * @function
     * @public
     * @extends stop
     * @emits disconnecting
     * @emits disconnected
     */

  }, {
    key: 'stop',
    value: function stop() {
      if (this._eventSource) {
        this.emit(_Constants.CONNECTION_EVENTS.disconnecting);
        this._intentionallyClosed = true;
        this._eventSource.close();
        this._logger.info('*' + this.constructor.name + '* connection closed.');
        this.state = _Constants.CONNECTION_STATES.disconnected;
        this.emit(_Constants.CONNECTION_EVENTS.disconnected);
      }
    }

    /**
     * Returns a promise that resolves when a message be sent with th' passed in data to th' target URL.
     * @param {Object} data The message to send to the server.
     * @returns {Promise} Resolves once the message has been sent successfully.
     * @private
     * @function
     */

  }, {
    key: 'send',
    value: function send(data) {
      return _superagent2.default.post(this._url + '/send').query({ connectionToken: this._connectionToken }).query({ transport: 'serverSentEvents' }).send('data=' + JSON.stringify(data)).set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8').use(_PromiseMaker2.default).promise();
    }
    /**
     * If th' keepAlive times out, closes th' connection cleanly 'n attempts to reconnect.
     * @private
     * @returns {void} Method does not return a value.
     * @emits disconnecting
     */

  }, {
    key: '_keepAliveTimeoutDisconnect',
    value: function _keepAliveTimeoutDisconnect() {
      this.emit(_Constants.CONNECTION_EVENTS.disconnecting);
      this._intentionallyClosed = false;
      this._eventSource.close();
      this._logger.info('*' + this.constructor.name + '* connection closed unexpectedly... Attempting to reconnect.');
      this.state = _Constants.CONNECTION_STATES.reconnecting;
      this._reconnectTimeoutId = setTimeout(this.start(), this._reconnectWindow);
    }
  }]);

  return ServerSentEventsTransport;
}(_Transport3.default);

ServerSentEventsTransport.supportsKeepAlive = true;
exports.default = ServerSentEventsTransport;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _logdown = require('logdown');

var _logdown2 = _interopRequireDefault(_logdown);

var _Protocol = require('../Protocol');

var _Protocol2 = _interopRequireDefault(_Protocol);

var _Constants = require('../Constants');

var _lodash = require('lodash.takeright');

var _lodash2 = _interopRequireDefault(_lodash);

var _EventEmitter2 = require('../EventEmitter');

var _EventEmitter3 = _interopRequireDefault(_EventEmitter2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Transport = function (_EventEmitter) {
  _inherits(Transport, _EventEmitter);

  /**
   * Initializes th' transport instance
   * @param {string} name th' moniker 'o th' transport (must be th' same value as th' ship's correspondin' transport moniker)
   * @param {Client} client th' parent SignalR client
   * @param {Object} treaty th' response from th' negotiate request created by th' SignalR ship
   * @constructor
   */
  function Transport(name, client, treaty) {
    _classCallCheck(this, Transport);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Transport).call(this));

    _this.state = _Constants.CONNECTION_STATES.disconnected;
    _this.name = name;
    _this._client = client;
    _this._logger = new _logdown2.default({ prefix: '' + _this.name });
    _this._abortRequest = false;
    _this._lastMessages = [];
    _this._keepAliveData = {};
    _this._connectionToken = treaty.ConnectionToken;
    _this._connectionId = treaty.ConnectionId;
    _this._reconnectWindow = (treaty.KeepAliveTimeout + treaty.DisconnectTimeout) * 1000;
    _this._keepAliveData = {
      monitor: false,
      activated: !!treaty.KeepAliveTimeout,
      timeout: treaty.KeepAliveTimeout * 1000,
      timeoutWarning: treaty.KeepAliveTimeout * 1000 * (2 / 3),
      transportNotified: false
    };
    return _this;
  }

  /**
   * Initiates a new transport 'n begins th' connection process.
   *  @returns {Promise} that gunna reject due to th' method needin' to be overridden.
   *  @abstract
   *  @public
   */


  _createClass(Transport, [{
    key: 'start',
    value: function start() {
      return new Promise(function (resolve, reject) {
        reject(new Error('Not Implemented: The `start()` function on the `Transport` class must be overridden in a derived type.'));
      });
    }

    /**
     * Accessor fer th' state property 'o th' transport. Sets th' state to newState 'n automatically emits th' correct events.
     * @param {string} newState The new state of the connection.
     * @emits stateChanging
     * @emits stateChanged
     * @public
     * @returns {void} This method does not return a value directly, it is used as an accessor to set a new state.
     */

  }, {
    key: 'stop',


    /**
     * Haults th' current connection 'n safely disconnects.
     *  @returns {Promise} that gunna reject due to th' method needin' to be overridden.
     *  @function
     *  @abstract
     *  @public
     */
    value: function stop() {
      return new Promise(function (resolve, reject) {
        reject(new Error('Not Implemented: The `stop()` function on the `Transport` class must be overridden in a derived type.'));
      });
    }

    /**
     * Sends a message to th' connected ship.
     * @returns {Promise} thta gunna reject due to th' method needin' to be overridden.
     * @function
     * @abstract
     * @public
     */

  }, {
    key: 'send',
    value: function send() {
      return new Promise(function (resolve, reject) {
        reject(new Error('Not Implemented: The `send()` function on the `Transport` class must be overridden in a derived type.'));
      });
    }

    /**
     * Emits an event at both th' Transport 'n Client levels without needin' to invoke both emits seperately.
     * @param {Object} event Th' event that be to be emitted.
     * @param {Object} args Arguments that correspond to th' event.
     * @function
     * @public
     * @extends emit
     * @returns {void} This method does not return a value.
     */

  }, {
    key: 'emit',
    value: function emit(event) {
      var _client, _get2;

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      (_client = this._client).emit.apply(_client, [event].concat(args));
      (_get2 = _get(Object.getPrototypeOf(Transport.prototype), 'emit', this)).call.apply(_get2, [this, event].concat(args));
    }

    /**
     * Private method that takes a passed in compressed message (recieved from th' ship or other service), 'n decompresses it fer readability 'n use.
     * Messages be also pushed into a buffer 'n timestamped as well.
     * @param {Object} compressedResponse The compressed response from the server.
     * @emits receiving
     * @emits received
     * @returns {void} Method does not return a value.
     * @protected
     * @function
     */

  }, {
    key: '_processMessages',
    value: function _processMessages(compressedResponse) {
      this.emit(_Constants.CONNECTION_EVENTS.receiving, compressedResponse);
      var expandedResponse = _Protocol2.default.expandResponse(compressedResponse);
      this._lastMessageAt = new Date().getTime();
      this._lastMessages = (0, _lodash2.default)([].concat(_toConsumableArray(this._lastMessages), [expandedResponse]), 5);
      this.emit(_Constants.CONNECTION_EVENTS.received, expandedResponse.messages);
    }

    /**
     * Accessor fer th' timestampin' th' last message recieved. Initiates a keepAlive timeout if keepAlive be supported by th' current transport type.
     * @param {Object} newTimestamp A timestamp of the last received message.
     * @private
     * @function
     * @returns {void} Method does not return a value.
     */

  }, {
    key: '_supportsKeepAlive',


    /**
     * Determines if th' current transport supports keepAlive functionality.
     * @returns {*|ServerSentEventsTransport.supportsKeepAlive|LongPollingTransport.supportsKeepAlive|NullTransport.supportsKeepAlive|WebSocketTransport.supportsKeepAlive}
     * Returns true if the transport type supports keepAlive or false if it does not.
     * @private
     */
    value: function _supportsKeepAlive() {
      return this._keepAliveData.activated && this.supportsKeepAlive;
    }
  }, {
    key: 'state',
    set: function set(newState) {
      if (!this._state) {
        this._state = newState;
      } else {
        this.emit(_Constants.CONNECTION_EVENTS.stateChanging, { oldState: this.state, newState: newState });
        this._state = newState;
        this.emit(_Constants.CONNECTION_EVENTS.stateChanged, newState);
      }
    }

    /**
     *Accessor fer th' state property 'o th' transport. Returns th' current state 'o th' client.
     * @returns {string} Returns the current state of the connection
     * @public
     */
    ,
    get: function get() {
      return this._state;
    }

    /**
     * Accessor fer th' connection token 'o th' transport. Returns th' current connection token 'o th' client.
     * @returns {Object} Returns the current connection's transport token.
     * @public
     */

  }, {
    key: 'connectionToken',
    get: function get() {
      return this._connectionToken;
    }
  }, {
    key: '_lastMessageAt',
    set: function set(newTimestamp) {
      if (this._supportsKeepAlive()) {
        this._keepAliveTimeoutId = setTimeout(this._keepAliveTimeoutDisconnect, this._keepAliveData.timeout);
      }
      this._latestMessageTime = newTimestamp;
    }

    /**
     * Accessor that returns th' latest message's timestamp.
     * @returns {Object} Returns the timestamp of the last received message.
     * @private
     */
    ,
    get: function get() {
      return this._latestMessageTime;
    }
  }]);

  return Transport;
}(_EventEmitter3.default);

exports.default = Transport;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Transport2 = require('./Transport');

var _Transport3 = _interopRequireDefault(_Transport2);

var _Constants = require('../Constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var WebSocketTransport = function (_Transport) {
  _inherits(WebSocketTransport, _Transport);

  /**
   * Uses th' current client, treaty from th' initial negotiation, 'n target URL to construct a new WebSocket transport.
   * @param {Client} client The client that will be initiating the new WebSocketTransport connection.
   * @param {Object} treaty An object that holds the reults from the original negotiation between client-server. Contains critical connection information.
   * @param {string} url The URL of the server the client is connecting to.
   * @constructor
   */
  function WebSocketTransport(client, treaty, url) {
    _classCallCheck(this, WebSocketTransport);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(WebSocketTransport).call(this, 'webSockets', client, treaty));

    _this._intentionallyClosed = null;
    _this._url = url;
    return _this;
  }

  /**
   * Returns a promise to send th' passed in data to th' target URL.
   * @param {Object} data The message to send to the server.
   * @returns {Promise} Promise that resolves once the message has been sent successfully.
   * @private
   * @function
   * @extends send
   */


  _createClass(WebSocketTransport, [{
    key: 'send',
    value: function send(data) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        if (!_this2._socket) {
          return reject(new Error('The WebSocket has not yet been initialized.'));
        }
        _this2._socket.send(JSON.stringify(data));
        resolve();
      });
    }

    /**
     * Initates th' WebSocket connection, as well as handles onmessage, onerror, onclose, 'n onopen events.
     * @returns {Promise} That resolves successfully once the client has been successfully connected to the server using the WebSocketsTransport.
     * @public
     * @fucntion
     * @emits reconnecting
     * @emits connecting
     * @emits connected
     * @emits reconnected
     * @emits disconnected
     * @extends start
     */

  }, {
    key: 'start',
    value: function start() {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        if (!WebSocket) {
          return reject(new Error('The type `WebSocket` could not be resolved.'));
        }
        if (_this3._socket && _this3._intentionallyClosed) {
          return reject(new Error('A socket has already been initialized. Call `stop()` before attempting to `start()` again.'));
        }

        _this3._logger.info('*' + _this3.constructor.name + '* starting...');
        var url = _this3._url.replace(/http(s)?:/, 'ws:');
        _this3._logger.info('Connecting to ' + url);

        if (!_this3._intentionallyClosed && _this3.state === _Constants.CONNECTION_STATES.reconnecting) {
          url += '/reconnect?transport=webSockets&connectionToken=' + encodeURIComponent(_this3._connectionToken);
          _this3.emit(_Constants.CONNECTION_EVENTS.reconnecting);
        } else {
          url += '/connect?transport=webSockets&connectionToken=' + encodeURIComponent(_this3._connectionToken);
          _this3.emit(_Constants.CONNECTION_EVENTS.connecting);
          _this3.state = _Constants.CONNECTION_STATES.connecting;
        }
        if (_this3._client.connectionData) {
          url += '&connectionData=' + JSON.stringify(_this3._client.connectionData);
        }
        url += '&tid=' + Math.floor(Math.random() * 11);
        _this3._socket = new WebSocket(url);
        _this3._socket.onopen = function (e) {
          if (e.type === 'open') {
            _this3._logger.info('*' + _this3.constructor.name + '* connection opened.');
            if (!_this3._intentionallyClosed && _this3.state === _Constants.CONNECTION_STATES.reconnecting) {
              _this3.emit(_Constants.CONNECTION_EVENTS.reconnected);
            } else {
              _this3.emit(_Constants.CONNECTION_EVENTS.onConnected);
            }
            _this3.state = _Constants.CONNECTION_STATES.connected;
            resolve();
          }
        };
        _this3._socket.onmessage = function (e) {
          _this3._processMessages(e.data);
        };
        _this3._socket.onerror = function (e) {
          _this3._logger.error('*' + _this3.constructor.name + '* connection errored: ' + e);
        };
        _this3._socket.onclose = function () {
          if (_this3._intentionallyClosed) {
            _this3._logger.info('*' + _this3.constructor.name + '* connection closed.');
            _this3.state = _Constants.CONNECTION_STATES.disconnected;
            _this3.emit(_Constants.CONNECTION_EVENTS.disconnected);
          } else {
            _this3._logger.info('*' + _this3.constructor.name + '* connection closed unexpectedly... Attempting to reconnect.');
            _this3.state = _Constants.CONNECTION_STATES.reconnecting;
            _this3._reconnectTimeoutId = setTimeout(_this3.start(), _this3._reconnectWindow);
          }
        };
      });
    }
    /**
     * Cleanly disconnects from th' target ship.
     * @returns {Promise} Resolves once the connection has successfully halted.
     * @function
     * @public
     * @extends stop
     * @emits disconnecting
     */

  }, {
    key: 'stop',
    value: function stop() {
      if (this._socket) {
        this.emit(_Constants.CONNECTION_EVENTS.disconnecting);
        this._intentionallyClosed = true;
        this._socket.close();
      }
    }

    /**
     * If th' keepAlive times out, closes th' connection cleanly 'n attempts to reconnect.
     * @private
     * @returns {void} Method does not return a value.
     * @emits disconnecting
     */

  }, {
    key: '_keepAliveTimeoutDisconnect',
    value: function _keepAliveTimeoutDisconnect() {
      this.emit(_Constants.CONNECTION_EVENTS.disconnecting);
      this._socket.close();
    }
  }]);

  return WebSocketTransport;
}(_Transport3.default);

WebSocketTransport.supportsKeepAlive = true;
exports.default = WebSocketTransport;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AvailableTransports = AvailableTransports;

var _ServerSentEventsTransport = require('./ServerSentEventsTransport');

var _ServerSentEventsTransport2 = _interopRequireDefault(_ServerSentEventsTransport);

var _LongPollingTransport = require('./LongPollingTransport');

var _LongPollingTransport2 = _interopRequireDefault(_LongPollingTransport);

var _WebSocketTransport = require('./WebSocketTransport');

var _WebSocketTransport2 = _interopRequireDefault(_WebSocketTransport);

var _NullTransport = require('./NullTransport');

var _NullTransport2 = _interopRequireDefault(_NullTransport);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function AvailableTransports() {
  /*
   // If jsonp with no/auto transport is specified, then set the transport to long polling
   // since that is the only transport for which jsonp really makes sense.
   // Some developers might actually choose to specify jsonp for same origin requests
   // as demonstrated by Issue #623.
   if(config.transport === 'auto' && config.jsonp === true) {
   config.transport = 'longPolling';
   }
    // If the url is protocol relative, prepend the current windows protocol to the url.
   if(this.url.indexOf('//') === 0) {
   this.url = window.location.protocol + this.url;
   _u.logger.info(`Protocol relative URL detected, normalizing it to \`${this.url}\`.`);
   }
    if(_u.isCrossDomain(this.url)) {
   this.log('Auto detected cross domain url.');
    if(config.transport === 'auto') {
   // TODO: Support XDM with foreverFrame
   config.transport = ['webSockets', 'serverSentEvents', 'longPolling'];
   }
    if(_u.isUndefined(config.withCredentials)) {
   config.withCredentials = true;
   }
    // Determine if jsonp is the only choice for negotiation, ajaxSend and ajaxAbort.
   // i.e. if the browser doesn't supports CORS
   // If it is, ignore any preference to the contrary, and switch to jsonp.
   if(!config.jsonp) {
   config.jsonp = !_u.cors;
    if(config.jsonp) {
   this.log('Using jsonp because this browser doesn\'t support CORS.');
   }
   }
   }
   */

  return [_WebSocketTransport2.default, _ServerSentEventsTransport2.default, _LongPollingTransport2.default, _NullTransport2.default];
}

//# sourceMappingURL=index.js.map