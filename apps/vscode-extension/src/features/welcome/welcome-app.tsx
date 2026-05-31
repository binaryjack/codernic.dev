import { CONFIG } from '../../shared/config';
import { vscode } from '../../webview/vscode-api';
import { FeatureCard } from './components/feature-card';
import { styles } from './welcome-app.styles';

type DemoTemplate = 'security' | 'refactoring' | 'multi-agent';
type WorkflowTemplate =
  | 'security-scan'
  | 'code-review'
  | 'refactoring'
  | 'documentation'
  | 'testing'
  | 'full-stack';

/**
 * Welcome panel React component
 */
export function WelcomeApp() {
  const handleRunDemo = (template: DemoTemplate) => {
    vscode.postMessage({ command: 'runDemo', template });
  };

  const handleCreateWorkflow = (template: WorkflowTemplate) => {
    vscode.postMessage({ command: 'createWorkflow', template });
  };

  const handleOpenSetup = () => {
    vscode.postMessage({ command: 'openSetup' });
  };

  const handleDismiss = () => {
    vscode.postMessage({ command: 'dismiss' });
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <h1 style={styles.h1}>🚀 Welcome to AI Agencee</h1>
        <p style={styles.subtitle}>Quality-First AI Agent Orchestration with Zero Hallucinations</p>

        <div style={styles.section}>
          <h2 style={styles.h2}>
            ✨ Try a Demo <span style={{ ...styles.badge, ...styles.costBadge }}>$0.00</span>
          </h2>
          <p style={styles.p}>
            Experience AI Agencee with zero-cost demos using our mock provider.
          </p>
          <div style={styles.buttonGroup}>
            <button style={styles.button} onClick={() => handleRunDemo('security')}>
              🔐 Security Scan Demo
            </button>
            <button style={styles.button} onClick={() => handleRunDemo('refactoring')}>
              🔧 Refactoring Demo
            </button>
            <button style={styles.button} onClick={() => handleRunDemo('multi-agent')}>
              ⚡ Multi-Agent Demo
            </button>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>📋 Create Your First Workflow</h2>
          <div style={styles.featureGrid}>
            <FeatureCard
              title="🔐 Security Scan"
              description="OWASP Top 10 analysis"
              cost="$0.05-$0.15"
              level="Beginner"
              onClick={() => handleCreateWorkflow('security-scan')}
              styles={styles}
            />
            <FeatureCard
              title="👀 Code Review"
              description="Architecture & best practices"
              cost="$0.08-$0.20"
              level="Beginner"
              onClick={() => handleCreateWorkflow('code-review')}
              styles={styles}
            />
            <FeatureCard
              title="🔧 Refactoring"
              description="Analyze → Refactor → Test"
              cost="$0.15-$0.40"
              level="Intermediate"
              onClick={() => handleCreateWorkflow('refactoring')}
              styles={styles}
            />
            <FeatureCard
              title="📚 Documentation"
              description="API docs, README, comments"
              cost="$0.10-$0.25"
              level="Beginner"
              onClick={() => handleCreateWorkflow('documentation')}
              styles={styles}
            />
            <FeatureCard
              title="🧪 Testing"
              description="Generate & run unit tests"
              cost="$0.08-$0.20"
              level="Beginner"
              onClick={() => handleCreateWorkflow('testing')}
              styles={styles}
            />
            <FeatureCard
              title="🏗️ Full Stack"
              description="5-lane parallel development"
              cost="$0.30-$0.80"
              level="Advanced"
              onClick={() => handleCreateWorkflow('full-stack')}
              styles={styles}
            />
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>⚙️ Setup & Configuration</h2>
          <div style={styles.buttonGroup}>
            <button style={styles.button} onClick={handleOpenSetup}>
              Open Settings
            </button>
            <button style={{ ...styles.button, ...styles.buttonSecondary }} onClick={handleDismiss}>
              I&apos;ll Do This Later
            </button>
          </div>
        </div>

        <div style={styles.footer}>
          <p>
            <a style={styles.footerLink} href={CONFIG.DOCS_URL}>
              Documentation
            </a>{' '}
            •{' '}
            <a style={styles.footerLink} href={CONFIG.ISSUES_URL}>
              Report Issue
            </a>{' '}
            •{' '}
            <a style={styles.footerLink} href={CONFIG.GITHUB_URL}>
              GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
