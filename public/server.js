app.factory('checkBox', function($mdToast) {
    var box = function(data) {
        var pinTo = getToastPosition();
        $mdToast.show(
            $mdToast.simple()
                .textContent(data)
                .position(pinTo )
                .hideDelay(3000)
        );
    }

    var last = {
        bottom: true,
        top: false,
        left: true,
        right: false
    };

    var toastPosition = angular.extend({},last);

    var getToastPosition = function() {
        sanitizePosition();
        return Object.keys(toastPosition)
            .filter(function(pos) { return toastPosition[pos]; })
            .join(' ');
    };

    function sanitizePosition() {
        var current = toastPosition;
        if (current.bottom && last.top) current.top = false;
        if (current.top && last.bottom) current.bottom = false;
        if (current.right && last.left) current.left = false;
        if (current.left && last.right) current.right = false;
        last = angular.extend({}, current)
    }
    return {box: box}
})