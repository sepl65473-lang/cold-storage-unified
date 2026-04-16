const fs = require('fs');

let rawData = fs.readFileSync('cf_full_config.json', 'utf8');
if (rawData.charCodeAt(0) === 0xFEFF || rawData.charCodeAt(0) === 0xFFFE) {
    rawData = rawData.slice(1);
}
const fullConfig = JSON.parse(rawData);
const config = fullConfig.DistributionConfig;

// Create New ALB Origin
const newOrigin = {
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
};

// Add Origin
config.Origins.Items.push(newOrigin);
config.Origins.Quantity = config.Origins.Items.length;

// Create New Cache Behavior
const newBehavior = {
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
    "Compress": true,
    "ForwardedValues": {
        "QueryString": true,
        "Cookies": {"Forward": "all"},
        "Headers": {"Quantity": 0},
        "QueryStringCacheKeys": {"Quantity": 0}
    },
    "TrustedSigners": {"Enabled": false, "Quantity": 0},
    "MinTTL": 0,
    "DefaultTTL": 0,
    "MaxTTL": 0
};

// Add Behavior
if (!config.CacheBehaviors || !config.CacheBehaviors.Items) {
     config.CacheBehaviors = {"Quantity": 1, "Items": [newBehavior]};
} else {
     config.CacheBehaviors.Items.push(newBehavior);
     config.CacheBehaviors.Quantity = config.CacheBehaviors.Items.length;
}

fs.writeFileSync('cf_payload_v5.json', JSON.stringify(config, null, 4));
console.log("Generated cf_payload_v5.json successfully.");
