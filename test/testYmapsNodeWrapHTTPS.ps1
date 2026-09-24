# Нагрузочная проверка сервиса, запущенного по HTTPS (самоподписанный сертификат допускается).
# Пример: .\testYmapsNodeWrapHTTPS.ps1 -Server localhost -Port 8080 -ApiKey <ACCESSAPIKEY>

Param (
    [Parameter(Mandatory=$true)][string]$Server,
    [Parameter(Mandatory=$true)][string]$Port,
    [Parameter(Mandatory=$true)][string]$ApiKey
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

        $waypoints = [uri]::EscapeDataString($pointFrom + '|' + $pointTo)
        $url = 'https://' + $Server + ':' + $Port + '/route?apikey=' + [uri]::EscapeDataString($ApiKey) + '&waypoints=' + $waypoints

        $request = [System.Net.HttpWebRequest]::CreateHttp($url)
        $request.Method = 'GET'
        $request.ServerCertificateValidationCallback = {$true}

        try {
            $responseObj = $request.GetResponse()
        } catch [System.Net.WebException] {
            $responseObj = $_.Exception.Response
            if ($responseObj -eq $null) {
                Write-Host $pointFrom '->' $pointTo ':' $_.Exception.Message
                continue
            }
        }

        $responseStream = New-Object System.IO.StreamReader($responseObj.GetResponseStream())
        Write-Host $responseStream.ReadToEnd()

        $responseStream.Close()
        $responseObj.Close()

    }
}

Write-Host 'End load test'
