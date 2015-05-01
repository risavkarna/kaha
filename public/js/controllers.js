angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $ionicSideMenuDelegate, $timeout, api, $timeout, $rootScope) {
    setTimeout(function() {
        $ionicSideMenuDelegate.toggleLeft();
        $rootScope.isSideMenuOpen = false;
    }, 100);
    $rootScope.isAddActive = true;
    $scope.menuClicked = function() {
        $rootScope.isSideMenuOpen= $ionicSideMenuDelegate.isOpen();
    };
    $rootScope.addIconToggle = function(){
        $rootScope.isAddActive = $rootScope.isAddActive?false:true;
    }
})
.controller('SectionCtrl', function($scope, $rootScope, api, $stateParams, $ionicPopup) {
    $rootScope.selected = {};
    $scope.$on('$ionicView.beforeEnter', function() {
        $scope.name = $stateParams.sectionid;
        $rootScope.toles = [];
        $rootScope.districts = [];

        var refresh = $scope.dataset?false:true;
        /*api.coordinates().then(function(position) {
            $rootScope.coordinates = position.coords;
            $rootScope.doRefresh(refresh);
        },
        function(err) {
            $rootScope.doRefresh(refresh);
        });*/
        api.data(true).then(function(data){
            $scope.dataset = api.filter.type(data.content, $scope.name);
            $rootScope.items = $scope.dataset;
            $rootScope.districts = api.location.districts(data.content, $scope.name);
            $scope.$broadcast('scroll.refreshComplete');
            if ($rootScope.coordinates) {
                if($rootScope.selected.district){
                    $rootScope.updateDistrict();
                }
                if($rootScope.selected.tole){
                    $rootScope.updateTole();
                }
            }
        });
    });
    $rootScope.updateDistrict = function(){
        //$rootScope.toles = api.location.tole($scope.dataset, $scope.name, $rootScope.selected.district);
        $rootScope.items = api.filter.location.district($scope.dataset, $scope.name, $rootScope.selected.district);
    }
    $rootScope.updateTole = function(){
        $rootScope.items = api.filter.location.tole($rootScope.items, $scope.name,  $rootScope.selected.tole);
    }
    $scope.loadItem = function(item){
        $rootScope.selectedItem = item;
        api.selected.set(item);
        window.location = "#/app/item/"+item.uuid;
    }
    $rootScope.doRefresh = function(refresh){
        if (typeof refresh != 'undefined') {
            refresh = true;
        }
        api.data(refresh).then(function(data){
            $scope.dataset = api.filter.type(data.content, $scope.name);
            $rootScope.items = $scope.dataset;
            $rootScope.districts = api.location.districts(data.content, $scope.name);
            $scope.$broadcast('scroll.refreshComplete');
            if ($rootScope.coordinates) {
                // Guess the district based on coordinates above and set it
                //$rootScope.selected.district = 'kathmandu';

                if($rootScope.selected.district){
                    $rootScope.updateDistrict();
                }
                if($rootScope.selected.tole){
                    $rootScope.updateTole();
                }
            }
        });
    }
})

