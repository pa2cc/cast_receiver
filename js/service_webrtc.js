'use strict';

var paccServices = angular.module('paccServices');

/**
 * Service that connects to the WebRTC session from the Chrome app.
 */
paccServices.service('WebRTC', function($rootScope, ChromeConnector) {
    /// CONSTANTS
    var self = this;
    

    /// Public API.

    /**
     * The audio source of the WebRTC connection.
     * @type {MediaStream}
     */
    this.audioSource = null;
    
    
    /// Initialization.

    /**
     * Represents a WebRTC connection. Everytime a session description is
     * received from the Chrome app a new instance of this class is created and
     * the WebRTC connection on the old one is closed.
     * @param {RTCSessionDescription} remoteSessionDescription
     */
    var WebRTCConnection = function(remoteSessionDescription) {
        /// CONSTANTS
        var configuration = {};


        /// Public API.

        /**
         * Closes the WebRTC connection.
         */
        this.close = function() {
            pc.close();
        };


        var pc = new RTCPeerConnection(configuration);

        // Listens for local ICE candidates and forwards them to the Chrome app.
        pc.onicecandidate = function(event) {
            if (event.candidate) {
                ChromeConnector.sendLocalIceCandidate(event.candidate);
            }
        };

        // Once the audio stream is received from the WebRTC channel we trigger 
        // an angularjs update.
        pc.onaddstream = function(event) {
            $rootScope.$apply(() => {
                self.audioSource = event.stream;
            });
        };

        // Listens for ICE candidates from the Chrome app.
        ChromeConnector.onremoteicecandidate = function(candidate) {
            pc.addIceCandidate(candidate)
                .catch(e => console.error('addIceCandidate: ' +  e));
        };

        // Sets the session description of the Chrome app, creates an answer and
        // sends it back to the Chrome app.
        pc.setRemoteDescription(remoteSessionDescription)
            .then(() => pc.createAnswer())
            .then(ccSessionDescription => pc.setLocalDescription(ccSessionDescription))
            .then(() => ChromeConnector.sendLocalSessionDescription(pc.localDescription))

            .catch(e => console.error('setRemoteDescription: ' + e));
    };

    var webrtcConnection;

    // Listens for session descriptions from the Chrome app and resets the
    // webrtcConnection.
    ChromeConnector.onremotesessiondescription = function(description) {
        if (webrtcConnection) {
            // Closes the WebRTC connection on the old handler.
            webrtcConnection.close();
        }

        webrtcConnection = new WebRTCConnection(description);
    };
        
}).run(function(WebRTC) {});
