angular.module("elevator", []).
  controller("ElevatorCtrl", ["$scope", "$interval", function ($scope, $interval) {
    // Object representing the car
    var car = $scope.car = {
      active: function (n) {
        return this.floor == n;
      },
      icon: function (n) {
        var r = this.occupied ? "Occpd " : "Empty ";
        switch (this.dir) {
          case -1: r += "↑↑↑↑"; break;
          case  1: r += "↓↓↓↓"; break;
          case  0: r += this.open ? "OPEN" : "STOP";
        }
        return r;
      },
      canOpen: function (n) {
        // TODO
        return false;
      },
      stepIn: function () { this.occupied = true },
      stepOut: function () { this.occupied = false },
      dir: 0,
      floor: 3,
      open: false,
      occupied: false
    }

    // Object representing the control panel in the car
    $scope.panel = {
      btnClass: function (n) {
        return null;
      },
      press: function (n) {
        alert("Pressed "+n);
      }
    }

    // Floors
    var floors = $scope.floors = [];
    for (var i=10; i>0; i--) floors.push({title:i});
    floors.push({title:"G"});

    // Let's have them know their indices. Zero-indexed, from top to bottom.
    // Also let's initialize them.
    floors.forEach(function (floor,n) {
      floor.n = n;
      floor.open = false;
      floor.light = null;
    });

    $interval(function () {
      // TODO: Move the car if necessary
    }, 1000);
  }]);
