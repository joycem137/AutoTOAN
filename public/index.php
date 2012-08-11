<?
$username="autotoan_user";
$password="E2NvLU8mcAuAv8uC";
$database="autotoan";

mysql_connect(localhost,$username,$password);
@mysql_select_db($database) or die( "Unable to select database");

$paragraphIndex=$_GET['paragraph'];
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
echo "{number:$paragraphIndex,data:$myParagraph}";
?>