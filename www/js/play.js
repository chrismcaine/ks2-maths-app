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

var addItemToResultsList = function (item) {
    var el = document.querySelector('.answers');
    var template = document.getElementById('template-answer-list').innerHTML;
    var obj = {};
    obj.Sum = item.Sum;
    obj.DateCreated = Helpers.FormatDate(item.DateCreated, 'h:mmp | <em>dS MMM yyyy</em>', true);
    el.innerHTML = Helpers.Bind(template, obj) + el.innerHTML;
}

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

function Question(obj) {

    this.Id = Helpers.Guid.NewGuid();
    this.Orientation = obj.orientation;
    this.Type = obj.type;
    this.Value1 = obj.num1;
    this.Value2 = obj.num2;
    this.Attempts = 0;
    this.DateCreated = null;
    this.Count = obj.count;

    switch (obj.orientation) {
        case 0:
            this.Format = '{Value1} {Type} {Value2} = {Answer}';
            break;
        case 1:
            this.Format = '{Answer} {Type} {Value1} = {Value2}';
            break;
        case 2:
            this.Format = '{Value1} {Type} {Answer} = {Value2}';
            break;
        default:
            break;
    }

    switch (obj.type) {
        case '+':
            if (obj.orientation === 1 || obj.orientation === 2) {
                this.Value2 = obj.num1 + obj.num2;
            }
            break;
        case '-':
            if (obj.orientation === 0 || obj.orientation === 2) {
                this.Value1 = obj.num1 + obj.num2;
            }
            break;
        case 'x':
            if (obj.orientation === 1 || obj.orientation === 2) {
                this.Value2 = obj.num1 * obj.num2;
            }
            break;
        case '/':
            if (obj.orientation === 0 || obj.orientation === 2) {
                this.Value1 = obj.num1 * obj.num2;
            }
            break;
    }

    return this;
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function createNofType(type, n) {
    var arr = [];
    for (var i = 0; i < n; i += 1) {
        arr.push(type !== null ? type : ['+', '-', 'x', '/'][Math.floor(Math.random() * 4)]);
    }
    return arr;
}
function createNofOrientation(o, n) {
    var arr = [];
    for (var i = 0; i < n; i += 1) {
        arr.push(o !== null ? o : Math.floor(Math.random() * 3));
    }
    return arr;
}
function createValuesTo(n, count) {
    var valueSet = [];
    var min = n[0];
    var max = n[1];
    var range = max - min;
    
    for (var i = min; i <= max; i += 1) {
        valueSet.push(i);
    }

    shuffle(valueSet);
    var length = valueSet.length;
    var arr = [];
    for (var i = 0; i < count; i += 1) {
        arr.push(valueSet[i%length]);
    }
    
    return arr;
}

function getCountDown(max) {
    var arr = [];
    while (max > 0) {
        arr.push(max);
        max--;
    }
    console.log(arr);
    return arr;
}

var Game = function (settings, Next$) {
    var const$ = Rx.Observable.fromArray(shuffle(createValuesTo(settings.value1, settings.count)));
    var type$ = Rx.Observable.fromArray(createNofType(settings.type, settings.count));  //
    var variables$ = Rx.Observable.fromArray(shuffle(createValuesTo(settings.value1, settings.count)));
    var orientation$ = Rx.Observable.fromArray(createNofOrientation(0, settings.count));// Math.floor(Math.random() * 3)
    var count$ = Rx.Observable.fromArray(getCountDown(settings.count));//.scan(function (agg, val) { }, settings.count);

//    count$.subscribe(x => console.log(x));

    this.Questions$ = Rx.Observable.zip(Next$, variables$, const$, type$, orientation$, count$)
        .map(arr => { return { num1: arr[1], num2: arr[2], type: arr[3], orientation: arr[4], count: arr[5] } })
        .map(x => new Question(x))
        .do(x => console.log(x))
        .share();

    this.Ends$ = this.Questions$.map(q => q.Count).filter(x => x === 1); 

    return this;
}

var Play = function (app) {
    var _app = app;

    drawKeyPad();

    var clicks$ = registerButtons();

    var next$ = new Rx.Subject();

    var questions$ = new Rx.Subject();

    this.RunGame = function (settings) {
        var game = new Game(settings, next$);
        game.Questions$.subscribe(q => questions$.onNext(q));
        next$.onNext();
    }

    this.RunGame({ value1: [1, 12], value2: [2, 2], count: 12, type: 'x', });

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

    // load previous results from db
    Rx.Observable.just(null).withLatestFrom(app.Questions).map(app.DbFactory.Query).switch().subscribe(x => {
        x.orderBy('DateCreated', true).reverse()
            .forEach(addItemToResultsList);
    });

    var results$ = isCorrect$.filter(x => x.Result === true)
        .withLatestFrom(result$)
        .map(arr => { arr[1].DateCreated = new Date(); return arr[1]; })
        .withLatestFrom(app.Questions).map(app.DbFactory.Add).switch().subscribe(addItemToResultsList);

    var new$ = isCorrect$.filter(x => x.Result === true).delay(800);

    new$.map(null).do(bindTo('correct', true)).subscribe(() => next$.onNext());

    isCorrect$.map(x => x.Result).do(bindTo('correct', true)).subscribe(x => { });

    var clear$ = clearClick$.merge(isCorrect$.filter(x => x.Result === false).delay(500)).map(null).share();

    clear$.do(bindTo('correct', true)).subscribe(x => { forceClear$.onNext(); });

    answer$.subscribe(str => { });

    //  results$.do(bindTo('list')).subscribe(x => { });

    next$.onNext(null);
}