Clear-Host

$pointsFromArray = '55.811511,37.312518','Ростов-на-Дону','Батайск','Абаза','Арзамас','Белозерск','Беслан','Буйнакск'
$pointsToArray = 'Краснодар','Азов','Кемерово','Абакан','Аксай','Барнаул','Волжск'

Write-Host 'Start load test'

foreach ($pointFrom in $pointsFromArray){

    foreach ($pointTo in $pointsToArray){

        $url = 'https://77.222.54.235:2370/route?apikey=IQTCgkwwGXEIGNtwka6J3li5xg2G8Ds1&waypoints='+ $pointFrom + '|' + $pointTo

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