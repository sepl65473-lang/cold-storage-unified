const fs = require('fs');
let content = fs.readFileSync('dist_config_utf8.json', 'utf8');
if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
const config = JSON.parse(content);

// 1. Add the Portal S3 Origin
const portalOrigin = {
    "Id": "S3-cold-storage-web-prod-288834682310",
    "DomainName": "cold-storage-web-prod-288834682310.s3.us-east-1.amazonaws.com",
    "OriginPath": "",
    "CustomHeaders": { "Quantity": 0 },
    "S3OriginConfig": { "OriginAccessIdentity": "" },
    "ConnectionAttempts": 3,
    "ConnectionTimeout": 10,
    "OriginShield": { "Enabled": false },
    "OriginAccessControlId": "E47UUHLFB2H3G" // Using the same OAC as the portal distribution
};

config.DistributionConfig.Origins.Items.push(portalOrigin);
config.DistributionConfig.Origins.Quantity = config.DistributionConfig.Origins.Items.length;

// 2. Add the /panel* behavior
const panelBehavior = {
    "PathPattern": "/panel*",
    "TargetOriginId": "S3-cold-storage-web-prod-288834682310",
    "TrustedSigners": { "Enabled": false, "Quantity": 0 },
    "TrustedKeyGroups": { "Enabled": false, "Quantity": 0 },
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
        "Quantity": 2,
        "Items": ["HEAD", "GET"],
        "CachedMethods": { "Quantity": 2, "Items": ["HEAD", "GET"] }
    },
    "SmoothStreaming": false,
    "Compress": true,
    "LambdaFunctionAssociations": { "Quantity": 0 },
    "FunctionAssociations": {
        "Quantity": 1,
        "Items": [
            {
                "FunctionARN": "arn:aws:cloudfront::288834682310:function/directory-index-prod",
                "EventType": "viewer-request"
            }
        ]
    },
    "FieldLevelEncryptionId": "",
    "ForwardedValues": {
        "QueryString": false,
        "Cookies": { "Forward": "none" },
        "Headers": { "Quantity": 0 },
        "QueryStringCacheKeys": { "Quantity": 0 }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
};

// Insert at the beginning of behaviors to ensure priority
config.DistributionConfig.CacheBehaviors.Items.unshift(panelBehavior);
config.DistributionConfig.CacheBehaviors.Quantity = config.DistributionConfig.CacheBehaviors.Items.length;

// Remove ETag and keep only DistributionConfig for the update call
const finalConfig = config.DistributionConfig;
fs.writeFileSync('dist_config_patched.json', JSON.stringify(finalConfig, null, 4));
console.log("Patched config saved to dist_config_patched.json");
console.log("ETag:", config.ETag);
