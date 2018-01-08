angular.module('core').directive('parentRouter', function (route, $compile) {
    return {
        link: function (scope, element, attrs) {
            var parentRoute$ = route.RouteParts$.map(x => x.ParentUrl.toLowerCase()).distinctUntilChanged();
            var subscription = parentRoute$.withLatestFrom(route.RouteParts$)
                .map(x => x[1])
                .map(route.GetTemplateWithRouteObj('Parent'))
                    .switch()
                    .subscribe(function (route) {
                        scope.$broadcast('route:unsubscribe:child');
                        var html = $('<div />').html(route.Parent);
                        element.html(html);
                        var s = scope.$new(true);
                        s.childRoute = route;
                        $compile(html)(s);
                    }, e => console.error(e));
                
            scope.$on('$destroy', function () {
                subscription.dispose();
            });

            scope.state = 0;
        }
    }
});