angular.module('core').directive('childRouter', function (route, $compile, observeOnScope, rx) {

       return {
        scope: { route : '=route' },
        link: function (scope, element, attrs) {
            var route$ = observeOnScope(scope, 'route').filter(x => x.newValue !== undefined).map(x => x.newValue).merge(route.RouteParts$);
            var currentScope = null;
            var subscription = route$
                .map(x => x.TemplateUrl.toLowerCase())
                .distinctUntilChanged()
                .withLatestFrom(route$).map(x => x[1])
                .map(route.GetTemplateWithRouteObj('Template'))
                .switch()
                .subscribe(function (route) {
                    scope.$broadcast('route:unsubscribe:dataset');
                    if (currentScope) currentScope.$destroy();
                    var html = $('<div ng-controller="DataController" />').html(route.Template);
                    element.html(html);
                    currentScope = scope.$new(true);
                    $compile(html)(currentScope);
                });
            
            var off = scope.$on('route:unsubscribe:child', function () {
                scope.$broadcast('route:unsubscribe:dataset');
                subscription.dispose();
                off();
             });
        }
    }
});