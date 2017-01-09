'use strict';

describe('Service::SimpleElevatorSvc', function () {

    var ElevatorSvc;

    beforeEach(function () {
        angular.mock.module('elevator');
        inject(function (_SimpleElevatorSvc_) {
            ElevatorSvc = _SimpleElevatorSvc_;
        });
    });

    it('Service is defined', function () {
        expect(ElevatorSvc).toBeDefined();
    });

    describe('registerCall', function () {

        it('A call from outside an empty car is registered', function () {
            ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
            ElevatorSvc.registerCall(5);
            expect(ElevatorSvc.getPendingCalls()).toEqual([5]);
        });

        it('A call coming from outside an occupied car is not registered', function () {
            ElevatorSvc.tick({floor: 5, dir: 0, occupied: true});
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
            ElevatorSvc.registerCall(2);
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
        });

        it('A call coming from inside an occupied car is registered', function () {
            ElevatorSvc.tick({floor: 5, dir: 0, occupied: true});
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
            ElevatorSvc.registerCall(2, true);
            expect(ElevatorSvc.getPendingCalls()).toEqual([2]);
        });

        it('A call is not registered if another call is pending', function () {
            ElevatorSvc.tick({floor: 5, dir: 0, occupied: false});
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
            ElevatorSvc.registerCall(2);
            expect(ElevatorSvc.getPendingCalls()).toEqual([2]);

            ElevatorSvc.registerCall(6);
            expect(ElevatorSvc.getPendingCalls()).toEqual([2]);
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
            expect(ElevatorSvc.getCallsHistory()).toEqual([]);
        });
    });

    describe('stopCar', function () {

        it('Stopping the car when there is no pending request empties the pendingCalls', function () {
            ElevatorSvc.stopCar();
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
        });

        it('Stopping the car when there is a pending request empties the pendingCalls', function () {
            ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
            ElevatorSvc.registerCall(5);
            expect(ElevatorSvc.getPendingCalls()).toEqual([5]);
            ElevatorSvc.stopCar();
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
        });
    });

    describe('getDestination', function () {

        it('If there is a pending call, it is returned', function () {
            ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
            expect(ElevatorSvc.getPendingCalls()).toEqual([]);
            ElevatorSvc.registerCall(5);
            expect(ElevatorSvc.getPendingCalls()).toEqual([5]);
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

            it('If there is a pending call, it is erased and the result of getDestination is returned', function () {
                ElevatorSvc.tick({floor: 6, dir: 0, occupied: false});
                ElevatorSvc.registerCall(6);
                expect(ElevatorSvc.getPendingCalls()).toEqual([6]);
                expect(ElevatorSvc.getNextDestination()).toEqual(5);
                ElevatorSvc.tick({floor: 6, dir: 0, occupied: true});
                expect(ElevatorSvc.getNextDestination()).toEqual(-1);
            });

            it('If there is no pending call, the result of getDestination is returned', function () {
                ElevatorSvc.tick({floor: 5, dir: 0, occupied: false});
                expect(ElevatorSvc.getPendingCalls()).toEqual([]);
                expect(ElevatorSvc.getNextDestination()).toEqual(5);
                ElevatorSvc.tick({floor: 5, dir: 0, occupied: true});
                expect(ElevatorSvc.getNextDestination()).toEqual(-1);
            });
        });

        describe('When the car is not a its destination floor', function () {

            it('If there is a pending call, it is returned', function () {
                ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
                ElevatorSvc.registerCall(6);
                expect(ElevatorSvc.getPendingCalls()).toEqual([6]);
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

        it('If the pending call is n, returns true', function () {
            ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
            ElevatorSvc.registerCall(6);
            expect(ElevatorSvc.getPendingCalls()).toEqual([6]);
            expect(ElevatorSvc.hasFloorBeenCalled(6)).toBeTruthy();
        });

        it('If the pending call is not n, returns false', function () {
            ElevatorSvc.tick({floor: 2, dir: 0, occupied: false});
            ElevatorSvc.registerCall(6);
            expect(ElevatorSvc.getPendingCalls()).toEqual([6]);
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
});






