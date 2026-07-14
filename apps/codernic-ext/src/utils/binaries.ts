import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export interface BinaryPaths {
    daemonPath: string;
    codernicPath: string;
    cliPath: string;
}

/**
 * Résout de manière dynamique et sécurisée l'emplacement des binaires
 * pré-compilés embarqués au sein de l'extension VS Code.
 * @param extensionPath Chemin racine d'activation de l'extension
 */
export function resolvePlatformBinaries(extensionPath: string): BinaryPaths {
    const platform = os.platform();
    const arch = os.arch();
    
    let targetTriple = '';
    let exeExtension = '';

    // Détermination de la cible de compilation (target triple)
    switch (platform) {
        case 'linux':
            if (arch === 'x64') {
                targetTriple = 'x86_64-unknown-linux-gnu';
            } else if (arch === 'arm64') {
                targetTriple = 'aarch64-unknown-linux-gnu';
            }
            break;
            
        case 'darwin':
            if (arch === 'x64') {
                targetTriple = 'x86_64-apple-darwin';
            } else if (arch === 'arm64') {
                targetTriple = 'aarch64-apple-darwin';
            }
            break;
            
        case 'win32':
            if (arch === 'x64') {
                targetTriple = 'x86_64-pc-windows-msvc';
                exeExtension = '.exe';
            }
            break;
            
        default:
            throw new Error(`Plateforme non supportée : ${platform} (${arch})`);
    }

    if (!targetTriple) {
        throw new Error(`Architecture matérielle non supportée : ${platform} (${arch})`);
    }

    const binDirectory = path.join(extensionPath, 'bin');
    
    const paths: BinaryPaths = {
        daemonPath: path.join(binDirectory, `ai_agencee_daemon${exeExtension}`),
        codernicPath: path.join(binDirectory, `ai_agencee_codernic${exeExtension}`),
        cliPath: path.join(binDirectory, `ai_agencee_cli${exeExtension}`),
    };

    // Validation défensive de l'existence physique de chaque binaire
    for (const [key, filePath] of Object.entries(paths)) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Binaire critique requis absent de la distribution : ${key} à l'emplacement ${filePath}`);
        }
        
        // Application dynamique des droits d'exécution (chmod +x) sur Unix/macOS
        if (platform !== 'win32') {
            try {
                const stats = fs.statSync(filePath);
                const currentMode = stats.mode;
                // Imposer strictement le masque 0755
                const targetMode = 0o755; 
                if ((currentMode & 0o777) !== targetMode) {
                    fs.chmodSync(filePath, targetMode);
                    console.log(`[INFO] Attribution stricte des droits 0755 sur : ${filePath}`);
                }
            } catch (err: unknown) {
                console.warn(`[WARN] Échec de la configuration des permissions pour ${filePath} : ${(err instanceof Error ? err.message : String(err))}`);
            }
        }
    }

    return paths;
}
