var RouteProvider = function () {
    var _routes = {};
    this.AddRoute = function (route) {
        var m = route.split('/');
        var routeRegexArr = ['^'];
        var paramsArr = [];
        for (var i = 1; i < m.length; i += 1) {
            switch (m[i].charAt(0)) {
                case ':':
                    routeRegexArr.push('\\/');
                    routeRegexArr.push('(?:([^\/]+))');
                    paramsArr.push(m[i].replace(':', ''));
                    break;
                case '*':
                    routeRegexArr.push('\\/');
                    routeRegexArr.push('(?:(?:[^\/]+))');
                    break;
                case '?':
                    routeRegexArr.push('\\/?([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})?');
                    paramsArr.push(m[i].replace('?', ''));
                    break;
                default:
                    routeRegexArr.push('\\/');
                    routeRegexArr.push('(?:');
                    routeRegexArr.push(m[i]);
                    routeRegexArr.push(')');
            }
        }
        routeRegexArr.push('(?:\\/)?');
        _routes[route] = {
            regex: new RegExp(routeRegexArr.join(''), 'i'),
            params: paramsArr
        }
    }



    var ERROR_HTML = '<h2 class="http-error">Error <br><span style="font-size:1.6em">{0}</span></h1><h2>{1}</h2>';

    function findRoute(route) {

        for (var key in _routes) {
            var m = _routes[key].regex.exec(route);
            if (m) {
                var params = _routes[key].params;
                var paramObj = {};
                for (var i = 0; i < params.length; i += 1) {
                    paramObj[params[i]] = m[i + 1];
                }
                var template = m[0];
                for (var key in paramObj) {
                    if (paramObj[key]) { template = template.replace('/' + paramObj[key], ''); }
                }
                paramObj['TemplateUrl'] = template;
                return paramObj;
            }
        }
    }


    function getRouteParts(routeUrl) {
        var parts = routeUrl.split('?');
        var route = parts[0];
        var query = parts[1];

        var routeObj = findRoute(route)

        routeObj.Query = Helpers.QueryStringToObject(query);
        routeObj.Route = routeUrl;
        if (routeObj['CompanyRoute']) {
            return CompanyService.Get(routeObj['CompanyRoute']).map(x => { routeObj['CompanyId'] = x.Id; routeObj['Company'] = x; return routeObj; });
        }
        return Rx.Observable.just(routeObj);
    }
    
    var hash$ = Rx.Observable.fromEvent(window, 'hashchange').map(x => window.location.hash);
    var route$ = hash$.map(e => e.split('#/')[1]).map(route => route === '' || route === undefined ? '/default/' : '/' + route);

    var routeParts$ = route$.map(getRouteParts)
        .switch()
        .filter(x => x !== null)
        .share();

    var _query$ = routeParts$.map(x => x.Query).distinctUntilChanged().share();

    var RouteCache = {};

    var _status$ = new Rx.Subject();

    this.RouteService = function () {
        this.Status$ = _status$;
        this.RouteParts$ = routeParts$;
        this.Query$ = _query$;
        this.Query = {};
     
    };

    return this;
}