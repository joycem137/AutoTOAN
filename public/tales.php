<?
//ini_set('display_errors', 'On');
//error_reporting(E_ALL | E_STRICT);

$username="autotoan_user";
$password="E2NvLU8mcAuAv8uC";
$database="autotoan";

mysql_connect("localhost", $username,$password);
@mysql_select_db($database) or die( "Unable to select database");

$paragraphIndex=$_REQUEST['paragraph'];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $paragraphDataUpdate=json_encode($_POST['updateData']);
    if ($paragraphDataUpdate != null) {
        $escapedJson = mysql_real_escape_string($paragraphDataUpdate);
        $query = "INSERT INTO paragraphs (number, data) VALUES(\"$paragraphIndex\", \"$escapedJson\")";
        mysql_query($query);
    }
}

// Now retrieve the results.
$query = "SELECT * FROM paragraphs WHERE `number`=$paragraphIndex";
$result = mysql_query($query);
$myRow = mysql_fetch_assoc($result);

mysql_close();

//Get the number of rows in your array for loop 
$numRows = mysql_numrows($result);

$myParagraph = "null";
if ($numRows > 0) {
	$myParagraph = $myRow["data"];
}

header('Content-Type: application/json');
echo "{\"number\":$paragraphIndex,\"data\":$myParagraph}";