const fs = require('fs');
const { execSync } = require('child_process');

let jsonString = fs.readFileSync('rules_utf8.json', 'utf8');
if (jsonString.charCodeAt(0) === 0xFEFF) {
  jsonString = jsonString.slice(1);
}
const data = JSON.parse(jsonString);

// Find rule with forward to careers target group
const careerRule = data.Rules.find(r => r.Actions.some(a => a.TargetGroupArn && a.TargetGroupArn.includes('smaatech-careers-tg')));

if (careerRule) {
    const pathConfig = careerRule.Conditions.find(c => c.Field === 'path-pattern');
    if (pathConfig) {
        if (!pathConfig.Values.includes('/career')) pathConfig.Values.push('/career');
        if (!pathConfig.Values.includes('/career/*')) pathConfig.Values.push('/career/*');
        if (!pathConfig.Values.includes('/careers')) pathConfig.Values.push('/careers'); // Just in case
        
        console.log('Modifying rule ARN:', careerRule.RuleArn);
        
        // aws elbv2 modify-rule --rule-arn <value> --conditions Field=path-pattern,Values='/api/jobs','/api/apply',...
        const conditionStr = `Field=path-pattern,Values=${pathConfig.Values.join(',')}`;
        const cmd = `aws elbv2 modify-rule --region us-east-1 --rule-arn ${careerRule.RuleArn} --conditions ${conditionStr}`;
        console.log('Running:', cmd);
        execSync(cmd, { stdio: 'inherit' });
    } else {
        console.error('No path pattern condition found for this rule!');
    }
} else {
    console.error('Career rule not found');
}
