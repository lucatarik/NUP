document.addEventListener("deviceready", onDeviceReady, false);
APIURL = "http://lucatarik.altervista.org/ext_feed/notification.php";
ROWXPAG = 5;
def_icon = 'groupme_two.png';
curpage = 0;
maxpage = 1;

sql = {
   createTable: "CREATE TABLE IF NOT EXISTS main(id INTEGER PRIMARY KEY AUTOINCREMENT, rows TEXT NOT NULL default '', timestamp DATE DEFAULT (datetime('now','localtime')))",
   dropTable: "drop table main",
   select: "select *, date(timestamp) as date, strftime(\"%H:%S\",timestamp) as time from main order by timestamp desc limit 0," + ROWXPAG,
   clearOld: "CREATE TABLE IF NOT EXISTS main2(id INTEGER PRIMARY KEY AUTOINCREMENT, rows TEXT NOT NULL default '', timestamp DATE DEFAULT (datetime('now','localtime'))); \
               delete from main where id not in (select id from main order by id desc limit 10); \
               insert into main2 (rows,timestamp) SELECT rows,timestamp FROM main; \
               drop table main; \
               ALTER TABLE main2 RENAME TO main;"
}



function executeTransaction(query) {
   console.log("Transaction Query : " + query);
   return new Promise(function(resolve, reject) {
      db.transaction(function(transaction) {
         function error(tx, err)
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
   if (typeof sqlitePlugin == 'undefined')
      sqlitePlugin = window;
   db = sqlitePlugin.openDatabase('mydb.db', '1.0', '', 1);
   if (typeof PushNotification != 'undefined')
   {
      var push = PushNotification.init({"android": {"senderID": "857416814607", "forceShow": true}});
      push.on('registration', function(data)
      {
         console.log(data.registrationId);
         $.post(APIURL, {act: "register", regid: data.registrationId}, function(res) {
            console.log(res);
         });
      });

      push.on('notification', function(data) {
         alert(data.title + " Message: " + data.message);
      });

      push.on('error', function(e) {
         alert(e);
      });
   }

   db.transaction(function(txn) {
      txn.executeSql(sql.createTable, [], function(tx, res) {
      });
   });
   fetchpage(curpage);

   $('.navigationcontrols').unbind('click').bind('click', function()
   {
      if ($(this).is('.prev'))
      {
         if (curpage > 0)
            fetchpage(--curpage);
      }
      else
      {
         if (curpage < maxpage)
            fetchpage(++curpage);
      }
      this.blur();
   });
}

function fetchpage(pag)
{
   pag = pag || 0;
   executeTransaction(sql.select.replace(/limit [0-9]+,/, 'limit ' + (pag * ROWXPAG) + ',')).then(renderpage);
}

function renderpage(res)
{
   var cnt = $('#tabOne .ui-listview');
   var newhtml = "";
   var date = new Date().toISOString().slice(0, 10);
   if (res.rows._array.length == ROWXPAG)
      maxpage = curpage + 1;
   $(res.rows._array).each(function()
   {
      var tmpobj = JSON.parse(this.rows);
      tmpobj.time = this.time;
      if (typeof tmpobj.image == "undefined")
         tmpobj.icon = def_icon;
      else
         tmpobj.icon = tmpobj.image.split('/').pop();

      if (date != this.date)
      {
         date = this.date;
         newhtml += TemplateEngine($('#tpl_daterow').html(), this);
      }
      newhtml += TemplateEngine($('#tpl_mainrow').html(), tmpobj);
   });
   cnt.html(newhtml).listview('refresh');
}

function clearOld()
{

   var prom = [];
   sql.clearOld.split(";").map(function(v)
   {
      if (v.length)
         prom.push(new Promise(function(resolve, reject) {
            console.log(v);
            resolve(executeTransaction(v))
         }));
   });

   Promise.all(prom).then(function() {
      curpage = 0;
      fetchpage(0);
   });
}

function recreateTable()
{
   executeTransaction(sql.dropTable).then(function() {
      executeTransaction(sql.createTable)
   });
}

function confirmDialog(text, callback) {
   text = text || "Are you sure?";
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