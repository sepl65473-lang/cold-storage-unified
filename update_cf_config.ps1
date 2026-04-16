$json = Get-Content 'cf_config_actual.json' | ConvertFrom-Json
$json.DistributionConfig.Aliases.Quantity = 2
$json.DistributionConfig.Aliases.Items = @('smaatechengineering.com', 'www.smaatechengineering.com')
$json.DistributionConfig | ConvertTo-Json -Depth 10 | Set-Content 'cf_prod_config_v5.json'
