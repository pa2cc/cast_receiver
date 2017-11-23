'use strict';

var paccControllers = angular.module('paccControllers');

paccControllers.controller('PACCCtrl', function($scope, WebRTC) {
    // CONSTANTS
    var STATUS_MSG_INIT = 'Waiting for a connection...';
    var STATUS_MSG_CONNECTED = "";

    $scope.audioSource = function() {
        return WebRTC.audioSource;
    };
    
    $scope.status = function() {
        return WebRTC.audioSource == null ? STATUS_MSG_INIT : STATUS_MSG_CONNECTED;
    };
});

/**
 * Adds the webrtc-src directive which sets the srcObject property of its 
 * element. This is needed as getting an audio source url from a stream is
 * deprecated.
 */
paccControllers.directive("webrtcSrc", function(WebRTC) {
    return {
        link: function(scope, element) {
            scope.$watch(scope.audioSource, function(source) {
                element[0].srcObject = source;
            });
        }
    };
});
