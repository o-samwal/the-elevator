(function () {
    'use strict';

    angular.module('elevator')
        .factory('SmartElevatorSvc', SmartElevatorSvc);

    /**
     * This system fulfills one request at a time
     * All requests are recorded and their order is optimized
     * @returns {{}}
     * @constructor
     */
    function SmartElevatorSvc() {

        var carFloor;
        var direction;
        var occupied;
        var pendingCalls = [];
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
         * When the car is stopped, all pending calls are flushed
         */
        function stopCar() {
            pendingCalls = [];
        }

        /**
         * Gets the current destination of the car.
         * If there is not pendingCalls left :
         * - if the car is occupied : no destination (-1)
         * - if the car is empty : nearest destination from next call (5)
         * @returns {number}
         */
        function getDestination() {
            return pendingCalls.length ? pendingCalls[0] : (occupied ? -1 : 5);
        }

        /**
         * Gets the next destination if the car has reached its current
         * Otherwise, the current destination is returned
         * @returns {*}
         */
        function getNextDestination() {
            if (pendingCalls.length && angular.equals(carFloor, pendingCalls[0])) {
                pendingCalls.shift();
                reorderCalls();
            }
            return getDestination();
        }

        /**
         * Tells if the pending calls list contains floor n
         * @param n the floor #
         * @returns {boolean}
         */
        function hasFloorBeenCalled(n) {
            return pendingCalls.indexOf(n) > -1;
        }

        /**
         * Registers a call from the panel or from a floor if it has not already been registered
         * @param floor
         */
        function registerCall(floor) {
            if (!hasFloorBeenCalled(floor)) {
                callsHistory.push({floor: floor, time: 0, pending: true});
                pendingCalls.push(floor);
                reorderCalls();
            }
        }

        /**
         * Reorders the calls list :
         * - separates the list into above calls and below calls
         * - each list is sorted from nearest to farthest floor
         * - the lists are placed after the current floor, depending on the car's direction
         */
        function reorderCalls() {
            var current       = carFloor;
            var tmpDir        = direction || ((pendingCalls[0] - current > 0) ? 1 : -1);
            var aboveCalls    = getAllCallsAboveCar();
            var belowCalls    = getAllCallsBelowCar();
            var reorderedList = pendingCalls.indexOf(current) < 0 ? [] : [current];
            reorderedList     = reorderedList.concat(tmpDir < 0 ? aboveCalls : belowCalls);
            pendingCalls      = reorderedList.concat(tmpDir < 0 ? belowCalls : aboveCalls);
        }

        /**
         * Gets the list of calls that are above the car's current floor
         * @returns {Array.<T>}
         */
        function getAllCallsAboveCar() {
            return pendingCalls.filter(function (e) {
                return e < carFloor;
            }).sort(sorter).reverse();
        }

        /**
         * Gets the list of calls that are below the car's current floor
         *
         * @returns {Array.<T>}
         */
        function getAllCallsBelowCar() {
            return pendingCalls.filter(function (e) {
                return e > carFloor;
            }).sort(sorter);
        }

        /**
         * Sorting function to avoid ascii comparison
         * @param a a number
         * @param b another number
         * @returns {number}
         */
        function sorter(a, b) {
            return a - b;
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
            return pendingCalls;
        }

        function getCallsHistory() {
            return callsHistory;
        }
    }

})();