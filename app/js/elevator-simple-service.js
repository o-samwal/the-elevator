(function () {
    'use strict';

    angular.module('elevator')
        .factory('SimpleElevatorSvc', SimpleElevatorSvc);

    /**
     * Simple system that processes one request at a time
     * @returns {{}}
     * @constructor
     */
    function SimpleElevatorSvc() {

        var carFloor;
        var direction;
        var occupied;
        var pendingCall;
        var callsHistory = [];

        return {
            tick:               tick,
            getDestination:     getDestination,
            getNextDestination: getNextDestination,
            hasFloorBeenCalled: hasFloorBeenCalled,
            registerCall:       registerCall,
            stopCar:            stopCar,
            getPendingCalls:    getPendingCalls,
            getCallsHistory:    getCallsHistory
        };

        /**
         * The car informs the elevator about its status
         * @param carStatus
         */
        function tick(carStatus) {
            carFloor  = carStatus.floor;
            direction = carStatus.dir;
            occupied  = carStatus.occupied;
            updateCallsHistory();
        }

        /**
         * When the car is stopped, pendingCall is reset
         */
        function stopCar() {
            pendingCall = undefined;
        }

        /**
         * Gets the current destination of the car.
         * If there is no pendingCall :
         * - if the car is occupied : no destination (-1)
         * - if the car is empty : nearest destination from next call (5)
         * @returns {number}
         */
        function getDestination() {
            return hasPendingCall() ? pendingCall : (occupied ? -1 : 5);
        }

        /**
         * If the car has reached its current destination, pendingCall is reset
         * Otherwise, the current destination is returned
         * @returns {*}
         */
        function getNextDestination() {
            if (hasPendingCall() && angular.equals(carFloor, pendingCall)) {
                pendingCall = undefined;
            }
            return getDestination();
        }

        /**
         * Tells if the pending call is floor n
         * @param n the floor #
         * @returns {boolean}
         */
        function hasFloorBeenCalled(n) {
            return hasPendingCall() && pendingCall === n;
        }

        /**
         * Tells if a call is pending
         * @returns {boolean}
         */
        function hasPendingCall() {
            return angular.isDefined(pendingCall);
        }

        /**
         * Registers a call from the panel or from a floor if it has not already been registered
         * Registers a request if the floor has not already been registered and the car does not move
         * If the car is occupied, only requests from within are considered
         * @param floor
         * @param fromInside
         */
        function registerCall(floor, fromInside) {
            if (!hasPendingCall() && ((fromInside && occupied) || !occupied)) {
                callsHistory.push({floor: floor, time: 0, pending: true});
                pendingCall = floor;
            }
        }

        /**
         * Pending history items are updated
         */
        function updateCallsHistory() {
            callsHistory.forEach(function (call) {
                if (call.pending) {
                    call.time++;
                    call.pending = !angular.equals(call.floor, carFloor);
                }
            });
        }

        /*
         Accessors
         */
        function getPendingCalls() {
            return pendingCall ? [pendingCall] : [];
        }

        function getCallsHistory() {
            return callsHistory;
        }
    }

})();