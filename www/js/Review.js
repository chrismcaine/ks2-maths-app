var Review = function (app) {
    app.QuestionList;

    var el = document.querySelector('.answers');
    var template = document.getElementById('template-answer-list').innerHTML;

    this.AddItem = function (item) {
        var obj = {};
        obj.Sum = item.Sum;
        obj.DateCreated = Helpers.FormatDate(item.DateCreated, 'h:mmp | <em>dS MMM yyyy</em>', true);
        el.innerHTML = Helpers.Bind(template, obj) + el.innerHTML ;

    }
    var _this = this;

    Rx.Observable.just(null).withLatestFrom(app.Questions).map(app.DbFactory.Query).switch().subscribe(x => {
        x.orderBy('DateCreated', true).reverse()
            .forEach(_this.AddItem);
    });

    return this;

}