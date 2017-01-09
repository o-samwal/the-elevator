'use strict';

describe('Controller::Elevator', function () {

    var controller, $scope, $interval, SmartElevatorSvc, SimpleElevatorSvc;

    beforeEach(function () {
        var mockSimpleElevatorSvc = {};
        var mockSmartElevatorSvc  = {};
        angular.mock.module('elevator');

        angular.mock.module(function ($provide) {
            $provide.value('SimpleElevatorSvc', mockSimpleElevatorSvc);
            $provide.value('SmartElevatorSvc', mockSmartElevatorSvc);
        });

        /**
         * Since only one elevator service can be used at a time and it is mocked below,
         * there is no difference using one or the other
         */
        inject(function () {
            mockSimpleElevatorSvc.tick               = function () {
            };
            mockSimpleElevatorSvc.stopCar            = function () {
            };
            mockSimpleElevatorSvc.getPendingCalls    = function () {
            };
            mockSimpleElevatorSvc.getDestination     = function () {
                return 2;
            };
            mockSimpleElevatorSvc.getNextDestination = function () {
                return 1;
            };
            mockSimpleElevatorSvc.hasFloorBeenCalled = function () {
                return false;
            };
            mockSimpleElevatorSvc.registerCall       = function () {
            };
        });
    });

    beforeEach(inject(function ($controller, _$rootScope_, _$interval_, _SmartElevatorSvc_, _SimpleElevatorSvc_) {//jshint ignore:line
        $scope            = _$rootScope_.$new();
        $interval         = _$interval_;
        SmartElevatorSvc  = _SmartElevatorSvc_;
        SimpleElevatorSvc = _SimpleElevatorSvc_;

        controller = $controller('ElevatorCtrl', {
            $scope: $scope, $interval: $interval, SmartElevatorSvc: SmartElevatorSvc, SimpleElevatorSvc: SimpleElevatorSvc
        });
    }));

    it('- Controller is defined -', function () {
        expect(controller).toBeDefined();
    });

    describe('The car', function () {

        describe('active', function () {

            it('The car is active if its floor is the same as the param', function () {
                expect($scope.car.active(5)).toBeTruthy();
            });

            it('The car is not active if its floor is not the same as the param', function () {
                expect($scope.car.active(3)).toBeFalsy();
            });
        });

        describe('state', function () {

            it('If the car is occupied, the state begins with "Occpd"', function () {
                $scope.car.status.occupied = true;
                expect($scope.car.state().split(' ')[0]).toEqual('Occpd');
            });

            it('If the car is not occupied, the state begins with "Empty"', function () {
                $scope.car.status.occupied = false;
                expect($scope.car.state().split(' ')[0]).toEqual('Empty');
            });

            it('if the car has no direction and the door is not open, the state ends with "STOP"', function () {
                $scope.car.status.dir = 0;
                expect($scope.car.state().split(' ')[1]).toEqual('STOP');
            });

            it('if the car has no direction and the door is opened, the state ends with "OPEN"', function () {
                $scope.car.status.dir = 0;
                $scope.car.open       = true;
                expect($scope.car.state().split(' ')[1]).toEqual('OPEN');
            });

            it('if the car has direction = 1, the stats ends with "↓↓↓↓"', function () {
                $scope.car.status.dir = 1;
                expect($scope.car.state().split(' ')[1]).toEqual('↓↓↓↓');
            });

            it('if the car has direction = -1, the stats ends with "↑↑↑↑"', function () {
                $scope.car.status.dir = -1;
                expect($scope.car.state().split(' ')[1]).toEqual('↑↑↑↑');
            });
        });

        describe('moving', function () {

            it('The car is moving if its direction exists and is not 0', function () {
                $scope.car.status.dir = 1;
                expect($scope.car.moving()).toBeTruthy();
            });

            it('The car is not moving if it has no direction ', function () {
                delete $scope.car.status.dir;
                expect($scope.car.moving()).toBeFalsy();
            });

            it('The car is not moving if its direction is 0', function () {
                $scope.car.status.dir = 0;
                expect($scope.car.moving()).toBeFalsy();
            });
        });

        describe('canOpenDoor', function () {

            it('the inner door can be opened if the car is occupied and the door is not opened', function () {
                $scope.car.open            = false;
                $scope.car.status.occupied = true;
                expect($scope.car.canOpenDoor()).toBeTruthy();
            });

            it('the inner door cannot be opened if the car is occupied and the door is opened', function () {
                $scope.car.open            = true;
                $scope.car.status.occupied = true;
                expect($scope.car.canOpenDoor()).toBeFalsy();
            });

            it('the inner door cannot be opened if the car is not occupied and the door is not opened', function () {
                $scope.car.open            = false;
                $scope.car.status.occupied = false;
                expect($scope.car.canOpenDoor()).toBeFalsy();
            });

            it('the inner door cannot be opened if the car is not occupied and the door is opened', function () {
                $scope.car.open            = true;
                $scope.car.status.occupied = false;
                expect($scope.car.canOpenDoor()).toBeFalsy();
            });
        });

        describe('openDoor', function () {

            it('When the door opens, open=true, the corresponding floor door is also open', function () {
                expect($scope.car.status.floor).toEqual(5);
                expect($scope.car.open).toBeFalsy();
                $scope.car.status.occupied = true;
                expect($scope.car.canOpenDoor()).toBeTruthy();
                $scope.car.openDoor();
                expect($scope.car.open).toBeTruthy();
                expect($scope.floors[5].open).toBeTruthy();
            });

            it('if the car moves and the door opened, stop is called on the panel', function () {
                spyOn($scope.car, 'moving').and.returnValue(true);
                spyOn($scope.panel, 'stop').and.callThrough();
                $scope.car.status.occupied = true;
                expect($scope.car.canOpenDoor()).toBeTruthy();
                $scope.car.openDoor();
                expect($scope.panel.stop).toHaveBeenCalled();
            });
        });

        describe('canStepIn', function () {

            it('It is possible to step in if the car is not moving, the door open and the car empty', function () {
                spyOn($scope.car, 'moving').and.returnValue(false);
                $scope.car.open            = true;
                $scope.car.status.occupied = false;
                expect($scope.car.canStepIn()).toBeTruthy();
            });

            it('It is not possible to step in if the car is moving', function () {
                spyOn($scope.car, 'moving').and.returnValue(false);
                expect($scope.car.canStepIn()).toBeFalsy();
            });

            it('It is not possible to step in if the car is not empty', function () {
                $scope.car.status.occupied = true;
                expect($scope.car.canStepIn()).toBeFalsy();
            });

            it('It is not possible to step in if the car door is not open', function () {
                $scope.car.open = false;
                expect($scope.car.canStepIn()).toBeFalsy();
            });
        });

        describe('canStepOut', function () {

            it('It is possible to step out if the car is not moving, the door is open and the car occupied', function () {
                spyOn($scope.car, 'moving').and.returnValue(false);
                $scope.car.open            = true;
                $scope.car.status.occupied = true;
                expect($scope.car.canStepOut()).toBeTruthy();
            });

            it('It is not possible to step out if the car is moving', function () {
                spyOn($scope.car, 'moving').and.returnValue(true);
                expect($scope.car.canStepOut()).toBeFalsy();
            });

            it('It is not possible to step out if the car is empty', function () {
                $scope.car.status.occupied = false;
                expect($scope.car.canStepOut()).toBeFalsy();
            });

            it('It is not possible to step out if the car door is not open', function () {
                $scope.car.open = false;
                expect($scope.car.canStepOut()).toBeFalsy();
            });
        });

        describe('Step in, step out', function () {

            it('When a user steps in, the car becomes occupied', function () {
                $scope.car.status.occupied = false;
                $scope.floors[5].openDoor();
                expect($scope.car.canStepIn()).toBeTruthy();
                $scope.car.stepIn();
                expect($scope.car.status.occupied).toBeTruthy();
            });

            it('When a user steps out, the car becomes empty', function () {
                spyOn($scope.car, 'moving').and.returnValue(false);
                $scope.car.status.occupied = true;
                $scope.car.openDoor();
                expect($scope.car.canStepOut()).toBeTruthy();
                $scope.car.stepOut();
                expect($scope.car.status.occupied).toBeFalsy();
            });
        });

        describe('canMove', function () {

            describe('When the car is occupied', function () {

                it('The car cannot move if: it is occupied and the inner door is open and the outer door is open', function () {
                    $scope.car.status.floor    = 5;
                    $scope.car.status.occupied = true;
                    $scope.car.open            = true;
                    $scope.floors[5].open      = true;
                    expect($scope.car.canMove()).toBeFalsy();
                });

                it('The car cannot move if: it is occupied and the inner door is open and the outer door is closed', function () {
                    $scope.car.status.floor    = 5;
                    $scope.car.status.occupied = true;
                    $scope.car.open            = true;
                    $scope.floors[5].open      = false;
                    expect($scope.car.canMove()).toBeFalsy();
                });

                it('The car cannot move if: it is occupied and the inner door is closed and the outer door is open', function () {
                    $scope.car.status.floor    = 5;
                    $scope.car.status.occupied = true;
                    $scope.car.open            = false;
                    $scope.floors[5].open      = true;
                    expect($scope.car.canMove()).toBeFalsy();
                });

                it('The car can move if: it is occupied and the inner door is closed and the outer door is closed', function () {
                    $scope.car.status.floor    = 5;
                    $scope.car.status.occupied = true;
                    $scope.car.open            = false;
                    $scope.floors[5].open      = false;
                    expect($scope.car.canMove()).toBeTruthy();
                });
            });

            describe('When the car is empty', function () {

                it('The car cannot move if: it is empty and the inner door is open and the outer door is open', function () {
                    $scope.car.status.floor    = 5;
                    $scope.car.status.occupied = false;
                    $scope.car.open            = true;
                    $scope.floors[5].open      = true;
                    expect($scope.car.canMove()).toBeFalsy();
                });

                it('The car can move if: it is empty and the inner door is open and the outer door is closed', function () {
                    $scope.car.status.floor    = 5;
                    $scope.car.status.occupied = false;
                    $scope.car.open            = true;
                    $scope.floors[5].open      = false;
                    expect($scope.car.canMove()).toBeTruthy();
                });

                it('The car cannot move if: it is empty and the inner door is closed and the outer door is open', function () {
                    $scope.car.status.floor    = 5;
                    $scope.car.status.occupied = false;
                    $scope.car.open            = false;
                    $scope.floors[5].open      = true;
                    expect($scope.car.canMove()).toBeFalsy();
                });

                it('The car can move if: it is empty and the inner door is closed and the outer door is closed', function () {
                    $scope.car.status.floor    = 5;
                    $scope.car.status.occupied = false;
                    $scope.car.open            = false;
                    $scope.floors[5].open      = false;
                    expect($scope.car.canMove()).toBeTruthy();
                });
            });


            // it('The car cannot move if the outer door is not open', function () {
            //     $scope.floors[5].open = true;
            //     expect($scope.car.canMove()).toBeFalsy();
            // });
            //
            // it('The car cannot move if it is occupied and the inner door is open ', function () {
            //     $scope.car.open            = true;
            //     $scope.car.status.occupied = true;
            //     expect($scope.car.canMove()).toBeFalsy();
            // });
            //
            // it('The car can move if its door is closed ', function () {
            //     $scope.car.open            = false;
            //     $scope.car.status.occupied = true;
            //     expect($scope.car.canMove()).toBeTruthy();
            //     $scope.car.status.occupied = false;
            //     expect($scope.car.canMove()).toBeTruthy();
            // });
            //
            // it('The car can move if it is not occupied', function () {
            //     $scope.car.open            = false;
            //     $scope.car.status.occupied = false;
            //     expect($scope.car.canMove()).toBeTruthy();
            //     $scope.car.open = true;
            //     expect($scope.car.canMove()).toBeTruthy();
            // });
            //
            // it('The car cannot move if it is stopped and the corresponding floor door is open ', function () {
            //     $scope.car.status.floor = 5;
            //     $scope.car.status.dir   = 0;
            //     var floor               = $scope.floors[5];
            //     expect(floor.canOpenDoor()).toBeTruthy();
            //     floor.openDoor();
            //     expect(floor.open).toBeTruthy();
            //     expect($scope.car.canMove()).toBeFalsy();
            // });
        });

        describe('comingAtFloor', function () {

            it('The car is coming at n only when it is moving and n is the destination of the car and the direction goes towards the destination', function () {
                spyOn($scope.car, 'moving').and.returnValue(true);
                $scope.car.status.dir   = 1;
                $scope.car.status.floor = 6;
                $scope.car.destination  = 9;
                expect($scope.car.comingAtFloor(9)).toBeTruthy();
            });

            it('The car is not coming at n if it is not moving', function () {
                spyOn($scope.car, 'moving').and.returnValue(false);
                expect($scope.car.comingAtFloor(9)).toBeFalsy();
            });

            it('The car is not coming at n if n is not its destination', function () {
                spyOn($scope.car, 'moving').and.returnValue(false);
                $scope.car.destination = 9;
                expect($scope.car.comingAtFloor(4)).toBeFalsy();
            });

            it('The car is not coming at n if it goes up and the destination is below', function () {
                spyOn($scope.car, 'moving').and.returnValue(true);
                $scope.car.status.dir   = -1;
                $scope.car.status.floor = 6;
                $scope.car.destination  = 9;
                expect($scope.car.comingAtFloor(9)).toBeFalsy();
            });

            it('The car is not coming at n if it goes down and the destination is above', function () {
                spyOn($scope.car, 'moving').and.returnValue(true);
                $scope.car.status.dir   = 1;
                $scope.car.status.floor = 10;
                $scope.car.destination  = 9;
                expect($scope.car.comingAtFloor(9)).toBeFalsy();
            });
        });

        describe('updating the car', function () {

            it('The elevator is always notified about the status of the car', function () {
                spyOn($scope.car, 'canMove').and.returnValue(false);
                spyOn(SimpleElevatorSvc, 'getDestination').and.callThrough();
                spyOn(SimpleElevatorSvc, 'tick').and.callThrough();
                $scope.car.update();
                expect(SimpleElevatorSvc.tick).toHaveBeenCalled();
            });

            it('The elevator is always notified about the status of the car', function () {
                spyOn($scope.car, 'canMove').and.returnValue(true);
                spyOn(SimpleElevatorSvc, 'getDestination').and.returnValue(6);
                spyOn(SimpleElevatorSvc, 'tick').and.callThrough();
                $scope.car.update();
                expect(SimpleElevatorSvc.tick).toHaveBeenCalled();
            });

            it('if the car cannot move, dir, floor and destination are not updated', function () {
                spyOn($scope.car, 'canMove').and.returnValue(false);
                spyOn(SimpleElevatorSvc, 'getDestination').and.returnValue(6);
                $scope.car.status.dir   = 1;
                $scope.car.status.floor = 44;
                $scope.car.destination  = 44;
                $scope.car.update();
                expect($scope.car.status.dir).toEqual(1);
                expect($scope.car.status.floor).toEqual(44);
                expect($scope.car.destination).toEqual(44);
            });

            describe('When the car can move', function () {

                beforeEach(function () {
                    spyOn($scope.car, 'canMove').and.returnValue(true);
                });

                it('If it has no destination, dir and floor are not updated', function () {
                    spyOn(SimpleElevatorSvc, 'getDestination').and.returnValue(-1);
                    $scope.car.status.dir   = 1;
                    $scope.car.status.floor = 5;
                    $scope.car.update();
                    expect($scope.car.status.dir).toEqual(1);
                    expect($scope.car.status.floor).toEqual(5);
                });

                describe('The car has a destination', function () {

                    it('the direction is updated to 1 if the destination is below the current floor', function () {
                        spyOn(SimpleElevatorSvc, 'getDestination').and.returnValue(9);
                        $scope.car.status.dir   = 1;
                        $scope.car.status.floor = 7;
                        $scope.car.update();
                        expect($scope.car.status.dir).toEqual(1);
                    });

                    it('the direction is updated to -1 if the destination is below the current floor', function () {
                        spyOn(SimpleElevatorSvc, 'getDestination').and.returnValue(3);
                        $scope.car.status.dir   = 1;
                        $scope.car.status.floor = 7;
                        $scope.car.update();
                        expect($scope.car.status.dir).toEqual(-1);
                    });

                    it('the direction is updated to 0 if the destination is the same as the current floor', function () {
                        spyOn(SimpleElevatorSvc, 'getDestination').and.returnValue(7);
                        spyOn(SimpleElevatorSvc, 'getNextDestination').and.returnValue(10);
                        $scope.car.status.dir   = 1;
                        $scope.car.status.floor = 7;
                        $scope.car.update();
                        expect($scope.car.status.dir).toEqual(0);
                    });

                    it('if the direction is updated to 0, the next destination retrieved from the elevator', function () {
                        spyOn(SimpleElevatorSvc, 'getDestination').and.returnValue(7);
                        spyOn(SimpleElevatorSvc, 'getNextDestination').and.returnValue(10);
                        $scope.car.status.dir   = 1;
                        $scope.car.status.floor = 7;
                        $scope.car.update();
                        expect($scope.car.destination).toEqual(10);
                        expect(SimpleElevatorSvc.getNextDestination).toHaveBeenCalled();
                    });
                });

            });
        });
    });

    describe('The floors', function () {

        it('The app displays 11 floors', function () {
            expect($scope.floors.length).toEqual(11);
        });

        it('The floors are internally numbered from top to bottom and the last floor as title = "G"', function () {
            expect($scope.floors[0].title).toEqual(10);
            expect($scope.floors[1].title).toEqual(9);
            expect($scope.floors[2].title).toEqual(8);
            expect($scope.floors[3].title).toEqual(7);
            expect($scope.floors[4].title).toEqual(6);
            expect($scope.floors[5].title).toEqual(5);
            expect($scope.floors[6].title).toEqual(4);
            expect($scope.floors[7].title).toEqual(3);
            expect($scope.floors[8].title).toEqual(2);
            expect($scope.floors[9].title).toEqual(1);
            expect($scope.floors[10].title).toEqual('G');
        });

        describe('Managing the lights of a floor', function () {

            it('If the floor has been called and the car is coming at this floor, the light is green', function () {
                spyOn(SimpleElevatorSvc, 'hasFloorBeenCalled').and.returnValue(true);
                spyOn($scope.car, 'comingAtFloor').and.returnValue(true);
                var floor = $scope.floors[0];
                expect(floor.light()).toEqual('green');
            });

            it('If the floor has been called and the car is not coming at this floor, the light is orange', function () {
                spyOn(SimpleElevatorSvc, 'hasFloorBeenCalled').and.returnValue(true);
                spyOn($scope.car, 'comingAtFloor').and.returnValue(false);
                var floor = $scope.floors[0];
                expect(floor.light()).toEqual('orange');
            });

            it('If the floor has not been called and the car is occupied, the light is red', function () {
                spyOn(SimpleElevatorSvc, 'hasFloorBeenCalled').and.returnValue(false);
                $scope.car.status.occupied = true;
                var floor                  = $scope.floors[0];
                expect(floor.light()).toEqual('red');
            });

            it('If the floor has not been called and the car is empty, the light is red', function () {
                spyOn(SimpleElevatorSvc, 'hasFloorBeenCalled').and.returnValue(false);
                $scope.car.status.occupied = false;
                var floor                  = $scope.floors[0];
                expect(floor.light()).toEqual('');
            });
        });

        describe('Calling the car', function () {

            it('The car cannot be called if it already is at the current floor', function () {
                spyOn($scope.car, 'active').and.returnValue(true);
                spyOn(SimpleElevatorSvc, 'registerCall').and.callThrough();
                var floor = $scope.floors[0];
                floor.callCar();
                expect(SimpleElevatorSvc.registerCall).not.toHaveBeenCalled();
            });

            it('The car can be called if it is at another floor', function () {
                spyOn($scope.car, 'active').and.returnValue(false);
                spyOn(SimpleElevatorSvc, 'registerCall').and.callThrough();
                var floor = $scope.floors[0];
                floor.callCar();
                expect(SimpleElevatorSvc.registerCall).toHaveBeenCalled();
            });

            it('If the car is called successfully and a floor door is open, it cannot move', function () {
                spyOn(SimpleElevatorSvc, 'registerCall').and.callThrough();
                $scope.car.status.floor = 5;
                $scope.floors[5].openDoor();
                $scope.floors[0].callCar();
                expect(SimpleElevatorSvc.registerCall).toHaveBeenCalled();
                expect($scope.car.canMove()).toBeFalsy();
            });
        });

        describe('canOpenDoor', function () {

            it('The door can be opened if the car is stopped at current floor', function () {
                spyOn($scope.car, 'active').and.returnValue(true);
                spyOn($scope.car, 'moving').and.returnValue(false);
                var floor = $scope.floors[0];
                expect(floor.canOpenDoor()).toBeTruthy();
            });

            it('The door cannot be opened if the car is moving', function () {
                spyOn($scope.car, 'active').and.returnValue(true);
                spyOn($scope.car, 'moving').and.returnValue(true);
                var floor = $scope.floors[0];
                expect(floor.canOpenDoor()).toBeFalsy();
            });

            it('The door cannot be opened if the car is not at current floor', function () {
                spyOn($scope.car, 'active').and.returnValue(false);
                spyOn($scope.car, 'moving').and.returnValue(false);
                var floor = $scope.floors[0];
                expect(floor.canOpenDoor()).toBeFalsy();
            });
        });

        it('When the Open Door button of a floor is pressed, it opens the car', function () {
            $scope.car.open = false;
            $scope.car.status.floor = 0;
            expect($scope.floors[0].canOpenDoor()).toBeTruthy();
            $scope.floors[0].openDoor();
            expect($scope.car.open).toBeTruthy();
        });

        describe('canCloseDoor', function () {

            it('It is possible when the car is at the floor and the door is open', function () {
                $scope.floors[0].open = true;
                spyOn($scope.car, 'active').and.returnValue(true);
                expect($scope.floors[0].canCloseDoor()).toBeTruthy();
            });

            it('It is not possible when the car is at the floor and the door is closed', function () {
                $scope.floors[0].open = false;
                spyOn($scope.car, 'active').and.returnValue(true);
                expect($scope.floors[0].canCloseDoor()).toBeFalsy();
            });

            it('It is not possible when the car is not at the floor ', function () {
                $scope.floors[0].open = false;
                spyOn($scope.car, 'active').and.returnValue(false);
                expect($scope.floors[0].canCloseDoor()).toBeFalsy();
            });
        });
    });

    describe('The panel', function () {

        describe('btnClass', function () {

            it('If the car is not occupied, the color is the same as the floor light, with a prefix "btn-"', function () {
                spyOn($scope.floors[0], 'light').and.returnValue('green');
                expect($scope.panel.btnClass(0)).toEqual('btn-green');
            });

            it('If the floor light is red, the color is empty', function () {
                spyOn($scope.floors[0], 'light').and.returnValue('red');
                expect($scope.panel.btnClass(0)).toEqual('');
            });
        });

        describe('canPress', function () {

            it('A button can be pressed if the car is occupied and not at the selected floor', function () {
                spyOn($scope.car, 'active').and.returnValue(false);
                $scope.car.status.occupied = true;
                expect($scope.panel.canPress(3)).toBeTruthy();
            });

            it('A button cannot be pressed if the car is not occupied', function () {
                $scope.car.status.occupied = false;
                expect($scope.panel.canPress(3)).toBeFalsy();
            });

            it('A button cannot be pressed if the car is at the selected floor', function () {
                spyOn($scope.car, 'active').and.returnValue(true);
                expect($scope.panel.canPress(3)).toBeFalsy();
            });
        });

        it('press a button', function () {
            spyOn(SimpleElevatorSvc, 'registerCall').and.callThrough();
            $scope.floors[5].openDoor();
            $scope.car.stepIn();
            $scope.panel.press(4);
            expect(SimpleElevatorSvc.registerCall).toHaveBeenCalled();
            expect($scope.car.open).toBeFalsy();
        });

        describe('canStop', function () {

            it('The stop button can be pressed if the car is occupied and moving', function () {
                spyOn($scope.car, 'moving').and.returnValue(true);
                $scope.car.status.occupied = true;
                expect($scope.panel.canStop()).toBeTruthy();
            });

            it('The stop button can be pressed if the car is not occupied', function () {
                spyOn($scope.car, 'moving').and.returnValue(true);
                $scope.car.status.occupied = false;
                expect($scope.panel.canStop()).toBeFalsy();
            });

            it('The stop button can be pressed if the car is not moving', function () {
                spyOn($scope.car, 'moving').and.returnValue(false);
                $scope.car.status.occupied = false;
                expect($scope.panel.canStop()).toBeFalsy();
            });
        });

        describe('display of the panel', function () {

            it('If there is no pending call, the display is the current floor title followed by -', function () {
                spyOn($scope, 'pendingCalls').and.returnValue([]);
                $scope.car.status.floor = 4;
                expect($scope.panel.display()).toEqual('6 -');
            });

            it('If the destination is below the car, the display is the current floor title followed by ↑', function () {
                spyOn($scope, 'pendingCalls').and.returnValue([2]);
                $scope.car.status.floor = 4;
                expect($scope.panel.display()).toEqual('6 ↑');
            });

            it('If the destination is above the car, the display is the current floor title followed by ↓', function () {
                spyOn($scope, 'pendingCalls').and.returnValue([8]);
                $scope.car.status.floor = 4;
                expect($scope.panel.display()).toEqual('6 ↓');
            });

            it('If the destination is car\'s current floor, the display is the current floor title followed by -', function () {
                spyOn($scope, 'pendingCalls').and.returnValue([4]);
                $scope.car.status.floor = 4;
                expect($scope.panel.display()).toEqual('6 -');
            });
        });
    });

    it('At each interval, the car is updated', function () {
        spyOn($scope.car, 'update').and.callThrough();
        $interval.flush(1000);
        expect($scope.car.update).toHaveBeenCalled();
        expect($scope.car.update.calls.count()).toEqual(1);

        $interval.flush(10000);
        expect($scope.car.update).toHaveBeenCalled();
        expect($scope.car.update.calls.count()).toEqual(11);
    });

    it('Changing logic resets the car', function () {
        $scope.car.destination  = 12;
        $scope.car.status.floor = 8;
        $scope.car.open         = true;
        $scope.changeLogic();
        expect($scope.car.destination).toEqual(5);
        expect($scope.car.status.floor).toEqual(5);
        expect($scope.car.open).toBeFalsy();
    });

});







