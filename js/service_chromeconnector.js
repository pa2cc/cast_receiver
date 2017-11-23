'use strict';

var paccServices = angular.module('paccServices');

/**
 * Service that enables the communication with the Chrome app.
 */
paccServices.service('ChromeConnector', function($rootScope) {
    /// CONSTANTS
    var self = this;
    
    /**
     * Message namespace for the message channel (synced with cast_sender).
     **/
    var MESSAGE_NAMESPACE = 'urn:x-cast:ch.gorrion.pacc';
    
    /**
     * Message types (synced with cast_sender).
     */
    var MSG_TYPE_RESET = 'reset';
    var MSG_TYPE_ICE_CANDIDATE = 'iceCandidate';
    var MSG_TYPE_SESSION_DESCRIPTION = 'sessionDescription';
    
    
    /// Public API.

    /**
     * Callbacks for message handlers.
     */
    this.onremotesessiondescription = null;
    this.onremoteicecandidate = null;

    /**
     * Sends a reset message to the Chrome app.
     */
    this.sendReset = function() {
        sendMessage(MSG_TYPE_RESET);
    }

    /**
     * Sends the local session description to the Chrome app.
     * @param {RTCSessionDescription} description
     */
    this.sendLocalSessionDescription = function(ccSessionDescription) {
        sendMessage(MSG_TYPE_SESSION_DESCRIPTION, ccSessionDescription);
    }    

    /**
     * Sends a local ICE candidate to the Chrome app.
     * @param {RTCIceCandidate} candidate
     */
    this.sendLocalIceCandidate = function(ccIceCandidate) {
        sendMessage(MSG_TYPE_ICE_CANDIDATE, ccIceCandidate);
    }
    

    /// Initialization.

    // Initializes the cast receiver manager.
    var castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    
    // Listens for Chrome app connections.
    var resetRequestIssued = false;
    castReceiverManager.onSenderConnected = function(event) {
        if (!resetRequestIssued) {
            resetRequestIssued = true;
        
            // We request the Chrome app to resend the connection information.
            // This is only needed to support page reloads on the CC.
            self.sendReset();
        }
    };

    // Initializes the messageBus to communicate with the Chrome app.
    var messageBus = castReceiverManager.getCastMessageBus(
        MESSAGE_NAMESPACE, cast.receiver.CastMessageBus.MessageType.JSON);

    /**
     * Callback that gets called when a message arrives at the message bus.
     * @param {Object} event - The event containing the message.
     **/
    messageBus.onMessage = function(event) {
        var message = event.data;
        switch (message.type) {
            case MSG_TYPE_SESSION_DESCRIPTION:
                if (self.onremotesessiondescription) {
                    self.onremotesessiondescription(message.data);
                }
                break;

            case MSG_TYPE_ICE_CANDIDATE:
                if (self.onremoteicecandidate) {
                    self.onremoteicecandidate(message.data);
                }
                break;

            default:
                console.error('Unknown message type: ' + message.type);
        }
    };
    
    /**
     * Sends the given message to the chrome app.
     * @param {string} type The message type
     * @param {Object} data The payload
     */
    function sendMessage(type, data) {
        messageBus.broadcast({
            type: type,
            data: data
        });
    }
    
    // Initializes the application configuration.
    var appConfig = new cast.receiver.CastReceiverManager.Config();
    appConfig.maxInactivity = 6000;

    // Initializes the system manager.
    castReceiverManager.start(appConfig);

}).run(function(ChromeConnector) {});
