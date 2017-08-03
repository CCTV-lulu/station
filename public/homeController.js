app.controller('myCtrl', function ($scope, $http, checkBox,$mdDialog) {
    if(localStorage.getItem('startStation')&&localStorage.getItem('stopStation')){
        $scope.startStation = JSON.parse(localStorage.getItem('startStation'))
        $scope.stopStation = JSON.parse(localStorage.getItem('stopStation'))
    }else {
        $scope.startStation = false
        $scope.stopStation = true
    }
    var getUrl;
    $http.get("./config/default.json").success(function (result) {
        getUrl = result.station.port;
        $scope.save_config = function () {
            if ($scope.socket.server && $scope.socket.virtual_hose && $scope.socket.server_port
                && $scope.socket.serial_port && $scope.socket.baudRate
                && $scope.socket.log_server_port && $scope.station.id && $scope.station.sta_id) {
                var config = {
                    socket: {
                        server: $scope.socket.server,
                        virtual_hose: $scope.socket.virtual_hose,
                        server_port: $scope.socket.server_port,
                        serial_port: $scope.socket.serial_port,
                        baudRate: Number($scope.socket.baudRate),
                        log_server_port: $scope.socket.log_server_port
                    },
                    station: {
                        id: $scope.station.id,
                        sta_id: Number($scope.station.sta_id)
                    }
                };
                var req = {
                    url: "http://localhost:" + getUrl + "/changeConfig",
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    withCredentials: true,
                    data: config
                }
                $http(req).success(function (data) {
                    checkBox.box('保存成功')
                }).error(function (error) {

                })
            } else {
                prompt('有数据为空，请补全数据提交')
            }
        }

        function get_config(getUrl) {
            var url = "http://localhost:" + getUrl + "/getConfig";
            $http.get(url, {withCredentials: true}).success(function (data) {
                $scope.socket = data.socket;
                $scope.station = data.station;
                if(data.station.status == "start"){
                    localStorage.setItem('startStation',true)
                    localStorage.setItem('stopStation',false)
                    $scope.startStation = true;
                    $scope.stopStation = false;
                }
            }).error(function (error) {
            })
        }

        get_config(getUrl);
        $scope.start_station = function () {
            localStorage.setItem('startStation',true)
            localStorage.setItem('stopStation',false)
            $scope.startStation = true;
            $scope.stopStation = false;
            var req = {
                url: "http://localhost:" + getUrl + "/startUpStation?status=" + true,
                method: "POST",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                withCredentials: true
            };
            $http(req).success(function (data) {
                checkBox.box('已启动')
                if(data == 'false'){
                    checkBox.box('链接失败，请终止发送，重新启动！')
                }

            }).error(function (error) {
            })
        };
        $scope.stop_station = function () {
            localStorage.setItem('startStation',false)
            localStorage.setItem('stopStation',true)
            $scope.startStation = false
            $scope.stopStation = true
            var req = {
                url: "http://localhost:" + getUrl + "/stopUp?status=" + false,
                method: "POST",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                withCredentials: true
            };
            $http(req).success(function (data) {
                checkBox.box('已停止')
            }).error(function (error) {

            })
        }

    });

    function prompt(data) {
        $mdDialog.show(
            $mdDialog.alert()
                .clickOutsideToClose(true)
                .title('提示')
                .textContent(data)
                .ariaLabel('Offscreen Demo')
                .ok('确认')
                .openFrom({
                    top: -50,
                    width: 30,
                    height: 80
                })
                .closeTo({
                    left: 1500
                })
        );
    }
})