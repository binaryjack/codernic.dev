const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            processDir(fullPath);
        } else if (entry.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            
            if (content.includes('Generator<any, any, any>')) {
                content = content.replace(/Generator<any, any, any>/g, 'Generator<unknown, void, unknown>');
                changed = true;
            }
            if (content.includes('(error: any)')) {
                content = content.replace(/\(error: any\)/g, '(error: unknown)');
                changed = true;
            }
            if (content.includes('} catch (e: any) {')) {
                content = content.replace(/\} catch \(e: any\) \{/g, '} catch (e: unknown) {');
                changed = true;
            }
            if (content.includes('} catch(e: any) {')) {
                content = content.replace(/\} catch\(e: any\) \{/g, '} catch(e: unknown) {');
                changed = true;
            }
            
            if (changed) {
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

processDir('src');
console.log("Done fixing Generators and catches!");