.controller('ItemCtrl', function($scope, $stateParams, $rootScope, api, $ionicHistory, $stateParams) {
    $rootScope.selectedItem = api.selected.get();
    $rootScope.selectedItem.channel = $rootScope.selectedItem.channel ? $rootScope.selectedItem.channel : 'supply';
    if ($rootScope.selectedItem.channel == 'supply') {
        $rootScope.selectedItem.activeText = $rootScope.selectedItem.active ? 'available' : 'not available';
    } else {
        $rootScope.selectedItem.activeText = $rootScope.selectedItem.active ? 'needed' : 'not needed';
    }
    if(!$rootScope.selectedItem){
        api.getItem($stateParams.uuid).then(function(data){
            if(data.success){
                $rootScope.selectedItem = data.content;
                api.stat($rootScope.selectedItem).then(function(data){
                    $scope.stat = data;
                });
            }else{
                alert("no data found");
                window.location = "/";
            }
        })
    }else{
        api.stat($rootScope.selectedItem).then(function(data){
            $scope.stat = data;
        });
    }
    $scope.incrStat = function(statKey) {
        api.incrStat($rootScope.selectedItem.uuid, statKey).then(function(data) {
            if (typeof($scope.stat.$$statKey) == 'undefined') {
                $scope.stat.$$statKey = 0;
            }
            var startAt = $scope.stat.$$statKey ? parseInt($scope.stat.$$statKey) : 0;
            $scope.stat.$$statKey = startAt+1;
        },
        function(error) {
            alert('Error updating stat');
        });
    }
    $scope.editItem = function(){
        window.location = "#/app/submit?edit=1";
    }
    $scope.requestDelete = function(){
        api.requestDelete($rootScope.selectedItem).then(function(data){
            if(data){
                $ionicHistory.goBack();
            }else{
                alert("Couldn't delete");
            }
        });
    }
})
.controller('AboutCtrl', function($scope, $stateParams, $rootScope, api) {
    $scope.submitdata = {};
    $scope.signin = function(){
        api.verifyAdmin($scope.submitdata.admincode).then(function(data){
            if(data){
                $rootScope.isloggedin = true;
            }else{
                $rootScope.isloggedin = false;
            }
        });
    }
    $scope.signout = function(){
        $scope.isloggedin = false;
    }

})
.controller('SubmitCtrl', function($scope, api, $stateParams, $rootScope, $ionicHistory, $window) {
    $scope.formTitle = 'New Supply/Resource';
    $scope.submitdata = {
        channel:'supply',
        datasource:'kaha'
    };
    if ($stateParams) {
        if ($stateParams.edit) {
            //$scope.selectedItem = api.selected.get();
            if ($scope.selectedItem) {
                $scope.submitdata = {
                    channel: $scope.selectedItem.channel ? $scope.selectedItem.channel : $scope.submitdata.channel,
                    datasource: $scope.selectedItem.datasource ? $scope.selectedItem.datasource: $scope.submitdata.datasource,
                    uuid: $scope.selectedItem.uuid,
                    supplytype: $scope.selectedItem.type,
                    district: $scope.selectedItem.location.district,
                    tole: $scope.selectedItem.location.tole,
                    title: $scope.selectedItem.description.title,
                    contactname :$scope.selectedItem.description.contactname,
                    contactnumber :$scope.selectedItem.description.contactnumber,
                    description :$scope.selectedItem.description.detail
                };
                console.log('Edit ');
                console.log($scope.selectedItem)
            };
        } else {
            $scope.submitdata.supplytype = $stateParams.type;
        }

        if ($stateParams.channel) {
            $scope.submitdata.channel = $stateParams.channel;
            if ($stateParams.channel == 'need') {
                $scope.formTitle = 'Request Supply/Resource';
            }
        }

        if ($stateParams.datasource) {
            $scope.submitdata.datasource = $stateParams.datasource;
        }
    }
    $scope.districts = api.districts.sort();
    $scope.supplytypes = api.supplytypes.sort();
    $scope.submit = function(){
        var data = {
            datasource: $scope.submitdata.datasource,
            channel: $scope.submitdata.channel,
            type: $scope.submitdata.supplytype,
            location: {
                district: $scope.submitdata.district,
                tole: $scope.submitdata.tole,
            },
            description:{
                title: $scope.submitdata.title,
                detail: $scope.submitdata.description,
                contactname: $scope.submitdata.contactname,
                contactnumber: $scope.submitdata.contactnumber
            },
            active: true
            //description: "Contact Name: "+$scope.submitdata.contactname+" Contact Number: "+$scope.submitdata.contactnumber+" Description: "+$scope.submitdata.description
        };
        if ($scope.submitdata.uuid) {
            data.uuid = $scope.submitdata.uuid;
        }
        if ($rootScope.coordinates) {
            data.coordinates = {
                longitude : $rootScope.coordinates.longitude,
                latitude : $rootScope.coordinates.latitude
            }
        }
        var error = false;
        if(!data.type){
            error = true;
        }
        else if(!data.location.district){
            error = true;
        }
        else if(!data.location.tole){
            error =true;
        }
        else if(!data.description.title){
            error = true;
        }
        else if(!data.description.detail){
            error = true;
        }
        else if(!data.description.contactname){
            error = true;
        }
        else if(!data.description.contactnumber){
            error = true;
        }
        if(!error){
            console.log('Saving Data');
            console.log(data);
            if (data.uuid) {
                api.update(data).then(
                    function(status){
                        alert("Successfully Updated");
                        $ionicHistory.goBack();
                    },
                    function(status) {
                        console.log('Failed to save');
                        console.log(status);
                        alert("We are currently not able to process your request. Please try again later");
                    }
                );
            } else {
                api.submit(data).then(
                    function(status){
                    if(status){
                        alert("Successfully Created");
                        $window.location.reload();
                    }
                    },
                    function(status) {
                        console.log('Failed to save');
                        console.log(status);
                        alert("We are currently not able to process your request. Please try again later");
                    }
                );
            }
        }
        else{
            alert("All fields are required");
        }
    };
}
);
