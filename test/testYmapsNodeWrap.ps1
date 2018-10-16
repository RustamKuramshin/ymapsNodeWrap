Clear-Host

#$AllProtocols = [System.Net.SecurityProtocolType]'Ssl3,Tls,Tls11,Tls12'
#[System.Net.ServicePointManager]::SecurityProtocol = $AllProtocols
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

$pointsFromArray = '55.811511,37.312518','Ростов-на-Дону','Батайск','Абаза','Арзамас','Белозерск','Беслан','Буйнакск'
$pointsToArray = 'Краснодар','Азов','Кемерово','Абакан','Аксай','Барнаул','Волжск'

Write-Host 'Start load test'

foreach ($pointFrom in $pointsFromArray){

    foreach ($pointTo in $pointsToArray){

        $res = Invoke-WebRequest -Uri ('https://localhost:8080/route?apikey=IQTCgkwwGXEIGNtwka6J3li5xg2G8Ds1&waypoints=' + $pointFrom + '|' + $pointTo)
        Write-Host $res.Content
    
    }

}

Write-Host 'End load test'