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
        $query = sprintf("INSERT INTO paragraphs (number, data) VALUES('%s', '%s')",
            mysql_real_escape_string($paragraphIndex),
            mysql_real_escape_string($paragraphDataUpdate));
        mysql_query($query);
    }
}

// Now retrieve the results.
$query = sprintf("SELECT * FROM paragraphs WHERE `number`='%s'",
    mysql_real_escape_string($paragraphIndex));

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