
Param (
[string]$Server,
[string]$Port
)

Clear-Host

$pointsFromArray = '55.811511,37.312518','Ростов-на-Дону','Батайск','Абаза','Арзамас','Белозерск','Беслан','Буйнакск'
$pointsFromArray += 'Ульяновская обл, Ульяновск г, Инженерный 44-й проезд, дом № 1,'
$pointsFromArray += 'Татарстан Респ, Казань г, Тихорецкая ул, 13'
$pointsFromArray += 'Башкортостан Респ, Уфа г, Трамвайная ул, дом № 2,'
$pointsFromArray += 'Татарстан Респ, Казань г, Тихорецкая ул, 5'

$pointsToArray = 'Краснодар','Азов','Кемерово','Абакан','Аксай','Барнаул','Волжск'
$pointsToArray += '58.627826,49.739008'
$pointsToArray += '58.515586,50.003858'
$pointsToArray += '53.561578,49.309388'
$pointsToArray += '58.627826,49.739008'

Write-Host 'Start load test'

foreach ($pointFrom in $pointsFromArray){

    foreach ($pointTo in $pointsToArray){

        $url = "https://" + $Server + ":" + $Port + "/route?apikey=IQTCgkwwGXEIGNtwka6J3li5xg2G8Ds1&waypoints="+ $pointFrom + "|" + $pointTo

        $request = [System.Net.HttpWebRequest]::CreateHttp($url)
        $request.Method = 'GET'
        $request.ServerCertificateValidationCallback = {$true}

        $responseObj = $request.GetResponse()
        $responseStreamObj = $responseObj.GetResponseStream()

        $responseStream = New-Object System.IO.StreamReader($responseStreamObj)

        $responseStr = $responseStream.ReadToEnd()

        Write-Host $responseStr

        $responseObj.Close()
        $responseStreamObj.Close()
   
   }
}

Write-Host 'End load test'