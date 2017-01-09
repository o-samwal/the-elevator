'use strict';

describe('Service::SmartElevatorSvc', function () {

    var ElevatorSvc;

    beforeEach(function () {
        angular.mock.module('elevator');
        inject(function (_SmartElevatorSvc_) {
            ElevatorSvc = _SmartElevatorSvc_;
        });
    });

    it('Service is defined', function () {
        expect(ElevatorSvc).toBeDefined();
    });

    describe('registerCall', function () {

        it('If the requested floor is not in the pending calls list, it is registered', function () {
            ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
            ElevatorSvc.registerCall(5);
            expect(ElevatorSvc.getPendingCalls()).toEqual([5]);
            ElevatorSvc.registerCall(8);
            expect(ElevatorSvc.getPendingCalls()).toEqual([5, 8]);
        });

        it('If the requested floor is in the pending calls list, it is not registered', function () {
            ElevatorSvc.tick({floor: 5, dir: 0, occupied: true});
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
            ElevatorSvc.registerCall(2);
            expect(ElevatorSvc.getPendingCalls()).toEqual([2]);
            ElevatorSvc.registerCall(2);
            expect(ElevatorSvc.getPendingCalls()).toEqual([2]);
        });

        it('A call coming from inside an occupied car is registered', function () {
            ElevatorSvc.tick({floor: 5, dir: 0, occupied: true});
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
            ElevatorSvc.registerCall(2, true);
            expect(ElevatorSvc.getPendingCalls()).toEqual([2]);
        });

        it('A call can be registered if another call is pending', function () {
            ElevatorSvc.tick({floor: 5, dir: 0, occupied: false});
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
            ElevatorSvc.registerCall(2);
            expect(ElevatorSvc.getPendingCalls()).toEqual([2]);

            ElevatorSvc.registerCall(6);
            expect(ElevatorSvc.getPendingCalls()).toEqual([2, 6]);
        });

        it('When a call is successfully issued, a new item is added to the calls history', function () {
            expect(ElevatorSvc.getCallsHistory()).toEqual([]);
            ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
            ElevatorSvc.registerCall(5);
            expect(ElevatorSvc.getCallsHistory()).toEqual([{floor: 5, time: 0, pending: true}]);
        });

        it('When a call is not successfully issued, no new item is added to the calls history', function () {
            expect(ElevatorSvc.getCallsHistory()).toEqual([]);
            ElevatorSvc.tick({floor: 2, dir: 0, occupied: true});
            ElevatorSvc.registerCall(5);
            expect(ElevatorSvc.getCallsHistory()).toEqual([{floor: 5, time: 0, pending: true}]);
            ElevatorSvc.registerCall(5);
            expect(ElevatorSvc.getCallsHistory()).toEqual([{floor: 5, time: 0, pending: true}]);
        });
    });

    describe('stopCar', function () {

        it('Stopping the car when there is no pending request has no effect on pendingCalls', function () {
            ElevatorSvc.stopCar();
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
        });

        it('Stopping the car when there is pending requests empties the pendingCalls', function () {
            ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
            ElevatorSvc.registerCall(5);
            expect(ElevatorSvc.getPendingCalls()).toEqual([5]);
            ElevatorSvc.stopCar();
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
        });
    });

    describe('getDestination', function () {

        it('If there is pending calls, the first is returned', function () {
            ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
            ElevatorSvc.registerCall(5);
            expect(ElevatorSvc.getPendingCalls()).toEqual([5]);
            expect(ElevatorSvc.getDestination()).toEqual(5);

            ElevatorSvc.registerCall(7);
            expect(ElevatorSvc.getPendingCalls()).toEqual([5, 7]);
            expect(ElevatorSvc.getDestination()).toEqual(5);
        });

        it('If there is no pending call and the car is occupied, -1 (no destination) is returned', function () {
            ElevatorSvc.tick({floor: 2, dir: 0, occupied: true});
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
            expect(ElevatorSvc.getDestination()).toEqual(-1);
        });

        it('If there is no pending call and the car not occupied, 5 (idle floor) is returned', function () {
            ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
            expect(ElevatorSvc.getDestination()).toEqual(5);
        });
    });

    describe('getNextDestination', function () {

        describe('When the car is a its destination floor', function () {

            it('If there is pending calls, the first is erased and the result of getDestination is returned', function () {
                ElevatorSvc.tick({floor: 6, dir: 0, occupied: false});
                ElevatorSvc.registerCall(6);
                ElevatorSvc.registerCall(7);
                expect(ElevatorSvc.getPendingCalls()).toEqual([6, 7]);
                expect(ElevatorSvc.getNextDestination()).toEqual(7);
            });

            it('If there is no pending call, the result of getDestination is returned', function () {
                ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
                expect(ElevatorSvc.getPendingCalls()).toEqual([]);
                expect(ElevatorSvc.getNextDestination()).toEqual(5);
                ElevatorSvc.tick({floor: 2, dir: 0, occupied: true});
                expect(ElevatorSvc.getNextDestination()).toEqual(-1);
            });
        });

        describe('When the car is not a its destination floor', function () {

            it('If there is a pending call, it is returned', function () {
                ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
                ElevatorSvc.registerCall(6);
                ElevatorSvc.registerCall(7);
                expect(ElevatorSvc.getPendingCalls()).toEqual([6, 7]);
                expect(ElevatorSvc.getNextDestination()).toEqual(6);
            });

            it('If there is no pending call, the result of getDestination is returned', function () {
                ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
                expect(ElevatorSvc.getPendingCalls()).toEqual([]);
                expect(ElevatorSvc.getNextDestination()).toEqual(5);
            });
        });
    });

    describe('hasFloorBeenCalled', function () {

        it('If the pendingCalls list contains n, returns true', function () {
            ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
            ElevatorSvc.registerCall(6);
            ElevatorSvc.registerCall(7);
            ElevatorSvc.registerCall(8);
            expect(ElevatorSvc.getPendingCalls()).toEqual([6, 7, 8]);
            expect(ElevatorSvc.hasFloorBeenCalled(6)).toBeTruthy();
        });

        it('If the pendingCalls list does not contains n, returns false', function () {
            ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
            ElevatorSvc.registerCall(6);
            ElevatorSvc.registerCall(7);
            ElevatorSvc.registerCall(8);
            expect(ElevatorSvc.getPendingCalls()).toEqual([6, 7, 8]);
            expect(ElevatorSvc.hasFloorBeenCalled(4)).toBeFalsy();
        });
    });

    describe('Tick', function () {

        it('When tick is called, the calls history is updated using carStatus', function () {
            expect(ElevatorSvc.getCallsHistory()).toEqual([]);
            ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
            ElevatorSvc.registerCall(3);

            expect(ElevatorSvc.getCallsHistory()).toEqual([{floor: 3, time: 0, pending: true}]);
            ElevatorSvc.tick({floor: 3, dir: 0, occupied: false});
            expect(ElevatorSvc.getCallsHistory()).toEqual([{floor: 3, time: 1, pending: false}]);

            ElevatorSvc.getNextDestination();
            ElevatorSvc.registerCall(4);
            expect(ElevatorSvc.getCallsHistory()).toEqual([{floor: 3, time: 1, pending: false}, {floor: 4, time: 0, pending: true}]);
            ElevatorSvc.tick({floor: 4, dir: 0, occupied: false});
            expect(ElevatorSvc.getCallsHistory()).toEqual([{floor: 3, time: 1, pending: false}, {floor: 4, time: 1, pending: false}]);

        });
    });

    describe('Ordering the calls', function () {

        describe('When the car direction is 1', function () {

            it('The calls above current floor are placed first in the list in ascending order', function () {
                ElevatorSvc.tick({floor: 5, dir: 1, occupied: false});
                ElevatorSvc.registerCall(3);
                ElevatorSvc.registerCall(6);
                ElevatorSvc.registerCall(7);
                ElevatorSvc.registerCall(9);
                ElevatorSvc.registerCall(8);
                ElevatorSvc.registerCall(1);
                expect(ElevatorSvc.getPendingCalls()[0]).toEqual(6);
                expect(ElevatorSvc.getPendingCalls()[1]).toEqual(7);
                expect(ElevatorSvc.getPendingCalls()[2]).toEqual(8);
                expect(ElevatorSvc.getPendingCalls()[3]).toEqual(9);
            });

            it('The calls below current floor are placed at the end of the list in descending order', function () {
                ElevatorSvc.tick({floor: 5, dir: 1, occupied: false});
                ElevatorSvc.registerCall(3);
                ElevatorSvc.registerCall(6);
                ElevatorSvc.registerCall(7);
                ElevatorSvc.registerCall(9);
                ElevatorSvc.registerCall(8);
                ElevatorSvc.registerCall(1);
                expect(ElevatorSvc.getPendingCalls()[4]).toEqual(3);
                expect(ElevatorSvc.getPendingCalls()[5]).toEqual(1);
            });

            it('If the calls list contains the car\'s current floor, the current floor is becomes the first in the list', function () {
                ElevatorSvc.tick({floor: 5, dir: 1, occupied: false});
                ElevatorSvc.registerCall(3);
                ElevatorSvc.registerCall(6);
                ElevatorSvc.registerCall(7);
                ElevatorSvc.registerCall(9);
                ElevatorSvc.registerCall(5);
                ElevatorSvc.registerCall(8);
                ElevatorSvc.registerCall(1);
                expect(ElevatorSvc.getPendingCalls()).toEqual([5, 6, 7, 8, 9, 3, 1]);
            });
        });

        describe('When the car direction is -1', function () {

            it('The calls below current floor are placed first in the list in descending order', function () {
                ElevatorSvc.tick({floor: 5, dir: -1, occupied: false});
                ElevatorSvc.registerCall(3);
                ElevatorSvc.registerCall(6);
                ElevatorSvc.registerCall(7);
                ElevatorSvc.registerCall(9);
                ElevatorSvc.registerCall(8);
                ElevatorSvc.registerCall(1);
                expect(ElevatorSvc.getPendingCalls()[0]).toEqual(3);
                expect(ElevatorSvc.getPendingCalls()[1]).toEqual(1);

            });

            it('The calls above current floor are placed at the end of the list in ascending order', function () {
                ElevatorSvc.tick({floor: 5, dir: -1, occupied: false});
                ElevatorSvc.registerCall(3);
                ElevatorSvc.registerCall(6);
                ElevatorSvc.registerCall(7);
                ElevatorSvc.registerCall(9);
                ElevatorSvc.registerCall(8);
                ElevatorSvc.registerCall(1);
                expect(ElevatorSvc.getPendingCalls()[2]).toEqual(6);
                expect(ElevatorSvc.getPendingCalls()[3]).toEqual(7);
                expect(ElevatorSvc.getPendingCalls()[4]).toEqual(8);
                expect(ElevatorSvc.getPendingCalls()[5]).toEqual(9);
            });

            it('If the calls list contains the car\'s current floor, the current floor is becomes the first in the list', function () {
                ElevatorSvc.tick({floor: 5, dir: -1, occupied: false});
                ElevatorSvc.registerCall(3);
                ElevatorSvc.registerCall(6);
                ElevatorSvc.registerCall(7);
                ElevatorSvc.registerCall(9);
                ElevatorSvc.registerCall(5);
                ElevatorSvc.registerCall(8);
                ElevatorSvc.registerCall(1);
                expect(ElevatorSvc.getPendingCalls()).toEqual([5, 3, 1, 6, 7, 8, 9]);
            });
        });

        describe('When the car direction is 0, it is the same as when the direction is -1', function () {

            it('The calls below current floor are placed first in the list in descending order', function () {
                ElevatorSvc.tick({floor: 5, dir: 0, occupied: false});
                ElevatorSvc.registerCall(3);
                ElevatorSvc.registerCall(6);
                ElevatorSvc.registerCall(7);
                ElevatorSvc.registerCall(9);
                ElevatorSvc.registerCall(8);
                ElevatorSvc.registerCall(1);
                expect(ElevatorSvc.getPendingCalls()[0]).toEqual(3);
                expect(ElevatorSvc.getPendingCalls()[1]).toEqual(1);

            });

            it('The calls above current floor are placed at the end of the list in ascending order', function () {
                ElevatorSvc.tick({floor: 5, dir: 0, occupied: false});
                ElevatorSvc.registerCall(3);
                ElevatorSvc.registerCall(6);
                ElevatorSvc.registerCall(7);
                ElevatorSvc.registerCall(9);
                ElevatorSvc.registerCall(8);
                ElevatorSvc.registerCall(1);
                expect(ElevatorSvc.getPendingCalls()[2]).toEqual(6);
                expect(ElevatorSvc.getPendingCalls()[3]).toEqual(7);
                expect(ElevatorSvc.getPendingCalls()[4]).toEqual(8);
                expect(ElevatorSvc.getPendingCalls()[5]).toEqual(9);
            });

            it('If the calls list contains the car\'s current floor, the current floor is becomes the first in the list', function () {
                ElevatorSvc.tick({floor: 5, dir: 0, occupied: false});
                ElevatorSvc.registerCall(3);
                ElevatorSvc.registerCall(6);
                ElevatorSvc.registerCall(7);
                ElevatorSvc.registerCall(9);
                ElevatorSvc.registerCall(5);
                ElevatorSvc.registerCall(8);
                ElevatorSvc.registerCall(1);
                expect(ElevatorSvc.getPendingCalls()).toEqual([5, 3, 1, 6, 7, 8, 9]);
            });
        });
    });
});






