'use strict';

/* Animation */
function generateAnimation(krakenDataset) {
    const totalDuration = 10000;
    const delayBetweenPoints = totalDuration / krakenDataset.length;
    const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
    const animation = {
        x: {
            type: 'number',
            easing: 'linear',
            duration: delayBetweenPoints,
            from: NaN, // the point is initially skipped
            delay(ctx) {

                if (ctx.type !== 'data' || ctx.xStarted) {
                    return 0;
                }
                ctx.xStarted = true;
                return ctx.index * delayBetweenPoints;
            }
        },
        y: {
            type: 'number',
            easing: 'linear',
            duration: delayBetweenPoints,
            from: previousY,
            delay(ctx) {
                if (ctx.type !== 'data' || ctx.yStarted) {
                    return 0;
                }
                ctx.yStarted = true;
                return ctx.index * delayBetweenPoints;
            }
        }
    };
    return animation;
}

function callbackInitDataSet(jsonResponse) {
    let krakenResult = JSON.parse(jsonResponse);
    console.log(krakenResult)
    for (const result of krakenResult["result"]["XXBTZUSD"]) {
        //console.log(krakenResult["result"]["XXBTZUSD"][0]);

        if (!isNaN(result[2])) {//console.log(Math.trunc(result[2] * 1000));
            krakenDataset.push({
                x: new Date(Math.trunc(result[2] * 1000)).toISOString(),
                y: result[0]
            });
        }
    }
    myChart.options.animation = generateAnimation(krakenDataset)
    myChart.update();
}
/**
 * Retrieve last 1k price changes for target currency pair (CORS)
 */
function initDataset() {
    let targetUrl = "/trades?pair=XBTUSD";
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callbackInitDataSet(xmlHttp.responseText);
    }
    xmlHttp.open("GET", targetUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

/**
         * Callback for the historical dataset
         * Draw graph
         */

function initGeneralInformation() {
    let targetUrl = "/ticker?pair=XBTUSD";
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            //document.querySelector("#header").innerHTML = xmlHttp.responseText;
            JSON.parse(xmlHttp.responseText)
        }
    }
    xmlHttp.open("GET", targetUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}


/**
     Websocket - live feed on target currency pair
*/
function subscribe(targetLocation) {

    let socket = new WebSocket("wss://ws.kraken.com");
    let message = {
        "event": "subscribe",
        "pair": [
            "XBT/USD",
            //"XBT/EUR"
        ],
        "subscription": {
            "name": "trade"
            //"name": "ticker"
        }
    }

    socket.onopen = function (e) {
        console.log("[open] Connection established");
        console.log("Sending to server");
        socket.send(JSON.stringify(message));
    };

    socket.onmessage = function (event) {
        console.log(`[message] Data received from server: ${event.data}`);
        var data = JSON.parse(event.data);
        if (data[1]) {
            //console.log(data[1][0][2]);
            krakenDataset.push({
                //x: new Date(Date.now()).toISOString(),
                x: new Date(Math.trunc(data[1][0][2] * 1000)).toISOString(),
                y: data[1][0][0]
            })
            myChart.update();

            targetLocation.insertAdjacentHTML("afterbegin",
                `<tr>
                    <td>${data[1][0][0]}</td>
                    <td>${new Date(Math.trunc(data[1][0][2] * 1000)).toISOString()}</td>
                    <td>${data[1][0][3]}</td>
                </tr>`
            )
            if (targetLocation.childNodes.length > 10) {
                targetLocation.remove(targetLocation.lastChild);
            }
        }
        //for items in 
        //document.querySelector("#dataBody")
    };

    socket.onclose = function (event) {
        if (event.wasClean) {
            console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            // e.g. server process killed or network down
            // event.code is usually 1006 in this case
            console.log('[close] Connection died');
        }
    };

    socket.onerror = function (error) {
        console.log(`[error] ${error.message}`);
    };
}
