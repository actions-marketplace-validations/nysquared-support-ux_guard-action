const core = require('@actions/core');
const { Guard } = require('@ny-squared/guard');

async function run() {
  try {
    // Get inputs
    const prompt = core.getInput('prompt', { required: true });
    const threshold = parseFloat(core.getInput('threshold') || '0.7');
    const failOnBlock = core.getInput('fail_on_block') !== 'false';
    const apiKey = core.getInput('api_key');

    // Validate threshold
    if (isNaN(threshold) || threshold < 0 || threshold > 1) {
      throw new Error(`Invalid threshold: "${core.getInput('threshold')}". Must be between 0.0 and 1.0`);
    }

    // Initialize Guard
    const config = {};
    if (apiKey) {
      config.apiKey = apiKey;
    }
    const guard = new Guard(config);

    // Scan the prompt
    core.info(`Scanning prompt (${prompt.length} chars) with threshold ${threshold}...`);
    const result = await guard.scan(prompt);

    // Calculate risk score (highest threat confidence)
    const riskScore = result.threats && result.threats.length > 0
      ? Math.max(...result.threats.map(t => t.confidence))
      : 0;

    // Determine risk type
    let riskType = 'none';
    if (result.threats && result.threats.length > 0) {
      // Pick the type of the highest-confidence threat
      const topThreat = result.threats.reduce((max, t) =>
        t.confidence > max.confidence ? t : max
      , result.threats[0]);
      riskType = topThreat.type || 'unknown';
    }

    // Determine if blocked
    const blocked = riskScore >= threshold;

    // Set outputs
    core.setOutput('risk_score', riskScore.toFixed(2));
    core.setOutput('blocked', blocked.toString());
    core.setOutput('risk_type', riskType);
    core.setOutput('details', JSON.stringify({
      risk_score: riskScore,
      blocked,
      risk_type: riskType,
      threats: result.threats || [],
      is_safe: result.isSafe,
      latency_ms: result.latencyMs,
      threshold,
      prompt_length: prompt.length,
    }));

    // Log results
    core.info(`Risk score: ${riskScore.toFixed(2)}`);
    core.info(`Risk type: ${riskType}`);
    core.info(`Blocked: ${blocked}`);
    core.info(`Threats found: ${(result.threats || []).length}`);
    core.info(`Scan latency: ${result.latencyMs}ms`);

    if (result.threats && result.threats.length > 0) {
      core.warning('Threats detected:');
      for (const threat of result.threats) {
        core.warning(`  - [${threat.type}] confidence: ${threat.confidence} | ${threat.detail}`);
      }
    }

    // Fail if blocked and fail_on_block is true
    if (blocked && failOnBlock) {
      core.setFailed(
        `Prompt blocked: risk score ${riskScore.toFixed(2)} exceeds threshold ${threshold}. ` +
        `Risk type: ${riskType}. ` +
        `Use fail_on_block: 'false' to prevent workflow failure.`
      );
    }

  } catch (error) {
    core.setFailed(`Guard Action failed: ${error.message}`);
  }
}

run();
