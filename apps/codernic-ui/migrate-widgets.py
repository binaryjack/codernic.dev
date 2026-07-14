import os
import shutil
import re

# Mapping of current widget file paths to target feature names
MAPPING = {
    'src/widgets/chat-widget.tsx': 'chat',
    'src/widgets/session-widget.tsx': 'sessions',
    'src/widgets/artifacts-widget.tsx': 'artifacts',
    'src/widgets/erathos-widget.tsx': 'erathos',
    'src/widgets/galileus-router-widget.tsx': 'galileus-router',
    'src/widgets/model-hub-widget.tsx': 'model-hub',
    'src/widgets/analyse-widget.tsx': 'analyse',
    'src/widgets/agents-widget.tsx': 'agents',
    'src/widgets/dags-widget.tsx': 'dags',
    'src/widgets/techs-widget.tsx': 'techs',
    'src/widgets/enterprise-chatbot-widget.tsx': 'enterprise-chatbot',
    'src/widgets/introspection-widget.tsx': 'introspection',
    'src/widgets/pirsig-report-widget.tsx': 'diagnostic-dashboard',
    'src/widgets/settings/models-widget.tsx': 'settings',
    'src/widgets/settings/rules-widget.tsx': 'settings',
    'src/widgets/settings/prompts-widget.tsx': 'settings',
    'src/widgets/settings/routing-widget.tsx': 'settings',
    'src/widgets/settings/system-widget.tsx': 'settings',
    'src/widgets/diagnostic-dashboard/pirsig-widget.tsx': 'diagnostic-dashboard',
    'src/widgets/diagnostic-dashboard/agent-events-widget.tsx': 'diagnostic-dashboard',
}

def migrate():
    for old_path, feature in MAPPING.items():
        if not os.path.exists(old_path):
            print(f"Skipping {old_path}, does not exist.")
            continue
            
        filename = os.path.basename(old_path)
        # e.g. chat-widget.tsx -> chat.widget.tsx
        new_filename = filename.replace('-widget', '.widget')
        
        new_dir = f'src/features/{feature}/widget'
        new_path = f'{new_dir}/{new_filename}'
        
        os.makedirs(new_dir, exist_ok=True)
        
        # Calculate relative path adjustment
        old_depth = len(old_path.split('/')) - 1 # e.g. src/widgets/chat-widget.tsx -> 2
        new_depth = len(new_path.split('/')) - 1 # e.g. src/features/chat/widget/chat.widget.tsx -> 4
        depth_diff = new_depth - old_depth
        
        with open(old_path, 'r') as f:
            content = f.read()
            
        # Adjust relative imports.
        # This is a bit naive, but since we know all are just moving deeper:
        # Every '../' needs an additional '../' for each level of depth diff.
        # Wait, if old_depth=2 ('src/widgets/'), new_depth=4 ('src/features/chat/widget/'), we add '../../' to any '../'
        # e.g., '../features' becomes '../../../features'
        if depth_diff > 0:
            extra_dots = '../' * depth_diff
            # Replace '../' with extra_dots + '../'
            content = re.sub(r"from\s+['\"](\.\./)", r"from '" + extra_dots + r"\1", content)
            content = re.sub(r"import\s+['\"](\.\./)", r"import '" + extra_dots + r"\1", content)
            
            # Replace './' with extra_dots + './'
            # Wait, './' means it was importing from the same directory (src/widgets).
            # So if it's now in src/features/chat/widget/, to point to src/widgets, it needs to go up new_depth - 1 levels, then down to widgets.
            # actually this is too complex. We'll just replace './' with extra_dots + '../widgets/'
            content = re.sub(r"from\s+['\"](\./)", r"from '" + extra_dots + r"../widgets/", content)
            
        with open(new_path, 'w') as f:
            f.write(content)
            
        os.remove(old_path)
        print(f"Moved {old_path} -> {new_path}")

if __name__ == '__main__':
    migrate()
