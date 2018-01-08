/**
          * Split out from angular. Convert to cordova using bootstrap, RxJS and routing from company app.
          * 1). Store values in storage => look at better long term storage.
          * 2). Add timed questions
          * 3). Add random multiplier
          * 4). Add Addition, Subtraction, Division
          *   a).
          *   b).
          *   c). Construct division like times but take answer to values.
          * 5). Event Binding - wrap up in bindEvent method
          * 6). Rebuild front end
          * 7). Test Database
          */
function drawKeyPad() {
    var keypad = document.querySelector('.keypad');
    var template = document.getElementById('template-keypad-button').innerHTML;
    var q = new Queryable([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]).select(x => {
        return { value: x }
    }).reverse().forEach(function (item, index) {
        var t = Helpers.Bind(template, item);
        keypad.innerHTML = t + keypad.innerHTML;
    });
}

function registerButtons() {

    var buttons = document.querySelectorAll('button');
    var streams = [];
    buttons.forEach(function (item, index) {
        streams.push(Rx.Observable.fromEvent(item, 'click').do(e => e.preventDefault()));
    });
    return Rx.Observable.merge(streams).map(e => { return { event: e.target.getAttribute('data-event-name'), value: e.target.getAttribute('data-value') } }).share();
}


var Play = function (app) {
    
    drawKeyPad();
    var clicks$ = registerButtons();

    var _app = app;
    var bindTo = function (property, addClass) {
        var _p = document.querySelector('.' + property);
        return function (val) {
            if (addClass === true) {
                _p.setAttribute('class', property + ' ' + val); 
            } else {
                if (_p) _p.innerText = val;
            }
            return val;
        };
    }

    var next$ = new Rx.Subject();

    var const$ = Rx.Observable.fromArray([10, 10, 2, 5, 8, 6, 7, 1, 11, 3, 8, 12].reverse())//.just(parseInt($state.params.value));
    var type$ = Rx.Observable.just('-');
    var variables$ = Rx.Observable.fromArray([4, 10, 2, 5, 8, 6, 7, 1, 11, 3, 8, 12]);

    var questions$ = Rx.Observable.zip(next$, variables$, const$)
        .withLatestFrom(type$)
        .map(arr => [arr[0][1], arr[0][2], arr[1]])
        .map(arr => { return { num1: arr[0], num2: arr[1], type: ['+', '-', 'x', '/'][Math.floor(Math.random() * 4)] /*arr[2]*/, orientation: Math.floor(Math.random() * 3) } })
        .map(function (obj) {
            var q = {
                Id : Helpers.Guid.NewGuid(),
                Orientation: obj.orientation,
                Type: obj.type,
                Value1: obj.num1,
                Value2: obj.num2,
                Attempts: 0,
                DateCreated : null
            };

            switch (obj.orientation) {
                case 0:
                    q.Format = '{Value1} {Type} {Value2} = {Answer}';
                    break;
                case 1:
                    q.Format = '{Answer} {Type} {Value1} = {Value2}';
                    break;
                case 2:
                    q.Format = '{Value1} {Type} {Answer} = {Value2}';
                    break;
                default:
                    break;
            }

            switch (obj.type) {
                case '+':
                    if (obj.orientation === 1 || obj.orientation === 2) {
                        q.Value2 = obj.num1 + obj.num2;
                    }
                    break;
                case '-':
                    if (obj.orientation === 0 || obj.orientation === 2) {
                        q.Value1 = obj.num1 + obj.num2;
                    }
                    break;
                case 'x':
                    if (obj.orientation === 1 || obj.orientation === 2) {
                        q.Value2 = obj.num1 * obj.num2;
                    }
                    break;
                case '/':
                    if (obj.orientation === 0 || obj.orientation === 2) {
                        q.Value1 = obj.num1 * obj.num2;
                    }
                    break;
            }

            return q;
        })
        .share();

    questions$.do(bindTo('sum')).subscribe(x => { });

    var clearClick$ = clicks$.filter(x => x.event === 'clearClick');
    var check$ = clicks$.filter(x => x.event === 'checkClick').share();
    var input$ = clicks$.filter(x => x.event === 'inputClick').map(x => x.value).startWith(null);

    input$.subscribe(x => { });

    var forceClear$ = new Rx.Subject();

    var answer$ = Rx.Observable.merge(input$, clearClick$.map(null), next$.map(null), forceClear$.map(null)).scan(function (acc, val) {
        if (val === null) { acc = '__'; } else {
            if (acc.indexOf('_') > -1) { acc = val.toString(); }
            else { acc = acc + val; }
        };
        return acc;
    }, '').share();
    var sumString$ = Rx.Observable.merge(questions$, answer$).withLatestFrom(questions$, answer$).map(arr => { arr[1].Answer = arr[2]; arr[1].Sum = Helpers.Bind(arr[1].Format, arr[1]); return arr[1]; });
    sumString$.map(x => x.Sum).do(bindTo('sum')).subscribe(x => { });

    var result$ = check$.withLatestFrom(sumString$)
        .map(arr => arr[1]);

    var isCorrect$ = result$.map(function (val) {
        val.Attempts++;
        val.Result = eval(val.Sum.replace('x', '*').replace('=', '==='));
        return val;
    });

    var results$ = isCorrect$.filter(x => x.Result === true)
        .withLatestFrom(result$)
        .map(arr => { arr[1].DateCreated = new Date(); return arr[1]; })
        .withLatestFrom(app.Questions).map(app.DbFactory.Add).switch().subscribe(x => { app.review.AddItem(x);  });

    var new$ = isCorrect$.filter(x => x.Result === true).delay(1600);

    new$.map(null).do(bindTo('correct', true)).subscribe(() => next$.onNext());

    isCorrect$.map(x => x.Result).do(bindTo('correct', true)).subscribe(x => { });

    var clear$ = clearClick$.merge(isCorrect$.filter(x => x.Result === false).delay(1000)).map(null).share();

    clear$.do(bindTo('correct', true)).subscribe(x => { forceClear$.onNext(); });

    answer$.subscribe(str => { });

  //  results$.do(bindTo('list')).subscribe(x => { });

    next$.onNext(null);
}