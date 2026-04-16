const { execSync } = require('child_process');
const fs = require('fs');

const DISTRIBUTION_ID = 'E3OLWZ1I7XXQH7';

try {
    console.log("Fetching CloudFront config...");
    const rawOutput = execSync(`aws cloudfront get-distribution-config --id ${DISTRIBUTION_ID} --output json`, { encoding: 'utf8' });
    const fullConfig = JSON.parse(rawOutput);
    const etag = fullConfig.ETag;
    const config = fullConfig.DistributionConfig;

    console.log(`Current ETag: ${etag}`);

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

    // Add Origin if not exists
    if (!config.Origins.Items.some(o => o.Id === "ALB-Backend")) {
        config.Origins.Items.push(newOrigin);
        config.Origins.Quantity = config.Origins.Items.length;
    }

    // Clone Default Cache Behavior as a template to ensure all mandatory fields (Lambda, SmoothStreaming, etc) are present
    const template = JSON.parse(JSON.stringify(config.DefaultCacheBehavior));
    
    const newBehavior = {
        ...template,
        "PathPattern": "/api/*",
        "TargetOriginId": "ALB-Backend",
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 0,
        "DefaultTTL": 0,
        "MaxTTL": 0
    };

    // Add Behavior if not exists
    if (!config.CacheBehaviors || !config.CacheBehaviors.Items) {
         config.CacheBehaviors = {"Quantity": 1, "Items": [newBehavior]};
    } else {
         const existingIndex = config.CacheBehaviors.Items.findIndex(b => b.PathPattern === "/api/*");
         if (existingIndex >= 0) {
             config.CacheBehaviors.Items[existingIndex] = newBehavior;
         } else {
             config.CacheBehaviors.Items.push(newBehavior);
         }
         config.CacheBehaviors.Quantity = config.CacheBehaviors.Items.length;
    }

    fs.writeFileSync('cf_final_payload.json', JSON.stringify(config));

    console.log("Applying update to CloudFront...");
    const updateOutput = execSync(`aws cloudfront update-distribution --id ${DISTRIBUTION_ID} --if-match ${etag} --distribution-config file://cf_final_payload.json --no-cli-pager`, { encoding: 'utf8' });
    
    console.log("SUCCESS! CloudFront update triggered.");
    console.log(updateOutput.substring(0, 200) + "...");

} catch (err) {
    console.error("Critical Failure:");
    console.error(err.stdout || err.message);
}
