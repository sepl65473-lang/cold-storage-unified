import json

with open('cf_full_config.json', 'r') as f:
    full_config = json.load(f)

config = full_config['DistributionConfig']

# Create New ALB Origin
new_origin = {
    "Id": "ALB-Backend",
    "DomainName": "cold-storage-alb-prod-8890284825.us-east-1.elb.amazonaws.com",
    "OriginPath": "",
    "CustomHeaders": {"Quantity": 0},
    "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "http-only",
        "OriginSslProtocols": {
            "Quantity": 3,
            "Items": ["TLSv1", "TLSv1.1", "TLSv1.2"]
        },
        "OriginReadTimeout": 30,
        "OriginKeepaliveTimeout": 5
    }
}

# Add Origin
config['Origins']['Items'].append(new_origin)
config['Origins']['Quantity'] = len(config['Origins']['Items'])

# Create New Cache Behavior
new_behavior = {
    "PathPattern": "/api/*",
    "TargetOriginId": "ALB-Backend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
        "Quantity": 7,
        "Items": ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"],
        "CachedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"]
        }
    },
    "Compress": True,
    "ForwardedValues": {
        "QueryString": True,
        "Cookies": {"Forward": "all"},
        "Headers": {"Quantity": 0},
        "QueryStringCacheKeys": {"Quantity": 0}
    },
    "TrustedSigners": {"Enabled": False, "Quantity": 0},
    "MinTTL": 0,
    "DefaultTTL": 0,
    "MaxTTL": 0
}

# Add Behavior
if 'CacheBehaviors' not in config or config['CacheBehaviors'].get('Items') is None:
     config['CacheBehaviors'] = {"Quantity": 1, "Items": [new_behavior]}
else:
     config['CacheBehaviors']['Items'].append(new_behavior)
     config['CacheBehaviors']['Quantity'] = len(config['CacheBehaviors']['Items'])

with open('cf_payload_v4.json', 'w') as f:
    json.dump(config, f, indent=4)

print("Generated cf_payload_v4.json successfully.")
