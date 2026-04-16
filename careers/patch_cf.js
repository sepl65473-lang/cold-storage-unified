const fs = require('fs');
const { execSync } = require('child_process');

const ID = 'E3OLWZ1I7XXQH7';
let jsonString = fs.readFileSync('cf_config_utf8.json', 'utf8');
if (jsonString.charCodeAt(0) === 0xFEFF) {
  jsonString = jsonString.slice(1);
}
const config = JSON.parse(jsonString);
const distributionConfig = config.DistributionConfig;
const etag = config.ETag;

// Fix the typo in the ALB origin domain
const albOrigin = distributionConfig.Origins.Items.find(o => o.Id === 'ALB-Backend');
if (albOrigin) {
    albOrigin.DomainName = 'cold-storage-alb-prod-890284825.us-east-1.elb.amazonaws.com';
    albOrigin.CustomOriginConfig.OriginProtocolPolicy = 'http-only';
}

// Add Origins? Already has ALB-Backend.
// Update CacheBehaviors

const newBehaviors = [
  {
    PathPattern: '/api/jobs',
    TargetOriginId: 'ALB-Backend',
    ViewerProtocolPolicy: 'redirect-to-https',
    AllowedMethods: {
      Quantity: 7,
      Items: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
      CachedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] }
    },
    ForwardedValues: {
      QueryString: true,
      Cookies: { Forward: 'all' },
      Headers: { Quantity: 0 },
      QueryStringCacheKeys: { Quantity: 0 }
    },
    MinTTL: 0, DefaultTTL: 0, MaxTTL: 0,
    SmoothStreaming: false, Compress: false,
    LambdaFunctionAssociations: { Quantity: 0 },
    FunctionAssociations: { Quantity: 0 },
    FieldLevelEncryptionId: ""
  },
  {
    PathPattern: '/api/apply',
    TargetOriginId: 'ALB-Backend',
    ViewerProtocolPolicy: 'redirect-to-https',
    AllowedMethods: {
      Quantity: 7,
      Items: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
      CachedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] }
    },
    ForwardedValues: {
      QueryString: true,
      Cookies: { Forward: 'all' },
      Headers: { Quantity: 0 },
      QueryStringCacheKeys: { Quantity: 0 }
    },
    MinTTL: 0, DefaultTTL: 0, MaxTTL: 0,
    SmoothStreaming: false, Compress: false,
    LambdaFunctionAssociations: { Quantity: 0 },
    FunctionAssociations: { Quantity: 0 },
    FieldLevelEncryptionId: ""
  },
  {
    PathPattern: '/admin*',
    TargetOriginId: 'ALB-Backend',
    ViewerProtocolPolicy: 'redirect-to-https',
    AllowedMethods: {
      Quantity: 7,
      Items: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
      CachedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] }
    },
    ForwardedValues: {
      QueryString: true,
      Cookies: { Forward: 'all' },
      Headers: { Quantity: 0 },
      QueryStringCacheKeys: { Quantity: 0 }
    },
    MinTTL: 0, DefaultTTL: 0, MaxTTL: 0,
    SmoothStreaming: false, Compress: false,
    LambdaFunctionAssociations: { Quantity: 0 },
    FunctionAssociations: { Quantity: 0 },
    FieldLevelEncryptionId: ""
  },
  {
    PathPattern: '/career*',
    TargetOriginId: 'ALB-Backend',
    ViewerProtocolPolicy: 'redirect-to-https',
    AllowedMethods: {
      Quantity: 7,
      Items: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
      CachedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] }
    },
    ForwardedValues: {
      QueryString: true,
      Cookies: { Forward: 'all' },
      Headers: { Quantity: 0 },
      QueryStringCacheKeys: { Quantity: 0 }
    },
    MinTTL: 0, DefaultTTL: 0, MaxTTL: 0,
    SmoothStreaming: false, Compress: false,
    LambdaFunctionAssociations: { Quantity: 0 },
    FunctionAssociations: { Quantity: 0 },
    FieldLevelEncryptionId: ""
  }
];

// Combine with existing behavior for /api/* but update it to allow POST
const existingApiBehavior = distributionConfig.CacheBehaviors.Items.find(b => b.PathPattern === '/api/*');
if (existingApiBehavior) {
    existingApiBehavior.AllowedMethods = {
        Quantity: 7,
        Items: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
        CachedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] }
    };
    existingApiBehavior.ForwardedValues.QueryString = true;
    existingApiBehavior.ForwardedValues.Cookies.Forward = 'all';
}

// Prefix the new behaviors
distributionConfig.CacheBehaviors.Items = [...newBehaviors, ...distributionConfig.CacheBehaviors.Items.filter(b => !['/api/jobs', '/api/apply', '/admin*'].includes(b.PathPattern))];
distributionConfig.CacheBehaviors.Quantity = distributionConfig.CacheBehaviors.Items.length;

fs.writeFileSync('cf_config_new.json', JSON.stringify(distributionConfig, null, 4));

console.log('New config generated. Updating CloudFront...');
try {
    const cmd = `aws cloudfront update-distribution --id ${ID} --if-match ${etag} --distribution-config file://cf_config_new.json --region us-east-1`;
    // We execute this outside or provide the command.
    console.log('COMMAND READY: ' + cmd);
} catch (e) {
    console.error(e);
}
