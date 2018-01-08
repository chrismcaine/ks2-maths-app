/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    splashRoute: '#/splash',
//    homeRoute: '#/dashboard',
    homeRoute: '#/play',
    DbFactory: DbFactory,
    Questions : null,
    db: new DbFactory({
        name: 'MathsAppData',
        version: 1,
    }),
    QuestionList : [],
    // Application Constructor
    initialize: function () {
        window.location.hash = this.splashRoute;
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);

        var routeProvider = new RouteProvider();

        routeProvider.AddRoute('/splash');
        routeProvider.AddRoute('/settings');
        routeProvider.AddRoute('/dashboard');
        routeProvider.AddRoute('/play');

        var routeService = new routeProvider.RouteService();

        routeService.RouteParts$.subscribe(function (route) {
            console.log(route);
            var el = document.querySelector('body');
            el.setAttribute('class', route.TemplateUrl.replace(/(^\/)|(\/$)/g, '').replace(/\//, '-'));
        });

        var Game = function () { }; 
        Game.Model = {};
        var Question = function() { };
        Question.Model = {
            //Orientation: true,
            //Type: true,
            //Value1: true,
            //Value2: true,
            //Attempts: null,
            //DateCreated : null
        };
//        this.database.Games = new DbSet('games', 'Id', Game, this.database);
        this.Questions = new DbSet('questions', 'Id', Question, this.db);
        this.db.Init().subscribe(this.runProgramme.bind(this));
        
        // testing on browser
        var _this = this;
      //  setTimeout(function () {
        //    _this.onDeviceReady();
        //}, 1000);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function () {
        this.receivedEvent('deviceready');
        window.location.hash = this.homeRoute;
        console.log('device ready');
    },

    // Update DOM on a Received Event
    receivedEvent: function (id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },
    runProgramme: function () {
      this.play = new Play(this);
      this.review = new Review(this);
    }
};

app.initialize();