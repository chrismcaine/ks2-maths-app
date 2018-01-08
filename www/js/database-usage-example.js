

        var dbSettings = {
            name: 'Shop',
            version: 4,
        }

        var Customer = function () {
            return this;
        }

        Customer.Model = {
            Id: true,
            Name: true,
            Email: false
        };

        var Product = function () { return this; }
        Product.Model = { Id: true, Name: true, Description: true };

        var _dbFactory = new DbFactory(dbSettings);

        var _dbCustomer = new DbSet('customer', 'Id', Customer, _dbFactory);
        var _dbProduct = new DbSet('products', 'Id', Product, _dbFactory);

        _dbFactory.Init().subscribe(runProgramme);


        function runProgramme() {
            var customers$ = Rx.Observable.fromArray([
                {
                    Id: 1,
                    Name: 'John D. Smith',
                    Email: 'j.smith@test.com'
                },
                {
                    Id: 2,
                    Name: 'Albert Einstein'
                }, {
                    Id: 3,
                    Name: 'John Humphries'
                }, {
                    Id: 4,
                    Name: 'Malcomn Gladwell'
                }
            ]);

            //     customers$.withLatestFrom(_dbCustomer).subscribe(arr => arr[1].Save(arr[0]).subscribe(x => console.info(x)));
            //_dbCustomer.subscribe(x =>  x.Save({
            //    Id: 1,
            //    Name: 'John P. Smith',
            //    Email: 'j.smith@test.com'
            //}).subscribe(function (obj) { console.log('saved', obj); }));
            var products$ = Rx.Observable.fromArray([
                {
                    Id: 1,
                    Name: 'iPod Nano',
                    Description: 'mp3 Player'
                },
                {
                    Id: 2,
                    Name: 'Samsung Galaxy S7 Edge',
                    Description: 'Android smart phone'
                }
            ]);

            products$.withLatestFrom(_dbProduct).map(DbFactory.Save).switch().subscribe(x => console.info(x));

            var button = document.querySelector('button.load');
            var click$ = Rx.Observable.fromEvent(button, 'click');


            click$.map(1).withLatestFrom(_dbProduct).map(DbFactory.Get).switch().subscribe(x => console.log(x));

            var btnDelete = document.querySelector('button.delete');
            var deleteClick$ = Rx.Observable.fromEvent(btnDelete, 'click');

            deleteClick$.map(1).withLatestFrom(_dbProduct).map(DbFactory.Delete).switch().subscribe(x => console.log(x));


            Rx.Observable.just({ Keys: ['Name', 'Email'], Value: 'john', Match: 'one' }).withLatestFrom(_dbCustomer).map(DbFactory.Query).switch().subscribe(x => console.log(x));
