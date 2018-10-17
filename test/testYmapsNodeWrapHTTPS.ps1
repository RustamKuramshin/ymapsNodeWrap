Clear-Host

$url = 'https://77.222.54.235:2370/route?apikey=IQTCgkwwGXEIGNtwka6J3li5xg2G8Ds1&waypoints=Москва|Ростов-на-Дону|Кемерово|Краснодар'
$Request = [System.Net.HttpWebRequest]::CreateHttp($url)
$Request.Method = 'GET'
$Request.ServerCertificateValidationCallback = {$true}
$response = $Request.GetResponse().GetResponseStream()
$sr = New-Object System.IO.StreamReader($response) 
$respTxt = $sr.ReadToEnd()
$respTxt