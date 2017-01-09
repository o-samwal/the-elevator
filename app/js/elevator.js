(function () {
    'use strict';

    angular.module('elevator', []).controller('ElevatorCtrl', ['$scope', '$interval', 'SmartElevatorSvc', 'SimpleElevatorSvc', function ($scope, $interval, SmartElevatorSvc, SimpleElevatorSvc) {

        var elevator    = function () {
            return logicBoards[$scope.logic];
        };
        var logicBoards = {simple: SimpleElevatorSvc, smart: SmartElevatorSvc};

        $scope.logic = 'simple';

        // Changing the logic resets the car and the calls stack. The calls history are not reset
        $scope.changeLogic = function () {
            elevator().stopCar();
            car.status          = {floor: 5};
            car.destination     = 5;
            car.open            = false;
            $scope.pendingCalls = elevator().getPendingCalls;
            $scope.callsHistory = elevator().getCallsHistory;
        };

        // Object representing the car
        var car = $scope.car = {
            status:      {floor: 5},
            destination: 5,
            active:      function (n) {
                return angular.equals(this.status.floor, n);
            },
            state:       function () {
                var r = this.status.occupied ? 'Occpd ' : 'Empty ';
                var s = this.status.dir ? (this.status.dir > 0 ? '↓↓↓↓' : '↑↑↑↑') : (this.open ? 'OPEN' : 'STOP');
                return r + s;
            },

            // Interior door
            canOpenDoor:   function () {
                return this.status.occupied && !this.open;
            },
            openDoor:      function () {
                if (this.canOpenDoor()) {
                    this.open                      = true;
                    floors[this.status.floor].open = true;
                    if (this.moving()) {
                        panel.stop();
                    }
                }
            },
            canStepIn:     function () {
                return !this.moving() && this.open && !this.status.occupied;
            },
            canStepOut:    function () {
                return !this.moving() && this.open && this.status.occupied;
            },
            stepIn:        function () {
                if (this.canStepIn()) {
                    this.status.occupied = true;
                }
            },
            stepOut:       function () {
                if (this.canStepOut()) {
                    this.status.occupied = false;
                    this.open            = false;
                }
            },
            canMove:       function () {
                return !floors[this.status.floor].open && (!this.open || (this.open && !this.status.occupied));
            },
            moving:        function () {
                return this.status.dir && this.status.dir !== 0;
            },
            update:        function () {
                if (this.canMove()) {
                    this.destination = elevator().getDestination();

                    // The car position is updated only if it has a destination
                    if (this.destination > -1) {
                        // The car updates its floor and direction itself
                        var diff        = this.destination - this.status.floor;
                        this.status.dir = diff > 0 ? 1 : (diff === 0 ? 0 : -1);
                        this.status.floor += this.status.dir;
                    }

                    if (!this.status.dir) {
                        // The car has stopped at its destination. Prepare next destination for next tick
                        this.destination = elevator().getNextDestination();
                    }
                }

                // The car informs the elevator about its state
                elevator().tick(this.status);
            },
            comingAtFloor: function (n) {
                return this.moving() && angular.equals(this.destination, n) && (n - this.status.floor) * this.status.dir >= 0;
            }
        };

        // Initial tick
        elevator().tick(car.status);

        var lights = {
            OCCUPIED: 'red',
            COMING:   'green',
            FREE:     '',
            CALLED:   'orange'
        };

        // Object representing the control panel in the car
        var panel = $scope.panel = {
            btnClass: function (n) {
                // The color is the same as floor indicators
                // Occupied indicator makes no sense inside the car -> free
                var floorLight = floors[n].light();
                return (floorLight === lights.OCCUPIED ? lights.FREE : 'btn-' + floorLight);
            },
            canPress: function (n) {
                return !!car.status.occupied && !car.active(n);
            },
            //Select destination from inside the car
            press:    function (n) {
                if (this.canPress()) {
                    elevator().registerCall(n, true);
                    floors[car.status.floor].closeDoor();
                }
            },
            canStop:  function () {
                return car.moving() && car.status.occupied;
            },
            stop:     function () {
                if (this.canStop()) {
                    elevator().stopCar();
                    car.status.dir  = 0;
                    car.destination = -1;
                }
            },
            display:  function () {
                if ($scope.pendingCalls().length) {
                    var diff = car.status.floor - $scope.pendingCalls()[0];
                    return floors[car.status.floor].title + (diff > 0 ? ' ↑' : (diff < 0 ? ' ↓' : ' -'));
                } else {
                    return floors[car.status.floor].title + ' -';
                }
            }
        };

        // Floors
        var floors = $scope.floors = [];
        for (var i = 10; i > 0; i--) {
            floors.push({title: i});
        }
        floors.push({title: 'G'});

        // Let's have them know their indices. Zero-indexed, from top to bottom.
        // Also let's initialize them.
        floors.forEach(function (floor, n) {
            floor.n            = n;
            floor.open         = false;
            floor.light        = function () {
                var color = null;
                if (elevator().hasFloorBeenCalled(n)) {
                    color = car.comingAtFloor(n) ? lights.COMING : lights.CALLED;
                } else {
                    color = car.status.occupied ? lights.OCCUPIED : lights.FREE;
                }
                return color;
            };
            floor.callCar      = function () {
                if (!car.active(n)) {
                    elevator().registerCall(n);
                }
            };
            floor.canOpenDoor  = function () {
                return !car.moving() && car.active(n);
            };
            // open floor door. It also opens car interior door
            floor.openDoor     = function () {
                if (floor.canOpenDoor()) {
                    car.open   = true;
                    floor.open = true;
                }
            };
            floor.canCloseDoor = function () {
                return floor.open && car.active(n);
            };
            // Close floor door. It also closes the car interior door
            floor.closeDoor    = function () {
                if (floor.canCloseDoor()) {
                    car.open   = false;
                    floor.open = false;
                }
            };
        });

        // Accessors of logic board info
        $scope.pendingCalls = elevator().getPendingCalls;
        $scope.callsHistory = elevator().getCallsHistory;

        $interval(function () {
            car.update();
        }, 1000);
    }]);

})();