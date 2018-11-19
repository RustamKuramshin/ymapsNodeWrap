var express = require('express');
var router = express.Router();
const puppeteer = require('puppeteer');
const path = require('path');
var async = require('async');

var route = {};
var outputValue = 0;
var browser, page;

(async ()=>{

    browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    page = await browser.newPage();
    const htmlWrapPath = path.join(path.dirname(__dirname), 'html_wrap');
    await page.goto('file:///' + path.join(htmlWrapPath, 'apiWrap.html'));
    await page.evaluate(yandexApiKey => {

        var scriptElement = document.createElement('script');
        if(yandexApiKey === undefined){
            scriptElement.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU";
        }else{
            scriptElement.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=" + yandexApiKey;
        }
        document.body.appendChild(scriptElement);

    }, process.env.YANDEXAPIKEY);

})();

router.get('/', function (req, res, next) {

    if (req.query.apikey !== process.env.ACCESSAPIKEY){
        res.send({});
        return;
    }

    var strQuery = JSON.stringify(req.query);

    async.series([
        function(callback) {
                page.evaluate(
                    //Будет выполнено в контексте страницы+
                    evaluateArg => {

                        window.outputValue = 0;

                        var points = [];
                        var re = /^\d{1,3}\.\d+,\d{1,3}\.\d+$/;

                        var jsonQuery = JSON.parse(evaluateArg);
                        var strQuery = jsonQuery['waypoints'];
                        var arrayQuery = strQuery.split('|');

                        for (i = 0; i < arrayQuery.length; i++ ) {
                            points[i] = {type:'wayPoint', point:''};
                            if(re.test(arrayQuery[i])){
                                points[i].point = arrayQuery[i].split(',');
                            } else {
                                points[i].point = arrayQuery[i];
                            }
                        }

                        ymaps.route(points, {
                            mapStateAutoApply: true,
                            routingMode : 'auto'
                        }).then(function (route) {
                            window.outputValue = route.getLength();
                        });

                    }, strQuery
                    //Будет выполнено в контексте страницы-
                );
                callback(null, '');
            },
            function(callback) {
                outputValue = 0;

                callback(null, '');
            }
        ],

        function(err, results) {
            async.whilst(
                function() { return outputValue === 0;
                },
                function(callback) {

                    setTimeout(function() {

                        page.evaluate(
                            ()=>{return window.outputValue}
                        ).then((returnedValue)=>{outputValue = returnedValue;});

                        callback(null, '');

                    }, 100);
                },
                function (err, stub) {
                    route.length = outputValue;
                    res.send(route);
                }
            );
        });
});

module.exports = router;