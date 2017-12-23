"use strict";

angular
  .module("myApp.view1", ["ngRoute"])
  .config([
    "$routeProvider",
    function($routeProvider) {
      $routeProvider.when("/view1", {
        templateUrl: "view1/view1.html",
        controller: "View1Ctrl"
      });
    }
  ])
  .controller("View1Ctrl", [
    "$scope",
    "CryptoFactory",
    function($scope, CryptoFactory) {
      $scope.cryptoData = {};
      $scope.currentDateRangeMin = new Date(
        new Date().setMinutes(new Date().getMinutes() - 10)
      );
      $scope.currentDateRangeMax = new Date(
        new Date().setMinutes(new Date().getMinutes() + 60)
      );
      $scope.periods = [1, 2, 3, 4, 5];
      $scope.period = 1;
      $scope.timePeriod = 1000 * 60 * $scope.period;
      $scope.type = "BTC-USD";
      $scope.types = ["BTC-USD", "ETH-USD"];
      $scope.layout = {};

      /** 
      * Method: formatDate
      *
      * Parses date object into date format that fits for Plotly
      *
      * Parameters:
      * (Date) date - date object.
      *
      * Returns:
      * (String) formatedDate - date in string format year-month-day hours:minutes.
      */
      $scope.formatDate = function(date) {
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var formatedDate =
          "" + year + "-" + month + "-" + day + " " + hours + ":" + minutes;
        return formatedDate;
      };

      /** 
      * Method: configureLayout
      *
      * Initializes layout objects for both graphs and configures them
      *
      */
      $scope.configureLayout = function() {
        $scope.layout = {
          BTC: {
            dragmode: "zoom",
            margin: {
              r: 10,
              t: 25,
              b: 40,
              l: 60
            },
            showlegend: false,
            xaxis: {
              autorange: true,
              domain: [0, 1],
              rangeslider: {
                range: [
                  $scope.formatDate($scope.currentDateRangeMin),
                  $scope.formatDate($scope.currentDateRangeMax)
                ]
              },
              title: "Date",
              type: "date"
            },
            yaxis: {
              autorange: true,
              domain: [0, 1],
              type: "linear"
            }
          },
          ETH: {
            dragmode: "zoom",
            margin: {
              r: 10,
              t: 25,
              b: 40,
              l: 60
            },
            showlegend: false,
            xaxis: {
              autorange: true,
              domain: [0, 1],
              rangeslider: {
                range: [
                  $scope.formatDate($scope.currentDateRangeMin),
                  $scope.formatDate($scope.currentDateRangeMax)
                ]
              },
              title: "Date",
              type: "date"
            },
            yaxis: {
              autorange: true,
              domain: [0, 1],
              type: "linear"
            }
          }
        };
      };

      /** 
      * Method: startProcessingData
      *
      * Subscribes to cryptoFactory and listens for data
      *
      */
      $scope.startProcessingData = function() {
        var subscription = ["5~CCCAGG~BTC~USD", "5~CCCAGG~ETH~USD"];
        CryptoFactory.emit("SubAdd", { subs: subscription });

        CryptoFactory.on("m", function(message) {
          var messageType = message.substring(0, message.indexOf("~"));
          var res = {};
          if (messageType == CCC.STATIC.TYPE.CURRENTAGG) {
            res = CCC.CURRENT.unpack(message);
            $scope.dataUnpack(res, new Date());
          }
        });
      };

      /** 
      * Method: dataUnpack
      *
      * Unpacks socket data and parses it and takes action depending on data. Draws plot first time
      * adds new trace or updates the existing trace.
      * 
      * Parameters:
      * (Object) data - data,
      * (Date) now - current date
      *
      *
      */
      $scope.dataUnpack = function(data, now) {
        if ( data.FLAGS == 4 ) {
          return;
        }
        var currencyType = data["FROMSYMBOL"];
        var time = now.getTime();

        if ( !$scope.cryptoData.hasOwnProperty(currencyType) ) {
          $scope.cryptoData[currencyType] = {};
        }

        if ( !$scope.cryptoData[currencyType].timeOpen ) {

          $scope.createNewTraceData(data, currencyType, now);
          $scope.drawGraphData(currencyType);

        } else {

          if ( time >= $scope.cryptoData[currencyType].timeClose ) {

            $scope.createNewTraceData(data, currencyType, now);
            $scope.addTraceToGraph(currencyType);

          } else {

            $scope.updateTraceData(data, currencyType)
            $scope.updateGraphData(currencyType);

          }
        }
      };

      /** 
      * Method: createNewTraceData
      *
      * Creates new data trace
      *
      * Parameters:
      * (Object) data - data,
      * (String) currencyType - type of currenct
      * (Date) currentDate - current date
      *
      */
      $scope.createNewTraceData = function(data, currencyType, currentDate) {
        $scope.cryptoData[currencyType].timeOpen = currentDate.getTime();
        $scope.cryptoData[currencyType].timeClose =
          currentDate.getTime() + $scope.timePeriod;
        $scope.prepareTraceData(
          currencyType,
          data.PRICE,
          data.PRICE,
          data.PRICE,
          data.PRICE,
          $scope.formatDate(currentDate)
        );
      };

      /** 
      * Method: prepareTraceData
      *
      * Prepares data for plotly
      *
      * Parameters:
      * (String) currencyType - type of currenct
      * (Number) open - open value
      * (Number) close - close value
      * (Number) high - high value
      * (Number) low - low value
      * (Date) x - time value
      *
      */
      $scope.prepareTraceData = function(currencyType, open, close, high, low, x) {
        $scope.cryptoData[currencyType].open = open;
        $scope.cryptoData[currencyType].close = close;
        $scope.cryptoData[currencyType].high = high;
        $scope.cryptoData[currencyType].low = low;
        $scope.cryptoData[currencyType].x = x;
      };

      /** 
      * Method: updateTraceData
      *
      * Checks for max and min values and updates trace data.
      *
      * Parameters:
      * (Object) data - data
      * (String) currencyType - type of currency
      *
      */
      $scope.updateTraceData = function(data, currencyType) {

        $scope.cryptoData[currencyType].close = data.PRICE;

        if ( data.PRICE > $scope.cryptoData[currencyType].high ) {
          $scope.cryptoData[currencyType].high = data.PRICE;
        }

        if ( data.PRICE < $scope.cryptoData[currencyType].low ) {
          $scope.cryptoData[currencyType].low = data.PRICE;
        };

      };
      
      /** 
      * Method: drawGraphData
      *
      * Adds data trace values to plotly trace structure and plots the data on graph.
      *
      * Parameters:
      * (String) type - type of currency
      *
      */
      $scope.drawGraphData = function(type) {

        var trace = {
          x: [$scope.cryptoData[type].x],
          close: [$scope.cryptoData[type].close],
          decreasing: { line: { color: "#ff0000" } },
          high: [$scope.cryptoData[type].high],
          increasing: { line: { color: "#4c9e2c" } },
          line: { color: "rgba(31,119,180,1)" },
          low: [$scope.cryptoData[type].low],
          open: [$scope.cryptoData[type].open],
          type: "candlestick",
          xaxis: "x",
          yaxis: "y"
        };

        var data = [trace];
        Plotly.plot(
          "plotly-" + type,
          data,
          $scope.layout[type]
        );
      };

      /** 
      * Method: addTraceToGraph
      *
      * Adds data trace values to plotly trace structure and adds new trace to graph.
      *
      * Parameters:
      * (String) type - type of currency
      *
      */
      $scope.addTraceToGraph = function(type) {
        var trace = {
          x: [$scope.cryptoData[type].x],
          close: [$scope.cryptoData[type].close],
          decreasing: { line: { color: "#ff0000" } },
          high: [$scope.cryptoData[type].high],
          increasing: { line: { color: "#4c9e2c" } },
          line: { color: "rgba(31,119,180,1)" },
          low: [$scope.cryptoData[type].low],
          open: [$scope.cryptoData[type].open],
          type: "candlestick",
          xaxis: "x",
          yaxis: "y"
        };

        Plotly.addTraces("plotly-" + type, trace, 0);
      };

      /** 
      * Method: updateGraphData
      *
      * Updates current trace with new data trace values.
      *
      * Parameters:
      * (String) type - type of currency
      *
      */
      $scope.updateGraphData = function(type) {
        Plotly.restyle(
          "plotly-" + type,
          {
            x: [[$scope.cryptoData[type].x]],
            close: [[$scope.cryptoData[type].close]],
            high: [[$scope.cryptoData[type].high]],
            low: [[$scope.cryptoData[type].low]],
            open: [[$scope.cryptoData[type].open]]
          },
          [0]
        );
      };

      /** 
      * Method: updatePeriod
      *
      * Initializes layouts and processing data.
      *
      */
      $scope.updatePeriod = function() {
        $scope.timePeriod = 1000 * 60 * $scope.period;
        $scope.cryptoData['BTC'].timeClose =
        $scope.cryptoData['BTC'].timeOpen + $scope.timePeriod;
        $scope.cryptoData['ETH'].timeClose =
        $scope.cryptoData['ETH'].timeOpen + $scope.timePeriod;
      }
       
      /** 
      * Method: initialize
      *
      * Initializes layouts and processing data.
      *
      */
      $scope.initialize = function() {
        $scope.configureLayout();
        $scope.startProcessingData();
      }

      $scope.initialize();
     
    }
  ]);
