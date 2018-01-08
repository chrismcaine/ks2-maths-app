angular.module('core').directive('routeLoading', function (route, api, $timeout, rx) {
    return {
        template: '<div loader state="state" ng-class="cssClass"></div>',
        replace: false,
        link: function (scope, element, attrs) {
            scope.state = 0;
            var status$ = rx.Observable.merge(api.Status$, route.Status$);
            status$.subscribe(function (status) {
                $timeout(function () {
                    scope.state = status;
                    scope.cssClass = 'loader ' + (status === 0 ? 'hide-loader' : 'show-loader');
                }, 0);
            });
        }
    }
});