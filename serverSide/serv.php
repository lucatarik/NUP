<?php

require 'vendor/autoload.php';

use PicoFeed\Reader\Reader;
use PicoFeed\Config\Config;
use PicoFeed\Syndication\Atom;

$xml = "";

define('API_ACCESS_KEY', 'AIzaSyBXZWKb2ocMZdQo4ammWzkEhqP3ikRd4vw');
define('regis', 'registered_devices');
ini_set('session.cookie_lifetime', 60 * 60 * 24 * 7);
ini_set('session.gc_maxlifetime', 60 * 60 * 24 * 7);
session_name("2620368ghwahw90w4455");
session_id("2620368ghwahw90w4455");
session_start();
$_SESSION["REQUESTS"] = isset($_SESSION["REQUESTS"])?++$_SESSION["REQUESTS"]:1;
$writer = new Atom();

$writer->title    = "new unitified push";
$writer->site_url = "http://lll.osm.com";
$writer->feed_url = "http://lll.osm.com";
$writer->author   = array(
    'name'  => 'Me',
    'url'   => "http://lll.osm.com",
    'email' => 'me@here'
);
switch($_REQUEST["act"])
{
	case "test":
    var_dump($_SESSION);
    die();
    break;
   case "register":
      if (isset($_SESSION[regis]))
      {
         $_SESSION[regis][]=$_REQUEST["regid"];
      }
      else
      {
         $_SESSION[regis]= array($_REQUEST["regid"]);
      }
      array("req"=>"ack","status"=>  sendPush($_REQUEST["regid"],"Registered","Device Registered"));
   break;
	default:
    break;
}
/*$writer->items[] = array(
       "id"       => $_SESSION["REQUESTS"],
       "title"    => "ok",
       "url"      => "http://lll.osm.com",
       "date"     => "",
       "author"   => array(
           'name'  => "",
           'email' => 'me@here'
       ),
       "content"  => "ok",
   );*/

$xml = $writer->execute();

ob_clean();
header("Content-Type: application/xml");
echo $xml;


/*
 *
 *
  // Examples for the feed:
  echo $feed->getId();
  echo $feed->getTitle();
  echo $feed->getFeedUrl();
  echo $feed->getDate();
  echo $feed->getLanguage();
  echo $feed->getItems();

  // Examples for items:
  $item->getId();
  $item->getTitle();
  $item->getUrl();
  $item->getDate();
  $item->getLanguage();
  $item->getAuthor();
  $item->getEnclosureUrl();
  $item->getEnclosureType();
  $item->getContentUTF8();
 */


function sendPush($to, $title = "Title", $message = "Message", $additional = array())
{
   // API access key from Google API's Console
   $registrationIds = is_array($to) ? $to : array($to);
   $msg             = array
       (
       'message' => $message,
       'title'   => $title,
       'vibrate' => true,
       'sound'   => true

// you can also add images, additionalData
   );
   $fields          = array
       (
       'registration_ids' => $registrationIds,
       'data'             => array_merge($msg, $additional)
   );
   $headers         = array
       (
       'Authorization: key=' . API_ACCESS_KEY,
       'Content-Type: application/json'
   );
   $ch              = curl_init();
   curl_setopt($ch, CURLOPT_URL, 'https://android.googleapis.com/gcm/send');
   curl_setopt($ch, CURLOPT_POST, true);
   curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
   curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
   curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
   curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));
   $result          = curl_exec($ch);
   curl_close($ch);
   return $result;
}
?>