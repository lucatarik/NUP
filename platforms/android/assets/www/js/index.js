document.addEventListener("deviceready",onDeviceReady,false);
APIURL = "http://lucatarik.altervista.org/ext_feed/notification.php";

if (typeof sqlitePlugin == 'undefined')
   sqlitePlugin = window;
db = sqlitePlugin.openDatabase('mydb.db', '1.0', '', 1);

function executeTransaction(query) {
    console.log("Transaction Query : " + query);
    return new Promise(function (resolve, reject) {
        db.transaction(function (transaction) {
            transaction.executeSql(query, [], function (transaction, result) {
                console.log("Test: " + JSON.stringify(result));
                resolve(result); // here the returned Promise is resolved
            }, nullHandler, errorHandler);
        });
    });
}

function nullHandler(result)
{
    console.log("Null Log : " + JSON.stringfy(result));

}

function errorHandler(error)
{
    console.log("Error Log : " + error);
}

function onDeviceReady()
{
	var push = PushNotification.init({ "android": {"senderID": "857416814607","forceShow":true}});
	push.on('registration', function(data)
	{
		console.log(data.registrationId);
		$.post(APIURL,{act:"register",regid:data.registrationId},function(res){console.log(res)});
	});

	push.on('notification', function(data) {
		alert(data.title+" Message: " +data.message);
	});

	push.on('error', function(e) {
		alert(e);
	});


	db.transaction(function (txn) {
	  txn.executeSql("CREATE TABLE IF NOT EXISTS main(id INTEGER PRIMARY KEY AUTOINCREMENT, rows TEXT NOT NULL default '')", [], function (tx, res) {console.log(res);});
	});
}