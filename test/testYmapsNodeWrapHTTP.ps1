# Нагрузочная проверка сервиса, запущенного по HTTP (без key.pem и cert.pem).
# Пример: .\testYmapsNodeWrapHTTP.ps1 -Server localhost -Port 8080 -ApiKey <ACCESSAPIKEY>

Param (
    [Parameter(Mandatory=$true)][string]$Server,
    [Parameter(Mandatory=$true)][string]$Port,
    [Parameter(Mandatory=$true)][string]$ApiKey
)

Clear-Host

$pointsFromArray = '55.811511,37.312518','Ростов-на-Дону','Батайск','Абаза','Арзамас','Белозерск','Беслан','Буйнакск'
$pointsToArray = 'Краснодар','Азов','Кемерово','Абакан','Аксай','Барнаул','Волжск'

Write-Host 'Start load test'

foreach ($pointFrom in $pointsFromArray){

    foreach ($pointTo in $pointsToArray){

        $waypoints = [uri]::EscapeDataString($pointFrom + '|' + $pointTo)
        $url = 'http://' + $Server + ':' + $Port + '/route?apikey=' + [uri]::EscapeDataString($ApiKey) + '&waypoints=' + $waypoints

        try {
            $res = Invoke-WebRequest -UseBasicParsing -Uri $url
            Write-Host $res.Content
        } catch {
            Write-Host $pointFrom '->' $pointTo ':' $_.Exception.Message
        }

    }

}

Write-Host 'End load test'
