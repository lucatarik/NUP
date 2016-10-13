document.addEventListener("deviceready", onDeviceReady, false);
APIURL = "http://lucatarik.altervista.org/ext_feed/notification.php";

if (typeof sqlitePlugin == 'undefined')
   sqlitePlugin = window;
db = sqlitePlugin.openDatabase('mydb.db', '1.0', '', 1);

sql = {
   createTable:"CREATE TABLE IF NOT EXISTS main(id INTEGER PRIMARY KEY AUTOINCREMENT, rows TEXT NOT NULL default '', timestamp DATE DEFAULT (datetime('now','localtime')))",
   dropTable:"drop table main"
}

function executeTransaction(query) {
   console.log("Transaction Query : " + query);
   return new Promise(function(resolve, reject) {
      db.transaction(function(transaction) {
         function error(tx,err)
         {
            console.log(err);
            reject(err);
         }
         transaction.executeSql(query, [], function(transaction, result) {
            console.log("Test: " + JSON.stringify(result));
            resolve(result); // here the returned Promise is resolved
         }, error, errorHandler);
      });
   });
}

function nullHandler(result)
{
   console.log("Null Log : " + JSON.stringify(result));

}

function errorHandler(error)
{
   console.log("Error Log : " + error);
}

function onDeviceReady()
{
   var push = PushNotification.init({"android": {"senderID": "857416814607", "forceShow": true}});
   push.on('registration', function(data)
   {
      console.log(data.registrationId);
      $.post(APIURL, {act: "register", regid: data.registrationId}, function(res) {
         console.log(res)
      });
   });

   push.on('notification', function(data) {
      alert(data.title + " Message: " + data.message);
   });

   push.on('error', function(e) {
      alert(e);
   });


   db.transaction(function(txn) {
      txn.executeSql(sql.createTable, [], function(tx, res) {
         console.log(res);
      });
   });
}

function recreateTable()
{
   executeTransaction(sql.dropTable).then(function(){executeTransaction(sql.createTable)});
}

function confirmDialog(text, callback) {
   text= text || "Are you sure?";
   var popupDialogId = 'popupDialog';
   $('<div data-role="popup" id="' + popupDialogId + '" data-confirmed="no" data-transition="pop" data-overlay-theme="a" data-theme="a" data-dismissible="false" style="max-width:500px;"> \
                        <div data-role="header" data-theme="a">\
                            <h1>Question</h1>\
                        </div>\
                        <div role="main" class="ui-content">\
                            <h3 class="ui-title">' + text + '</h3>\
                            <a href="#" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-a optionConfirm" data-rel="back">Yes</a>\
                            <a href="#" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b optionCancel" data-rel="back" data-transition="flow">No</a>\
                        </div>\
                    </div>')
           .appendTo($.mobile.pageContainer);
   var popupDialogObj = $('#' + popupDialogId);
   popupDialogObj.trigger('create');
   popupDialogObj.popup({
      afterclose: function(event, ui) {
         popupDialogObj.find(".optionConfirm").first().off('click');
         var isConfirmed = popupDialogObj.attr('data-confirmed') === 'yes' ? true : false;
         $(event.target).remove();
         if (isConfirmed && callback) {
            callback();
         }
      }
   });
   popupDialogObj.popup('open');
   popupDialogObj.find(".optionConfirm").first().on('click', function() {
      popupDialogObj.attr('data-confirmed', 'yes');
   });
}