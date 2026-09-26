import { SecretFinding, Severity } from '../types/forensics';

export interface SecretRule {
  id: string;
  category: string;
  description: string;
  pattern: RegExp;
  severity: Severity;
  defaultEntropyFloor: number;
}

/**
 * Calculates the Shannon Entropy of a string:
 * H(X) = - sum( P(x) * log2(P(x)) )
 */
export function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;

  const len = str.length;
  const frequencies = new Map<string, number>();

  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }

  let entropy = 0;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  return Number(entropy.toFixed(3));
}

/**
 * Masks a sensitive string, exposing only head and tail chars.
 */
export function maskSecret(secret: string): string {
  if (!secret) return '';
  if (secret.length <= 6) return '*'.repeat(secret.length);
  const head = secret.slice(0, 3);
  const tail = secret.slice(-3);
  const maskedLength = Math.max(4, secret.length - 6);
  return `${head}${'*'.repeat(Math.min(12, maskedLength))}${tail}`;
}

/**
 * 32+ Comprehensive Forensics Secret Detection Categories
 */
export const SECRET_RULES: SecretRule[] = [
  {
    id: 'sec-aws-access-key',
    category: 'AWS Access Key',
    description: 'Amazon Web Services IAM User Access Key ID',
    pattern: /(?:^|[^A-Z0-9])(AKIA[0-9A-Z]{16})(?:[^A-Z0-9]|$)/g,
    severity: 'critical',
    defaultEntropyFloor: 3.5,
  },
  {
    id: 'sec-aws-secret-key',
    category: 'AWS Secret Key',
    description: 'Amazon Web Services Secret Access Key credential',
    pattern: /(?:aws_secret_access_key|aws_secret_key|secret_key)\s*[:=]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/gi,
    severity: 'critical',
    defaultEntropyFloor: 4.2,
  },
  {
    id: 'sec-github-pat',
    category: 'GitHub Personal Access Token',
    description: 'GitHub Classic or Fine-Grained Personal Access Token',
    pattern: /(?:ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})/g,
    severity: 'critical',
    defaultEntropyFloor: 4.0,
  },
  {
    id: 'sec-github-oauth',
    category: 'GitHub OAuth Token',
    description: 'GitHub OAuth App Access Token',
    pattern: /gho_[a-zA-Z0-9]{36}/g,
    severity: 'critical',
    defaultEntropyFloor: 4.0,
  },
  {
    id: 'sec-gcp-api-key',
    category: 'Google Cloud / Gemini Key',
    description: 'Google Cloud Platform or Gemini API Key',
    pattern: /AIza[0-9A-Za-z\-_]{35}/g,
    severity: 'critical',
    defaultEntropyFloor: 4.2,
  },
  {
    id: 'sec-openai-api-key',
    category: 'OpenAI API Key',
    description: 'OpenAI secret authentication token',
    pattern: /sk-(?:proj-|live-)?[a-zA-Z0-9_-]{32,96}/g,
    severity: 'critical',
    defaultEntropyFloor: 4.3,
  },
  {
    id: 'sec-anthropic-key',
    category: 'Anthropic API Key',
    description: 'Anthropic Claude API Secret Key',
    pattern: /sk-ant-[a-zA-Z0-9_\-]{40,90}/g,
    severity: 'critical',
    defaultEntropyFloor: 4.3,
  },
  {
    id: 'sec-slack-bot-token',
    category: 'Slack Bot Token',
    description: 'Slack Workspace Bot User OAuth Token',
    pattern: /xoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}/g,
    severity: 'high',
    defaultEntropyFloor: 3.8,
  },
  {
    id: 'sec-slack-user-token',
    category: 'Slack User Token',
    description: 'Slack Legacy User Token with administrative permissions',
    pattern: /xoxp-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}/g,
    severity: 'high',
    defaultEntropyFloor: 3.8,
  },
  {
    id: 'sec-stripe-secret',
    category: 'Stripe Secret Key',
    description: 'Stripe Live Secret Key with payment management capabilities',
    pattern: /sk_live_[0-9a-zA-Z]{24,34}/g,
    severity: 'critical',
    defaultEntropyFloor: 4.0,
  },
  {
    id: 'sec-stripe-restricted',
    category: 'Stripe Restricted Key',
    description: 'Stripe Live Restricted Key for specific API endpoints',
    pattern: /rk_live_[0-9a-zA-Z]{24,34}/g,
    severity: 'high',
    defaultEntropyFloor: 4.0,
  },
  {
    id: 'sec-rsa-private-key',
    category: 'Private Key (RSA/EC/DSA)',
    description: 'Unencrypted Asymmetric Cryptographic Private Key header',
    pattern: /-----BEGIN (?:RSA|EC|DSA|OPENSSH) PRIVATE KEY-----[\s\S]*?-----END (?:RSA|EC|DSA|OPENSSH) PRIVATE KEY-----/g,
    severity: 'critical',
    defaultEntropyFloor: 4.5,
  },
  {
    id: 'sec-pgp-private-key',
    category: 'PGP Private Key',
    description: 'Pretty Good Privacy Armored Private Key Block',
    pattern: /-----BEGIN PGP PRIVATE KEY BLOCK-----[\s\S]*?-----END PGP PRIVATE KEY BLOCK-----/g,
    severity: 'critical',
    defaultEntropyFloor: 4.5,
  },
  {
    id: 'sec-jwt-token',
    category: 'JSON Web Token (JWT)',
    description: 'RFC 7519 JSON Web Token containing claims and signature',
    pattern: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
    severity: 'medium',
    defaultEntropyFloor: 4.6,
  },
  {
    id: 'sec-postgres-uri',
    category: 'Database URI (PostgreSQL)',
    description: 'PostgreSQL connection string with embedded username and password',
    pattern: /postgres(?:ql)?:\/\/[a-zA-Z0-9_.-]+:(?:[^@\s/]+)@[a-zA-Z0-9_.-]+(?::[0-9]+)?\/[a-zA-Z0-9_.-]+/g,
    severity: 'critical',
    defaultEntropyFloor: 3.5,
  },
  {
    id: 'sec-mongodb-uri',
    category: 'Database URI (MongoDB)',
    description: 'MongoDB connection string with credentials',
    pattern: /mongodb(?:\+srv)?:\/\/[a-zA-Z0-9_.-]+:(?:[^@\s/]+)@[a-zA-Z0-9_.-]+/g,
    severity: 'critical',
    defaultEntropyFloor: 3.5,
  },
  {
    id: 'sec-mysql-uri',
    category: 'Database URI (MySQL)',
    description: 'MySQL database connection URL with credentials',
    pattern: /mysql:\/\/[a-zA-Z0-9_.-]+:(?:[^@\s/]+)@[a-zA-Z0-9_.-]+/g,
    severity: 'critical',
    defaultEntropyFloor: 3.5,
  },
  {
    id: 'sec-sendgrid-api-key',
    category: 'SendGrid API Key',
    description: 'Twilio SendGrid transactional email API key',
    pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
    severity: 'high',
    defaultEntropyFloor: 4.2,
  },
  {
    id: 'sec-twilio-account-sid',
    category: 'Twilio Account SID',
    description: 'Twilio Communication API Account SID',
    pattern: /AC[a-f0-9]{32}/gi,
    severity: 'medium',
    defaultEntropyFloor: 3.4,
  },
  {
    id: 'sec-azure-conn-string',
    category: 'Azure Connection String',
    description: 'Microsoft Azure Storage or Service Bus Connection String with SharedAccessKey',
    pattern: /DefaultEndpointsProtocol=https?;AccountName=[a-zA-Z0-9]+;AccountKey=[a-zA-Z0-9+/=]{60,100}/g,
    severity: 'critical',
    defaultEntropyFloor: 4.2,
  },
  {
    id: 'sec-discord-bot-token',
    category: 'Discord Bot Token',
    description: 'Discord Bot User Token',
    pattern: /[MN][A-Za-z\d]{23,26}\.[\w-]{6}\.[\w-]{27,38}/g,
    severity: 'high',
    defaultEntropyFloor: 4.1,
  },
  {
    id: 'sec-square-access-token',
    category: 'Square Access Token',
    description: 'Square Payments Production Access Token',
    pattern: /sq0atp-[0-9A-Za-z\-_]{22}/g,
    severity: 'critical',
    defaultEntropyFloor: 4.0,
  },
  {
    id: 'sec-shopify-access-token',
    category: 'Shopify Token',
    description: 'Shopify Admin or Custom App API Secret Token',
    pattern: /shpat_[a-fA-F0-9]{32}/g,
    severity: 'high',
    defaultEntropyFloor: 3.5,
  },
  {
    id: 'sec-npm-access-token',
    category: 'NPM Access Token',
    description: 'NPM registry publication authentication token',
    pattern: /npm_[a-zA-Z0-9]{36}/g,
    severity: 'critical',
    defaultEntropyFloor: 4.0,
  },
  {
    id: 'sec-gitlab-pat',
    category: 'GitLab Personal Access Token',
    description: 'GitLab Personal or Project Access Token',
    pattern: /glpat-[0-9a-zA-Z\-]{20}/g,
    severity: 'high',
    defaultEntropyFloor: 3.8,
  },
  {
    id: 'sec-hashicorp-vault-token',
    category: 'HashiCorp Vault Token',
    description: 'Vault Root or Service Token',
    pattern: /(?:s|hvs)\.[a-zA-Z0-9]{24,32}/g,
    severity: 'critical',
    defaultEntropyFloor: 4.0,
  },
  {
    id: 'sec-telegram-bot-token',
    category: 'Telegram Bot Token',
    description: 'Telegram Bot API Authentication Token',
    pattern: /[0-9]{9,10}:[a-zA-Z0-9_-]{35}/g,
    severity: 'medium',
    defaultEntropyFloor: 4.0,
  },
  {
    id: 'sec-mailchimp-key',
    category: 'Mailchimp API Key',
    description: 'Mailchimp Marketing API Key with datacenter suffix',
    pattern: /[0-9a-f]{32}-us[0-9]{1,2}/gi,
    severity: 'medium',
    defaultEntropyFloor: 3.5,
  },
  {
    id: 'sec-pypi-token',
    category: 'PyPI Upload Token',
    description: 'Python Package Index API Token for package deployment',
    pattern: /pypi-AgEIcHlwaS5vcmc[A-Za-z0-9\-_]{50,}/g,
    severity: 'critical',
    defaultEntropyFloor: 4.3,
  },
  {
    id: 'sec-datadog-api-key',
    category: 'Datadog API Key',
    description: 'Datadog Agent & Metric submission API Key',
    pattern: /(?:datadog_api_key|dd_api_key)\s*[:=]\s*['"]?([a-f0-9]{32})['"]?/gi,
    severity: 'high',
    defaultEntropyFloor: 3.6,
  },
  {
    id: 'sec-generic-high-entropy',
    category: 'Generic High-Entropy Key',
    description: 'Cryptographically random generic token or bearer credential',
    pattern: /(?:api[_-]?key|secret[_-]?token|auth[_-]?token|access[_-]?token)\s*[:=]\s*['"]([a-zA-Z0-9_-]{24,64})['"]/gi,
    severity: 'high',
    defaultEntropyFloor: 4.2,
  },
  {
    id: 'sec-hardcoded-password',
    category: 'Hardcoded Cleartext Password',
    description: 'Hardcoded password literal detected in configuration or source file',
    pattern: /(?:password|passwd|pwd|db_pass)\s*[:=]\s*['"]([^'"]{8,64})['"]/gi,
    severity: 'high',
    defaultEntropyFloor: 3.0,
  },
];

/**
 * Scans content using all 32+ rules and calculates Shannon entropy.
 */
export function scanTextForSecrets(
  content: string,
  filename: string,
  minEntropyThreshold: number = 0
): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const lines = content.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    for (const rule of SECRET_RULES) {
      // Reset lastIndex for global RegExp
      rule.pattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = rule.pattern.exec(line)) !== null) {
        // The token is either capture group 1 or the entire match
        const token = match[1] || match[0];
        const entropy = calculateShannonEntropy(token);

        if (entropy >= minEntropyThreshold) {
          findings.push({
            id: `${rule.id}-${filename}-${lineIndex + 1}-${match.index}`,
            category: rule.category,
            description: rule.description,
            matchedString: token,
            maskedString: maskSecret(token),
            entropy,
            file: filename,
            line: lineIndex + 1,
            severity: rule.severity,
          });
        }
      }
    }
  }

  return findings;
}

/**
 * Filters existing secret findings using a dynamic Shannon entropy threshold.
 */
export function filterSecretsByEntropy(
  findings: SecretFinding[],
  threshold: number
): SecretFinding[] {
  return findings.filter((f) => f.entropy >= threshold);
}
